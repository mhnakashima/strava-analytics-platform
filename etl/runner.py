from __future__ import annotations

"""
Executa o pipeline ETL completo para todos os atletas com tokens válidos.
"""
import time
from datetime import datetime, timezone

from loguru import logger
from sqlalchemy import create_engine, text

from config import DATABASE_URL
from extract.strava_client import fetch_activities, refresh_access_token
from load.postgres_loader import log_etl_run, update_cluster_labels, upsert_activities
from ml.train import infer, train
from transform.metrics import add_rolling_metrics, transform_activities

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def get_athletes_with_tokens() -> list[dict]:
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT athlete_id, strava_id, strava_access_token,
                       strava_refresh_token, strava_token_expires_at,
                       max_heartrate
                FROM dim_athlete
                WHERE strava_refresh_token IS NOT NULL
            """)
        ).fetchall()
    return [dict(r._mapping) for r in rows]


def ensure_valid_token(athlete: dict) -> str | None:
    now_ts = int(datetime.now(timezone.utc).timestamp())
    expires_at = athlete.get("strava_token_expires_at") or 0

    if expires_at <= now_ts + 300:
        logger.info(f"Refreshing token for athlete {athlete['athlete_id']}")
        try:
            token_data = refresh_access_token(athlete["strava_refresh_token"])
            new_token = token_data.get("access_token")
            new_refresh = token_data.get("refresh_token")
            new_expires = token_data.get("expires_at")
            with engine.begin() as conn:
                conn.execute(
                    text("""
                        UPDATE dim_athlete SET
                            strava_access_token = :token,
                            strava_refresh_token = :refresh,
                            strava_token_expires_at = :expires
                        WHERE athlete_id = :aid
                    """),
                    {"token": new_token, "refresh": new_refresh, "expires": new_expires, "aid": athlete["athlete_id"]},
                )
            return new_token
        except Exception as exc:
            logger.error(f"Token refresh failed for athlete {athlete['athlete_id']}: {exc}")
            return None
    return athlete["strava_access_token"]


def run_for_athlete(athlete: dict) -> None:
    athlete_id = athlete["athlete_id"]
    start = time.time()
    logger.info(f"Starting ETL for athlete {athlete_id}")
    errors = 0

    try:
        access_token = ensure_valid_token(athlete)
        if not access_token:
            logger.error(f"No valid token for athlete {athlete_id} — skipping")
            return

        raw_activities = fetch_activities(access_token)
        if not raw_activities:
            logger.info(f"No new activities for athlete {athlete_id}")
            return

        max_hr = athlete.get("max_heartrate") or 180
        df = transform_activities(raw_activities, athlete_max_hr=max_hr)
        df = add_rolling_metrics(df)

        rows_inserted = upsert_activities(df, athlete_id)

        if len(df) >= 10:
            cluster_labels = infer(df)
            df["cluster_label"] = cluster_labels
            update_cluster_labels(df[["activity_id", "cluster_label"]])

        duration = time.time() - start
        log_etl_run(athlete_id, rows_inserted, errors, duration, "success")
        logger.info(f"ETL completed for athlete {athlete_id} — {rows_inserted} rows in {duration:.1f}s")

    except Exception as exc:
        errors += 1
        duration = time.time() - start
        log_etl_run(athlete_id, 0, errors, duration, "error")
        logger.error(f"ETL failed for athlete {athlete_id}: {exc}")


def run_all() -> None:
    logger.info("=== ETL Pipeline started ===")
    athletes = get_athletes_with_tokens()
    logger.info(f"Found {len(athletes)} athletes to process")
    for athlete in athletes:
        run_for_athlete(athlete)
    logger.info("=== ETL Pipeline finished ===")


if __name__ == "__main__":
    import sys

    if "--once" in sys.argv or len(sys.argv) == 1:
        # Modo direto: usado pelo GitHub Actions e execução manual
        run_all()
    else:
        print("Usage: python runner.py --once")
