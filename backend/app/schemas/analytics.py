from __future__ import annotations

from pydantic import BaseModel


class HRZoneDistribution(BaseModel):
    zone_1_pct: float
    zone_2_pct: float
    zone_3_pct: float
    zone_4_pct: float
    zone_5_pct: float


class ConsistencyReport(BaseModel):
    activities_per_week: float
    active_weeks: int
    total_weeks: int
    consistency_score: float  # 0–100


class TrendPoint(BaseModel):
    period: str
    distance_km: float
    activities: int
    avg_pace_sec_km: float | None
    avg_heartrate: float | None


class ComparisonReport(BaseModel):
    current_distance_km: float
    previous_distance_km: float
    distance_delta_pct: float
    current_avg_pace: float | None
    previous_avg_pace: float | None
    pace_delta_pct: float | None


class ClusterPoint(BaseModel):
    activity_id: int
    start_date: str | None
    avg_pace_sec_km: float | None
    distance_km: float | None
    avg_heartrate: float | None
    elevation_gain_m: float | None
    cluster_label: str | None


class TrainingProfile(BaseModel):
    leve_pct: float
    moderado_pct: float
    intenso_pct: float
    dominant_cluster: str
