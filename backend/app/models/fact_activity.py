from __future__ import annotations
from typing import Optional

from datetime import datetime

from sqlalchemy import BigInteger, Float, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FactActivity(Base):
    __tablename__ = "fact_activities"

    activity_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    athlete_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("dim_athlete.athlete_id"), nullable=False, index=True)
    date_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("dim_date.date_id"), index=True)
    activity_type_id: Mapped[Optional[int]] = mapped_column(Integer)
    device_id: Mapped[Optional[int]] = mapped_column(Integer)

    distance_meters: Mapped[Optional[float]] = mapped_column(Float)
    moving_time_sec: Mapped[Optional[int]] = mapped_column(Integer)
    elapsed_time_sec: Mapped[Optional[int]] = mapped_column(Integer)
    elevation_gain_m: Mapped[Optional[float]] = mapped_column(Float)

    avg_pace_sec_km: Mapped[Optional[float]] = mapped_column(Float, index=True)
    best_pace_sec_km: Mapped[Optional[float]] = mapped_column(Float)
    avg_heartrate: Mapped[Optional[float]] = mapped_column(Float)
    max_heartrate: Mapped[Optional[int]] = mapped_column(Integer)
    calories: Mapped[Optional[float]] = mapped_column(Float)
    training_load: Mapped[Optional[float]] = mapped_column(Float)
    kudos_count: Mapped[int] = mapped_column(Integer, default=0)

    hr_zone_1_pct: Mapped[Optional[float]] = mapped_column(Float)
    hr_zone_2_pct: Mapped[Optional[float]] = mapped_column(Float)
    hr_zone_3_pct: Mapped[Optional[float]] = mapped_column(Float)
    hr_zone_4_pct: Mapped[Optional[float]] = mapped_column(Float)
    hr_zone_5_pct: Mapped[Optional[float]] = mapped_column(Float)

    activity_type: Mapped[Optional[str]] = mapped_column(String(50), index=True)
    cluster_label: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    strava_name: Mapped[Optional[str]] = mapped_column(String(255))
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
