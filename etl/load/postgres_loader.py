"""
Carrega DataFrames transformados no PostgreSQL via upsert.
Usa psycopg2.extras.execute_values para inserções em lote.
"""
from __future__ import annotations

import math
from datetime import datetime
from typing import Any

import pandas as pd
import psycopg2
import psycopg2.extras
from loguru import logger
from sqlalchemy import create_engine, text

from config import DATABASE_URL

_ssl_args = {"sslmode": "require"} if any(h in (DATABASE_URL or "") for h in ("neon.tech", "supabase")) else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=_ssl_args)


def _sanitize(val: Any) -> Any:
    """Replace NaN / Inf with None so psycopg2 binds them as NULL."""
    try:
        if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
            return None
    except (TypeError, ValueError):
        pass
    # Catch numpy / pandas NA-like objects that don't pass isinstance(float)
    try:
        import numpy as np
        if isinstance(val, (np.floating, np.integer)) and np.isnan(val):
            return None
    except Exception:
        pass
    return val


def _to_clean_records(df: pd.DataFrame) -> list[dict]:
    raw = df.to_dict("records")
    return [{k: _sanitize(v) for k, v in row.items()} for row in raw]


def upsert_activities(df: pd.DataFrame, athlete_id: int) -> int:
    """Upsert em fact_activities com execute_values (uma só round-trip por batch)."""
    if df.empty:
        return 0

    df = df.copy()
    df["athlete_id"] = athlete_id
    df["updated_at"] = datetime.utcnow()

    # Ensure required columns exist
    for col in ["date_id", "strava_name", "best_pace_sec_km", "activity_type"]:
        if col not in df.columns:
            df[col] = None

    COLS = [
        "activity_id", "athlete_id", "date_id", "strava_name", "start_date",
        "distance_meters", "moving_time_sec", "elapsed_time_sec", "elevation_gain_m",
        "avg_pace_sec_km", "avg_heartrate", "max_heartrate", "calories",
        "training_load", "kudos_count", "activity_type", "updated_at",
    ]
    available = [c for c in COLS if c in df.columns]
    records = _to_clean_records(df[available])

    sql = f"""
        INSERT INTO fact_activities ({", ".join(available)})
        VALUES %s
        ON CONFLICT (activity_id) DO UPDATE SET
            strava_name    = EXCLUDED.strava_name,
            kudos_count    = EXCLUDED.kudos_count,
            calories       = EXCLUDED.calories,
            activity_type  = EXCLUDED.activity_type,
            avg_pace_sec_km = EXCLUDED.avg_pace_sec_km,
            updated_at     = EXCLUDED.updated_at
    """

    inserted = 0
    batch_size = 200

    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            for i in range(0, len(records), batch_size):
                batch = records[i: i + batch_size]
                rows = [tuple(r.get(c) for c in available) for r in batch]
                try:
                    psycopg2.extras.execute_values(cur, sql, rows, page_size=batch_size)
                    conn.commit()
                    inserted += len(batch)
                except psycopg2.errors.ForeignKeyViolation:
                    conn.rollback()
                    # date_id FK missing — retry with date_id = NULL
                    date_idx = available.index("date_id") if "date_id" in available else None
                    if date_idx is not None:
                        rows_fixed = [
                            tuple(None if j == date_idx else v for j, v in enumerate(row))
                            for row in rows
                        ]
                    else:
                        rows_fixed = rows
                    try:
                        psycopg2.extras.execute_values(cur, sql, rows_fixed, page_size=batch_size)
                        conn.commit()
                        inserted += len(batch)
                    except Exception as exc:
                        conn.rollback()
                        logger.warning(f"Batch {i}-{i+len(batch)} failed after FK retry: {exc!r}")
                except Exception as exc:
                    conn.rollback()
                    logger.warning(f"Batch {i}-{i+len(batch)} failed: {exc!r}")

    logger.info(f"Upserted {inserted}/{len(records)} activities for athlete {athlete_id}")
    return inserted


def update_cluster_labels(df: pd.DataFrame) -> int:
    """Atualiza cluster_label via COPY + UPDATE JOIN (uma só round-trip)."""
    if df.empty or "cluster_label" not in df.columns:
        return 0

    rows = df[["activity_id", "cluster_label"]].dropna(subset=["activity_id"])
    if rows.empty:
        return 0

    data = [(int(r.activity_id), str(r.cluster_label)) for r in rows.itertuples(index=False)]

    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "CREATE TEMP TABLE _cl (activity_id BIGINT PRIMARY KEY, cluster_label TEXT) ON COMMIT DROP"
            )
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO _cl (activity_id, cluster_label) VALUES %s",
                data,
            )
            cur.execute("""
                UPDATE fact_activities fa
                SET cluster_label = c.cluster_label
                FROM _cl c
                WHERE fa.activity_id = c.activity_id
            """)
            updated = cur.rowcount
        conn.commit()

    logger.info(f"Updated {updated} cluster labels")
    return updated


def log_etl_run(
    athlete_id: int, rows_processed: int, errors: int, duration_sec: float, status: str
) -> None:
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO etl_logs (athlete_id, rows_processed, errors, duration_sec, status, run_at)
                VALUES (:athlete_id, :rows_processed, :errors, :duration_sec, :status, NOW())
            """),
            {
                "athlete_id": athlete_id,
                "rows_processed": rows_processed,
                "errors": errors,
                "duration_sec": round(duration_sec, 2),
                "status": status,
            },
        )
