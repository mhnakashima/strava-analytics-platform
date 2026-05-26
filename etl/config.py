import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/strava_analytics")
STRAVA_CLIENT_ID: str = os.getenv("STRAVA_CLIENT_ID", "")
STRAVA_CLIENT_SECRET: str = os.getenv("STRAVA_CLIENT_SECRET", "")
STRAVA_API_BASE: str = "https://www.strava.com/api/v3"
STRAVA_TOKEN_URL: str = "https://www.strava.com/oauth/token"

ETL_BATCH_SIZE: int = int(os.getenv("ETL_BATCH_SIZE", "100"))
ETL_SCHEDULE_HOUR: int = int(os.getenv("ETL_SCHEDULE_HOUR", "2"))
ETL_SCHEDULE_MINUTE: int = int(os.getenv("ETL_SCHEDULE_MINUTE", "0"))
ETL_LOG_LEVEL: str = os.getenv("ETL_LOG_LEVEL", "INFO")
