from __future__ import annotations
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.fact_activity import FactActivity


class ActivityRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        athlete_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        activity_type: Optional[str] = None,
        intensity: Optional[str] = None,
        min_distance_km: Optional[float] = None,
        max_distance_km: Optional[float] = None,
        limit: int = 20,
        offset: int = 0,
        cursor: Optional[int] = None,
    ) -> list[FactActivity]:
        q = self.db.query(FactActivity).filter(FactActivity.athlete_id == athlete_id)

        if start_date:
            q = q.filter(FactActivity.start_date >= start_date)
        if end_date:
            q = q.filter(FactActivity.start_date <= end_date)
        if intensity:
            q = q.filter(FactActivity.cluster_label == intensity)
        if activity_type:
            q = q.filter(FactActivity.activity_type == activity_type)
        if min_distance_km:
            q = q.filter(FactActivity.distance_meters >= min_distance_km * 1000)
        if max_distance_km:
            q = q.filter(FactActivity.distance_meters <= max_distance_km * 1000)
        if cursor:
            q = q.filter(FactActivity.activity_id < cursor)

        return q.order_by(FactActivity.start_date.desc()).offset(offset).limit(limit).all()

    def get_by_id(self, activity_id: int, athlete_id: int) -> FactActivity | None:
        return self.db.query(FactActivity).filter(
            FactActivity.activity_id == activity_id,
            FactActivity.athlete_id == athlete_id,
        ).first()

    def get_kpis(self, athlete_id: int, start_date: Optional[str] = None, end_date: Optional[str] = None) -> dict:
        q = self.db.query(FactActivity).filter(FactActivity.athlete_id == athlete_id)
        if start_date:
            q = q.filter(FactActivity.start_date >= start_date)
        if end_date:
            q = q.filter(FactActivity.start_date <= end_date)

        rows = q.all()
        if not rows:
            return {}

        total_distance = sum(r.distance_meters or 0 for r in rows)
        avg_pace = sum(r.avg_pace_sec_km for r in rows if r.avg_pace_sec_km) / max(
            len([r for r in rows if r.avg_pace_sec_km]), 1
        )
        return {
            "total_distance_km": round(total_distance / 1000, 2),
            "total_activities": len(rows),
            "avg_pace_sec_km": round(avg_pace, 1),
            "best_pace_sec_km": min((r.best_pace_sec_km for r in rows if r.best_pace_sec_km), default=None),
            "avg_heartrate": round(sum(r.avg_heartrate for r in rows if r.avg_heartrate) / max(len([r for r in rows if r.avg_heartrate]), 1), 1),
            "total_elevation_m": round(sum(r.elevation_gain_m or 0 for r in rows), 1),
            "total_calories": round(sum(r.calories or 0 for r in rows), 1),
            "consistency_per_week": round(len(rows) / max(1, 52), 2),
            "avg_training_load": round(sum(r.training_load for r in rows if r.training_load) / max(len([r for r in rows if r.training_load]), 1), 1),
        }

    def get_timeline(
        self,
        athlete_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        activity_type: Optional[str] = None,
    ) -> list[dict]:
        q = self.db.query(FactActivity).filter(FactActivity.athlete_id == athlete_id)
        if start_date:
            q = q.filter(FactActivity.start_date >= start_date)
        if end_date:
            q = q.filter(FactActivity.start_date <= end_date)
        if activity_type:
            q = q.filter(FactActivity.activity_type == activity_type)
        rows = q.order_by(FactActivity.start_date).all()
        return [
            {
                "date": r.start_date.strftime("%Y-%m-%d") if r.start_date else None,
                "distance_km": round((r.distance_meters or 0) / 1000, 2),
                "avg_pace_sec_km": r.avg_pace_sec_km,
                "avg_heartrate": r.avg_heartrate,
                "training_load": r.training_load,
            }
            for r in rows
        ]

    def get_cluster_points(self, athlete_id: int) -> list[FactActivity]:
        return self.db.query(FactActivity).filter(
            FactActivity.athlete_id == athlete_id,
            FactActivity.cluster_label.isnot(None),
        ).all()
