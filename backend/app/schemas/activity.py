from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ActivitySummary(BaseModel):
    activity_id: int
    strava_name: str | None
    start_date: datetime | None
    distance_km: float | None = Field(None, description="Distância em km")
    moving_time_sec: int | None
    avg_pace_sec_km: float | None
    avg_heartrate: float | None
    elevation_gain_m: float | None
    cluster_label: str | None

    model_config = {"from_attributes": True}

    @property
    def distance_km_computed(self) -> float | None:
        if hasattr(self, "_distance_meters") and self._distance_meters:
            return round(self._distance_meters / 1000, 2)
        return None


class ActivityDetail(ActivitySummary):
    elapsed_time_sec: int | None
    max_heartrate: int | None
    calories: float | None
    training_load: float | None
    kudos_count: int
    hr_zone_1_pct: float | None
    hr_zone_2_pct: float | None
    hr_zone_3_pct: float | None
    hr_zone_4_pct: float | None
    hr_zone_5_pct: float | None


class ActivityKPIs(BaseModel):
    total_distance_km: float
    total_activities: int
    avg_pace_sec_km: float | None
    best_pace_sec_km: float | None
    avg_heartrate: float | None
    total_elevation_m: float
    total_calories: float
    consistency_per_week: float
    avg_training_load: float | None


class TimelinePoint(BaseModel):
    date: str
    distance_km: float
    avg_pace_sec_km: float | None
    avg_heartrate: float | None
    training_load: float | None


class ActivityFilters(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
    activity_type: str | None = None
    intensity: str | None = None
    min_distance_km: float | None = None
    max_distance_km: float | None = None
    limit: int = Field(20, ge=1, le=100)
    cursor: str | None = None
