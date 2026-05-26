from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_athlete_id
from app.repositories.activity_repository import ActivityRepository
from app.schemas.analytics import (
    ClusterPoint,
    ComparisonReport,
    ConsistencyReport,
    HRZoneDistribution,
    TrainingProfile,
    TrendPoint,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/trends", response_model=list[TrendPoint], summary="Tendências semanais/mensais")
def get_trends(
    granularity: str = "month",
    start_date: str | None = None,
    end_date: str | None = None,
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    points = repo.get_timeline(athlete_id, start_date, end_date)
    return [TrendPoint(period=p["date"] or "", distance_km=p["distance_km"], activities=1, avg_pace_sec_km=p["avg_pace_sec_km"], avg_heartrate=p["avg_heartrate"]) for p in points]


@router.get("/heartrate", response_model=HRZoneDistribution, summary="Distribuição de zonas cardíacas")
def get_hr_zones(
    start_date: str | None = None,
    end_date: str | None = None,
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


@router.get("/consistency", response_model=ConsistencyReport, summary="Score de consistência")
def get_consistency(
    start_date: str | None = None,
    end_date: str | None = None,
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


@router.get("/clusters", response_model=list[ClusterPoint], summary="Pontos para scatter de clusters ML")
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


@router.get("/training-profile", response_model=TrainingProfile, summary="Perfil de intensidade por cluster")
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
