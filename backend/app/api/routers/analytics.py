from __future__ import annotations
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_athlete_id
from app.repositories.activity_repository import ActivityRepository
from app.schemas.analytics import (
    BestEffort,
    BestTimes,
    ClusterPoint,
    ClusterStat,
    ClusterTrendPoint,
    ComparisonReport,
    ConsistencyReport,
    HRZoneDistribution,
    MonthlyPoint,
    TrainingProfile,
    TrainingReadiness,
    TrendPoint,
    YearlyStat,
)
from app.schemas.activity import ActivitySummary

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/trends", response_model=list[TrendPoint], summary="Weekly / monthly trends")
def get_trends(
    granularity: str = "month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    points = repo.get_timeline(athlete_id, start_date, end_date)
    return [TrendPoint(period=p["date"] or "", distance_km=p["distance_km"], activities=1, avg_pace_sec_km=p["avg_pace_sec_km"], avg_heartrate=p["avg_heartrate"]) for p in points]


@router.get("/heartrate", response_model=HRZoneDistribution, summary="Heart-rate zone distribution")
def get_hr_zones(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    from app.models.dim_athlete import DimAthlete
    from app.models.fact_activity import FactActivity

    athlete = db.query(DimAthlete).filter(DimAthlete.athlete_id == athlete_id).first()
    max_hr = (athlete.max_heartrate if athlete and athlete.max_heartrate else None) or 180

    q = db.query(FactActivity).filter(
        FactActivity.athlete_id == athlete_id,
        FactActivity.avg_heartrate.isnot(None),
    )
    if start_date:
        q = q.filter(FactActivity.start_date >= start_date)
    if end_date:
        q = q.filter(FactActivity.start_date <= end_date)
    rows = q.all()

    # If we have per-activity zone columns, use them
    has_zone_data = any(r.hr_zone_1_pct is not None for r in rows)
    if has_zone_data:
        def avg_zone(attr: str) -> float:
            vals = [getattr(r, attr) for r in rows if getattr(r, attr) is not None]
            return round(sum(vals) / max(len(vals), 1), 1)
        return HRZoneDistribution(
            zone_1_pct=avg_zone("hr_zone_1_pct"),
            zone_2_pct=avg_zone("hr_zone_2_pct"),
            zone_3_pct=avg_zone("hr_zone_3_pct"),
            zone_4_pct=avg_zone("hr_zone_4_pct"),
            zone_5_pct=avg_zone("hr_zone_5_pct"),
        )

    # Fallback: classify each activity by its avg_heartrate relative to max HR
    total = max(len(rows), 1)
    counts = [0, 0, 0, 0, 0]
    thresholds = [0.60, 0.70, 0.80, 0.90]
    limits = [t * max_hr for t in thresholds]

    for r in rows:
        hr = r.avg_heartrate
        if hr < limits[0]:
            counts[0] += 1
        elif hr < limits[1]:
            counts[1] += 1
        elif hr < limits[2]:
            counts[2] += 1
        elif hr < limits[3]:
            counts[3] += 1
        else:
            counts[4] += 1

    return HRZoneDistribution(
        zone_1_pct=round(counts[0] / total * 100, 1),
        zone_2_pct=round(counts[1] / total * 100, 1),
        zone_3_pct=round(counts[2] / total * 100, 1),
        zone_4_pct=round(counts[3] / total * 100, 1),
        zone_5_pct=round(counts[4] / total * 100, 1),
    )


@router.get("/consistency", response_model=ConsistencyReport, summary="Consistency score")
def get_consistency(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    from app.models.fact_activity import FactActivity

    q = db.query(FactActivity).filter(FactActivity.athlete_id == athlete_id)
    if start_date:
        q = q.filter(FactActivity.start_date >= start_date)
    if end_date:
        q = q.filter(FactActivity.start_date <= end_date)
    rows = q.all()
    total_activities = len(rows)
    total_weeks = 52
    activities_per_week = round(total_activities / max(total_weeks, 1), 2)
    score = min(100.0, round(activities_per_week * 25, 1))
    return ConsistencyReport(
        activities_per_week=activities_per_week,
        active_weeks=min(total_activities, total_weeks),
        total_weeks=total_weeks,
        consistency_score=score,
    )


@router.get("/clusters", response_model=list[ClusterPoint], summary="Cluster scatter points")
def get_cluster_points(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    rows = repo.get_cluster_points(athlete_id)
    return [
        ClusterPoint(
            activity_id=r.activity_id,
            start_date=r.start_date.strftime("%Y-%m-%d") if r.start_date else None,
            avg_pace_sec_km=r.avg_pace_sec_km,
            distance_km=round((r.distance_meters or 0) / 1000, 2),
            avg_heartrate=r.avg_heartrate,
            elevation_gain_m=r.elevation_gain_m,
            cluster_label=r.cluster_label,
        )
        for r in rows
    ]


@router.get("/cluster-stats", response_model=list[ClusterStat], summary="Cluster centroid statistics")
def get_cluster_stats(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    return [ClusterStat(**s) for s in repo.get_cluster_stats(athlete_id)]


@router.get("/cluster-trend", response_model=list[ClusterTrendPoint], summary="Weekly cluster distribution")
def get_cluster_trend(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    return [ClusterTrendPoint(**p) for p in repo.get_cluster_trend(athlete_id)]


@router.get("/best-times", response_model=BestTimes, summary="Best times at standard distances")
def get_best_times(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    efforts = repo.get_best_times(athlete_id)
    return BestTimes(efforts=[BestEffort(**e) for e in efforts])


@router.get("/last-activity", response_model=ActivitySummary, summary="Most recent activity")
def get_last_activity(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    repo = ActivityRepository(db)
    row = repo.get_last_activity(athlete_id)
    if not row:
        raise HTTPException(status_code=404, detail="No activities found")
    return ActivitySummary(
        activity_id=row.activity_id,
        strava_name=row.strava_name,
        start_date=row.start_date,
        activity_type=row.activity_type,
        distance_km=round((row.distance_meters or 0) / 1000, 2),
        moving_time_sec=row.moving_time_sec,
        avg_pace_sec_km=row.avg_pace_sec_km,
        avg_heartrate=row.avg_heartrate,
        elevation_gain_m=row.elevation_gain_m,
        cluster_label=row.cluster_label,
    )


@router.get("/training-readiness", response_model=TrainingReadiness, summary="Today's readiness — ATL/CTL/TSB model")
def get_training_readiness(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    return TrainingReadiness(**repo.get_training_readiness(athlete_id))


@router.get("/training-profile", response_model=TrainingProfile, summary="Intensity profile by cluster")
def get_training_profile(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    from app.models.fact_activity import FactActivity

    rows = db.query(FactActivity).filter(
        FactActivity.athlete_id == athlete_id,
        FactActivity.cluster_label.isnot(None),
    ).all()
    total = max(len(rows), 1)
    leve = len([r for r in rows if r.cluster_label == "leve"]) / total * 100
    moderado = len([r for r in rows if r.cluster_label == "moderado"]) / total * 100
    intenso = len([r for r in rows if r.cluster_label == "intenso"]) / total * 100
    dominant = max({"leve": leve, "moderado": moderado, "intenso": intenso}, key=lambda k: {"leve": leve, "moderado": moderado, "intenso": intenso}[k])
    return TrainingProfile(
        leve_pct=round(leve, 1),
        moderado_pct=round(moderado, 1),
        intenso_pct=round(intenso, 1),
        dominant_cluster=dominant,
    )


@router.get("/yearly", response_model=list[YearlyStat], summary="Per-year training aggregates")
def get_yearly_stats(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    return [YearlyStat(**s) for s in repo.get_yearly_stats(athlete_id)]


@router.get("/monthly", response_model=list[MonthlyPoint], summary="Per-month distance breakdown")
def get_monthly_breakdown(
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    return [MonthlyPoint(**p) for p in repo.get_monthly_breakdown(athlete_id)]

