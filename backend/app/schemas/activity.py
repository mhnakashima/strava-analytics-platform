from __future__ import annotations
from typing import Optional

from datetime import datetime

from pydantic import BaseModel, Field


class ActivitySummary(BaseModel):
    activity_id: int
    strava_name: Optional[str]
    start_date: Optional[datetime]
    activity_type: Optional[str]
    distance_km: Optional[float] = Field(None, description="Distância em km")
    moving_time_sec: Optional[int]
    avg_pace_sec_km: Optional[float]
    avg_heartrate: Optional[float]
    elevation_gain_m: Optional[float]
    cluster_label: Optional[str]

    model_config = {"from_attributes": True}

    @property
    def distance_km_computed(self) -> Optional[float]:
        if hasattr(self, "_distance_meters") and self._distance_meters:
            return round(self._distance_meters / 1000, 2)
        return None


class ActivityDetail(ActivitySummary):
    elapsed_time_sec: Optional[int]
    max_heartrate: Optional[int]
    calories: Optional[float]
    training_load: Optional[float]
    kudos_count: int
    best_pace_sec_km: Optional[float]
    hr_zone_1_pct: Optional[float]
    hr_zone_2_pct: Optional[float]
    hr_zone_3_pct: Optional[float]
    hr_zone_4_pct: Optional[float]
    hr_zone_5_pct: Optional[float]


class ActivityKPIs(BaseModel):
    total_distance_km: float
    total_activities: int
    avg_pace_sec_km: Optional[float]
    best_pace_sec_km: Optional[float]
    avg_heartrate: Optional[float]
    total_elevation_m: float
    total_calories: float
    consistency_per_week: float
    avg_training_load: Optional[float]


class TimelinePoint(BaseModel):
    date: str
    distance_km: float
    avg_pace_sec_km: Optional[float]
    avg_heartrate: Optional[float]
    training_load: Optional[float]


class ActivityFilters(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    activity_type: Optional[str] = None
    intensity: Optional[str] = None
    min_distance_km: Optional[float] = None
    max_distance_km: Optional[float] = None
    limit: int = Field(20, ge=1, le=100)
    cursor: Optional[str] = None
