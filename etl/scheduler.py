"""
APScheduler: executa o ETL diariamente às 02:00 UTC.
"""
import signal
import sys

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from config import ETL_LOG_LEVEL, ETL_SCHEDULE_HOUR, ETL_SCHEDULE_MINUTE
from runner import run_all

logger.remove()
logger.add(sys.stdout, level=ETL_LOG_LEVEL, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}")
logger.add("logs/etl_{time:YYYY-MM-DD}.log", level=ETL_LOG_LEVEL, rotation="1 day", retention="30 days")

scheduler = BlockingScheduler(timezone="UTC")


def handle_shutdown(signum, frame):
    logger.info("Shutdown signal received — stopping scheduler")
    scheduler.shutdown(wait=False)
    sys.exit(0)


signal.signal(signal.SIGTERM, handle_shutdown)
signal.signal(signal.SIGINT, handle_shutdown)

scheduler.add_job(
    run_all,
    trigger=CronTrigger(hour=ETL_SCHEDULE_HOUR, minute=ETL_SCHEDULE_MINUTE),
    id="daily_etl",
    name="Daily Strava ETL",
    replace_existing=True,
    misfire_grace_time=3600,
)

logger.info(f"Scheduler started — ETL runs daily at {ETL_SCHEDULE_HOUR:02d}:{ETL_SCHEDULE_MINUTE:02d} UTC")

scheduler.start()
