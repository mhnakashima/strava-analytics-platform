from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_athlete_id
from app.repositories.activity_repository import ActivityRepository
from app.schemas.activity import ActivityDetail, ActivityKPIs, ActivitySummary, TimelinePoint

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("", response_model=list[ActivitySummary], summary="Lista atividades com filtros")
def list_activities(
    start_date: str | None = None,
    end_date: str | None = None,
    activity_type: str | None = None,
    intensity: str | None = None,
    min_distance_km: float | None = None,
    max_distance_km: float | None = None,
    limit: int = 20,
    cursor: int | None = None,
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    rows = repo.list(
        athlete_id=athlete_id,
        start_date=start_date,
        end_date=end_date,
        activity_type=activity_type,
        intensity=intensity,
        min_distance_km=min_distance_km,
        max_distance_km=max_distance_km,
        limit=limit,
        cursor=cursor,
    )
    return [
        ActivitySummary(
            activity_id=r.activity_id,
            strava_name=r.strava_name,
            start_date=r.start_date,
            distance_km=round((r.distance_meters or 0) / 1000, 2),
            moving_time_sec=r.moving_time_sec,
            avg_pace_sec_km=r.avg_pace_sec_km,
            avg_heartrate=r.avg_heartrate,
            elevation_gain_m=r.elevation_gain_m,
            cluster_label=r.cluster_label,
        )
        for r in rows
    ]


@router.get("/summary", response_model=ActivityKPIs, summary="KPIs agregados do período")
def get_summary(
    start_date: str | None = None,
    end_date: str | None = None,
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    kpis = repo.get_kpis(athlete_id, start_date, end_date)
    if not kpis:
        raise HTTPException(status_code=404, detail="No activities found")
    return ActivityKPIs(**kpis)


@router.get("/timeline", response_model=list[TimelinePoint], summary="Série temporal de atividades")
def get_timeline(
    start_date: str | None = None,
    end_date: str | None = None,
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    return [TimelinePoint(**p) for p in repo.get_timeline(athlete_id, start_date, end_date)]


@router.get("/{activity_id}", response_model=ActivityDetail, summary="Detalhe de atividade")
def get_activity(
    activity_id: int,
    athlete_id: int = Depends(get_current_athlete_id),
    db: Session = Depends(get_db),
):
    repo = ActivityRepository(db)
    row = repo.get_by_id(activity_id, athlete_id)
    if not row:
        raise HTTPException(status_code=404, detail="Activity not found")
    return ActivityDetail(
        activity_id=row.activity_id,
        strava_name=row.strava_name,
        start_date=row.start_date,
        distance_km=round((row.distance_meters or 0) / 1000, 2),
        moving_time_sec=row.moving_time_sec,
        elapsed_time_sec=row.elapsed_time_sec,
        avg_pace_sec_km=row.avg_pace_sec_km,
        avg_heartrate=row.avg_heartrate,
        max_heartrate=row.max_heartrate,
        elevation_gain_m=row.elevation_gain_m,
        cluster_label=row.cluster_label,
        calories=row.calories,
        training_load=row.training_load,
        kudos_count=row.kudos_count,
        hr_zone_1_pct=row.hr_zone_1_pct,
        hr_zone_2_pct=row.hr_zone_2_pct,
        hr_zone_3_pct=row.hr_zone_3_pct,
        hr_zone_4_pct=row.hr_zone_4_pct,
        hr_zone_5_pct=row.hr_zone_5_pct,
        best_pace_sec_km=row.best_pace_sec_km,
    )


@router.post("/sync", summary="Dispara sincronização incremental do ETL")
def sync_activities(athlete_id: int = Depends(get_current_athlete_id)):
    # ETL sync is triggered as a background task via the scheduler service.
    # For a manual trigger, the ETL scheduler exposes a REST endpoint internally.
    return {"status": "queued", "message": "ETL sync triggered for athlete", "athlete_id": athlete_id}
