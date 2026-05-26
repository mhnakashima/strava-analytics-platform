"""
Carrega DataFrames transformados no PostgreSQL via upsert.
"""
from __future__ import annotations

import math
from datetime import datetime

import pandas as pd
from loguru import logger
from sqlalchemy import create_engine, text

from config import DATABASE_URL

_ssl_args = {"sslmode": "require"} if any(h in (DATABASE_URL or "") for h in ("neon.tech", "supabase")) else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=_ssl_args)

_STMT = text("""
    INSERT INTO fact_activities (
        activity_id, athlete_id, date_id, strava_name, start_date,
        distance_meters, moving_time_sec, elapsed_time_sec, elevation_gain_m,
        avg_pace_sec_km, avg_heartrate, max_heartrate, calories, training_load,
        kudos_count, updated_at
    )
    VALUES (
        :activity_id, :athlete_id, :date_id, :strava_name, :start_date,
        :distance_meters, :moving_time_sec, :elapsed_time_sec, :elevation_gain_m,
        :avg_pace_sec_km, :avg_heartrate, :max_heartrate, :calories, :training_load,
        :kudos_count, :updated_at
    )
    ON CONFLICT (activity_id) DO UPDATE SET
        strava_name = EXCLUDED.strava_name,
        kudos_count = EXCLUDED.kudos_count,
        calories = EXCLUDED.calories,
        updated_at = EXCLUDED.updated_at
""")


def _sanitize(val: object) -> object:
    """Replace NaN/Inf with None so psycopg2 can bind them as NULL."""
    if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
        return None
    return val


def _to_clean_records(df: pd.DataFrame) -> list[dict]:
    raw = df.to_dict("records")
    return [{k: _sanitize(v) for k, v in row.items()} for row in raw]


def upsert_activities(df: pd.DataFrame, athlete_id: int) -> int:
    """Upsert em fact_activities. Retorna número de linhas inseridas."""
    if df.empty:
        return 0

    columns = [
        "activity_id", "athlete_id", "date_id", "strava_name", "start_date",
        "distance_meters", "moving_time_sec", "elapsed_time_sec",
        "elevation_gain_m", "avg_pace_sec_km", "best_pace_sec_km",
        "avg_heartrate", "max_heartrate", "calories", "training_load",
        "kudos_count",
    ]

    df = df.copy()
    df["athlete_id"] = athlete_id
    df["updated_at"] = datetime.utcnow()
    columns.append("updated_at")

    available = [c for c in columns if c in df.columns]
    records = _to_clean_records(df[available])

    inserted = 0
    skipped = 0

    # Use savepoints so one bad row doesn't abort the whole transaction.
    with engine.connect() as conn:
        for record in records:
            record.setdefault("date_id", None)
            record.setdefault("strava_name", None)
            record.setdefault("best_pace_sec_km", None)
            sp = conn.begin_nested()
            try:
                conn.execute(_STMT, record)
                sp.commit()
                inserted += 1
            except Exception as exc:
                sp.rollback()
                skipped += 1
                if skipped <= 5:  # log only first few to avoid noise
                    logger.warning(f"Skipped activity {record.get('activity_id')}: {exc!r}")
        conn.commit()

    if skipped:
        logger.warning(f"Skipped {skipped} activities due to errors")
    logger.info(f"Upserted {inserted} activities for athlete {athlete_id}")
    return inserted


def update_cluster_labels(df: pd.DataFrame) -> int:
    """Atualiza cluster_label em fact_activities para atividades com predição ML."""
    if df.empty or "cluster_label" not in df.columns:
        return 0

    updated = 0
    with engine.begin() as conn:
        for _, row in df[["activity_id", "cluster_label"]].iterrows():
            conn.execute(
                text("UPDATE fact_activities SET cluster_label = :label WHERE activity_id = :aid"),
                {"label": row["cluster_label"], "aid": int(row["activity_id"])},
            )
            updated += 1
    logger.info(f"Updated {updated} cluster labels")
    return updated


def log_etl_run(athlete_id: int, rows_processed: int, errors: int, duration_sec: float, status: str) -> None:
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO etl_logs (athlete_id, rows_processed, errors, duration_sec, status, run_at)
                VALUES (:athlete_id, :rows_processed, :errors, :duration_sec, :status, NOW())
            """),
            {"athlete_id": athlete_id, "rows_processed": rows_processed, "errors": errors, "duration_sec": round(duration_sec, 2), "status": status},
        )
