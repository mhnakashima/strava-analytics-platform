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


class BestEffort(BaseModel):
    label: str           # "5km", "10km", etc.
    min_distance_km: float
    best_pace_sec_km: Optional[float]   # fastest pace in an activity >= that distance
    best_time_sec: Optional[float]      # best_pace * distance (approx elapsed)
    activity_date: Optional[str]
    activity_name: Optional[str]


class BestTimes(BaseModel):
    efforts: list[BestEffort]


class ClusterStat(BaseModel):
    label: str                          # "leve" | "moderado" | "intenso"
    count: int
    avg_pace_sec_km: Optional[float]
    avg_distance_km: Optional[float]
    avg_heartrate: Optional[float]
    avg_elevation_m: Optional[float]
    avg_training_load: Optional[float]


class ClusterTrendPoint(BaseModel):
    week: str    # ISO week e.g. "2025-W03"
    easy: int
    moderate: int
    hard: int


class YearlyStat(BaseModel):
    year: int
    total_distance_km: float
    total_activities: int
    avg_pace_sec_km: Optional[float]
    total_calories: float
    avg_training_load: Optional[float]
    total_elevation_m: float
    run_count: int
    ride_count: int
    other_count: int


class MonthlyPoint(BaseModel):
    year: int
    month: int
    month_label: str
    distance_km: float
    activities: int


class TrainingReadiness(BaseModel):
    """
    Banister Impulse-Response model output.
    ATL = Acute Training Load (fatigue, τ=7d)
    CTL = Chronic Training Load (fitness, τ=42d)
    TSB = Training Stress Balance = CTL − ATL
    """
    atl: float
    ctl: float
    tsb: float
    weekly_trimp: float
    monthly_trimp: float
    days_since_last: Optional[int]
    last_activity_date: Optional[str]
    readiness_level: str    # "peak" | "fresh" | "moderate" | "tired" | "rest"
    readiness_title: str
    readiness_advice: str
    readiness_color: str    # hex colour for UI
    readiness_icon: str
