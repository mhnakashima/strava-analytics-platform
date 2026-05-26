from __future__ import annotations
from typing import Optional

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
    avg_pace_sec_km: Optional[float]
    avg_heartrate: Optional[float]


class ComparisonReport(BaseModel):
    current_distance_km: float
    previous_distance_km: float
    distance_delta_pct: float
    current_avg_pace: Optional[float]
    previous_avg_pace: Optional[float]
    pace_delta_pct: Optional[float]


class ClusterPoint(BaseModel):
    activity_id: int
    start_date: Optional[str]
    avg_pace_sec_km: Optional[float]
    distance_km: Optional[float]
    avg_heartrate: Optional[float]
    elevation_gain_m: Optional[float]
    cluster_label: Optional[str]


class TrainingProfile(BaseModel):
    leve_pct: float
    moderado_pct: float
    intenso_pct: float
    dominant_cluster: str
