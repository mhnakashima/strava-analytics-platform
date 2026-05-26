from __future__ import annotations
from typing import Optional

from datetime import datetime

from sqlalchemy import BigInteger, Float, Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DimAthlete(Base):
    __tablename__ = "dim_athlete"

    athlete_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    strava_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False)
    firstname: Mapped[Optional[str]] = mapped_column(String(100))
    lastname: Mapped[Optional[str]] = mapped_column(String(100))
    city: Mapped[Optional[str]] = mapped_column(String(100))
    country: Mapped[Optional[str]] = mapped_column(String(100))
    weight_kg: Mapped[Optional[float]] = mapped_column(Float)
    max_heartrate: Mapped[Optional[int]] = mapped_column(Integer)
    ftp: Mapped[Optional[int]] = mapped_column(Integer)
    strava_access_token: Mapped[Optional[str]] = mapped_column(String(255))
    strava_refresh_token: Mapped[Optional[str]] = mapped_column(String(255))
    strava_token_expires_at: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
