from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Float, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FactActivity(Base):
    __tablename__ = "fact_activities"

    activity_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    athlete_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dim_athlete.athlete_id"), nullable=False, index=True)
    date_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("dim_date.date_id"), index=True)
    activity_type_id: Mapped[int | None] = mapped_column(Integer)
    device_id: Mapped[int | None] = mapped_column(Integer)

    distance_meters: Mapped[float | None] = mapped_column(Float)
    moving_time_sec: Mapped[int | None] = mapped_column(Integer)
    elapsed_time_sec: Mapped[int | None] = mapped_column(Integer)
    elevation_gain_m: Mapped[float | None] = mapped_column(Float)

    avg_pace_sec_km: Mapped[float | None] = mapped_column(Float, index=True)
    best_pace_sec_km: Mapped[float | None] = mapped_column(Float)
    avg_heartrate: Mapped[float | None] = mapped_column(Float)
    max_heartrate: Mapped[int | None] = mapped_column(Integer)
    calories: Mapped[float | None] = mapped_column(Float)
    training_load: Mapped[float | None] = mapped_column(Float)
    kudos_count: Mapped[int] = mapped_column(Integer, default=0)

    hr_zone_1_pct: Mapped[float | None] = mapped_column(Float)
    hr_zone_2_pct: Mapped[float | None] = mapped_column(Float)
    hr_zone_3_pct: Mapped[float | None] = mapped_column(Float)
    hr_zone_4_pct: Mapped[float | None] = mapped_column(Float)
    hr_zone_5_pct: Mapped[float | None] = mapped_column(Float)

    cluster_label: Mapped[str | None] = mapped_column(String(20), index=True)
    strava_name: Mapped[str | None] = mapped_column(String(255))
    start_date: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
