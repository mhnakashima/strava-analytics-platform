from __future__ import annotations
from typing import Optional
import math
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.fact_activity import FactActivity

# MET (metabolic equivalent) values per activity type — used to estimate
# calories when Strava does not return them (list endpoint returns 0/null).
# Formula: kcal = MET × weight_kg × duration_hours
_MET: dict[str, float] = {
    'Run': 10.0, 'TrailRun': 11.5, 'VirtualRun': 10.0,
    'Ride': 8.0, 'VirtualRide': 8.0,
    'Walk': 3.5, 'RaceWalk': 5.0, 'Hike': 6.0,
    'WeightTraining': 4.0, 'Workout': 5.5,
    'Yoga': 2.5, 'Swim': 8.0,
    'Elliptical': 7.0, 'StairStepper': 9.0,
    'Rowing': 7.0, 'Kayaking': 5.0,
}
_ASSUMED_WEIGHT_KG = 70.0  # assumed when athlete weight is unknown


def _est_calories(activity_type: Optional[str], moving_time_sec: Optional[int]) -> float:
    """Estimate kcal burned when Strava doesn't provide the value."""
    if not moving_time_sec or moving_time_sec <= 0:
        return 0.0
    met = _MET.get(activity_type or '', 7.0)
    return round(met * _ASSUMED_WEIGHT_KG * (moving_time_sec / 3600), 1)


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
            "total_calories": round(sum(
                r.calories if (r.calories and r.calories > 0)
                else _est_calories(r.activity_type, r.moving_time_sec)
                for r in rows
            ), 1),
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

    def get_best_times(self, athlete_id: int) -> list[dict]:
        """Return the activity with the best (lowest) pace for each standard distance threshold."""
        thresholds = [
            ("5km",  5_000),
            ("10km", 10_000),
            ("21km", 21_097),
            ("42km", 42_195),
        ]
        results = []
        running_types = ("Run", "TrailRun", "VirtualRun", "RaceWalk")
        for label, min_meters in thresholds:
            best = (
                self.db.query(FactActivity)
                .filter(
                    FactActivity.athlete_id == athlete_id,
                    FactActivity.distance_meters >= min_meters,
                    FactActivity.avg_pace_sec_km.isnot(None),
                    FactActivity.avg_pace_sec_km > 0,
                    FactActivity.activity_type.in_(running_types),
                )
                .order_by(FactActivity.avg_pace_sec_km.asc())
                .first()
            )
            results.append({
                "label": label,
                "min_distance_km": min_meters / 1000,
                "best_pace_sec_km": best.avg_pace_sec_km if best else None,
                "best_time_sec": (best.avg_pace_sec_km * (min_meters / 1000)) if best and best.avg_pace_sec_km else None,
                "activity_date": best.start_date.strftime("%Y-%m-%d") if best and best.start_date else None,
                "activity_name": best.strava_name if best else None,
            })
        return results

    def get_last_activity(self, athlete_id: int) -> Optional[FactActivity]:
        return (
            self.db.query(FactActivity)
            .filter(FactActivity.athlete_id == athlete_id)
            .order_by(FactActivity.start_date.desc())
            .first()
        )

    def get_cluster_points(self, athlete_id: int) -> list[FactActivity]:
        return self.db.query(FactActivity).filter(
            FactActivity.athlete_id == athlete_id,
            FactActivity.cluster_label.isnot(None),
        ).all()

    def get_cluster_stats(self, athlete_id: int) -> list[dict]:
        """Return per-cluster centroid statistics (count + averages)."""
        rows = self.db.query(FactActivity).filter(
            FactActivity.athlete_id == athlete_id,
            FactActivity.cluster_label.isnot(None),
        ).all()

        from collections import defaultdict
        buckets: dict[str, list[FactActivity]] = defaultdict(list)
        for r in rows:
            buckets[r.cluster_label].append(r)

        def _avg(vals: list) -> Optional[float]:
            clean = [v for v in vals if v is not None]
            return round(sum(clean) / len(clean), 1) if clean else None

        result = []
        for label in ('leve', 'moderado', 'intenso'):
            acts = buckets.get(label, [])
            if not acts:
                continue
            result.append({
                "label": label,
                "count": len(acts),
                "avg_pace_sec_km": _avg([a.avg_pace_sec_km for a in acts]),
                "avg_distance_km": round(
                    sum((a.distance_meters or 0) / 1000 for a in acts) / len(acts), 1
                ),
                "avg_heartrate": _avg([a.avg_heartrate for a in acts]),
                "avg_elevation_m": _avg([a.elevation_gain_m for a in acts]),
                "avg_training_load": _avg([a.training_load for a in acts]),
            })
        return result

    def get_cluster_trend(self, athlete_id: int) -> list[dict]:
        """Weekly cluster distribution: how many easy/mod/hard runs per ISO week."""
        rows = self.db.query(FactActivity).filter(
            FactActivity.athlete_id == athlete_id,
            FactActivity.cluster_label.isnot(None),
            FactActivity.start_date.isnot(None),
        ).order_by(FactActivity.start_date).all()

        from collections import defaultdict
        weeks: dict[str, dict[str, int]] = defaultdict(lambda: {'leve': 0, 'moderado': 0, 'intenso': 0})
        for r in rows:
            if r.start_date:
                week_key = r.start_date.strftime('%Y-W%W')
                weeks[week_key][r.cluster_label] = weeks[week_key].get(r.cluster_label, 0) + 1

        return [
            {
                "week": week,
                "easy": counts.get('leve', 0),
                "moderate": counts.get('moderado', 0),
                "hard": counts.get('intenso', 0),
            }
            for week, counts in sorted(weeks.items())
        ]

    def get_training_readiness(self, athlete_id: int) -> dict:
        """
        Compute ATL / CTL / TSB (Banister Impulse-Response model) from TRIMP data.

        ATL (Acute Training Load, τ=7 days)  → short-term fatigue proxy
        CTL (Chronic Training Load, τ=42 days) → long-term fitness proxy
        TSB (Training Stress Balance) = CTL − ATL

        Positive TSB → rested / fresh → ready for intensity
        Negative TSB → accumulated fatigue → needs recovery

        Returns a dict with all metrics plus a human-readable recommendation.
        """
        # Pull last 90 days of activities to warm the exponential decay model
        cutoff = datetime.utcnow() - timedelta(days=90)
        rows = (
            self.db.query(FactActivity)
            .filter(
                FactActivity.athlete_id == athlete_id,
                FactActivity.start_date >= cutoff,
                FactActivity.start_date.isnot(None),
            )
            .order_by(FactActivity.start_date)
            .all()
        )

        # Build date → total TRIMP map (multiple activities on same day summed)
        trimp_by_day: dict[date, float] = {}
        for r in rows:
            if r.start_date and r.training_load:
                d = r.start_date.date()
                trimp_by_day[d] = trimp_by_day.get(d, 0.0) + r.training_load

        today = datetime.utcnow().date()

        # --- Exponential decay model ---
        # k = e^(-1/τ)  — decay factor per day
        k_atl = math.exp(-1 / 7.0)    # ≈ 0.867
        k_ctl = math.exp(-1 / 42.0)   # ≈ 0.977
        # For each day with load: new_val = prev * k + load * (1 - k)
        # This gives the "exponentially weighted moving average" with the correct τ

        atl = 0.0
        ctl = 0.0

        start_day = today - timedelta(days=89)
        current_day = start_day
        while current_day <= today:
            trimp = trimp_by_day.get(current_day, 0.0)
            atl = atl * k_atl + trimp * (1 - k_atl)
            ctl = ctl * k_ctl + trimp * (1 - k_ctl)
            current_day += timedelta(days=1)

        tsb = ctl - atl

        # --- Context metrics ---
        # Days since last activity
        all_dates = sorted(trimp_by_day.keys())
        last_activity_date = all_dates[-1] if all_dates else None
        days_since_last = (today - last_activity_date).days if last_activity_date else None

        # 7-day rolling TRIMP sum
        week_start = today - timedelta(days=6)
        weekly_trimp = sum(
            v for d, v in trimp_by_day.items() if d >= week_start
        )

        # 28-day rolling TRIMP sum
        month_start = today - timedelta(days=27)
        monthly_trimp = sum(
            v for d, v in trimp_by_day.items() if d >= month_start
        )

        # --- Recommendation engine ---
        # Incorporates TSB + days since last activity
        resting_bonus = max(0, (days_since_last or 0) - 1) * 3  # each extra rest day nudges score up
        adjusted_tsb = tsb + resting_bonus

        if adjusted_tsb >= 15:
            level = "peak"
            title = "Peak Readiness"
            advice = (
                "Your body is fully recovered and primed for high performance. "
                "Today is ideal for a race, a hard interval session, or a long run at goal pace."
            )
            color = "#22c55e"
            icon = "🔥"
        elif adjusted_tsb >= 5:
            level = "fresh"
            title = "Fresh & Ready"
            advice = (
                "Good freshness. A quality session — tempo run, threshold intervals, or a longer aerobic effort — "
                "will produce strong adaptations today."
            )
            color = "#84cc16"
            icon = "⚡"
        elif adjusted_tsb >= -2:
            level = "moderate"
            title = "Moderate Load"
            advice = (
                "Mild fatigue accumulating. An easy-to-moderate aerobic run is fine, "
                "but avoid pushing intensity. Focus on form and aerobic base."
            )
            color = "#f59e0b"
            icon = "🟡"
        elif adjusted_tsb >= -10:
            level = "tired"
            title = "Accumulated Fatigue"
            advice = (
                "Your load has been high recently. Keep today's session short and easy — "
                "Zone 1–2 only, 30–45 min max. Or take a full rest day."
            )
            color = "#f97316"
            icon = "😓"
        else:
            level = "rest"
            title = "Rest Recommended"
            advice = (
                "High accumulated fatigue. Your body needs recovery more than training. "
                "Take a rest day, do light mobility/yoga, and prioritise sleep and nutrition."
            )
            color = "#ef4444"
            icon = "🛌"

        return {
            "atl": round(atl, 1),
            "ctl": round(ctl, 1),
            "tsb": round(tsb, 1),
            "weekly_trimp": round(weekly_trimp, 1),
            "monthly_trimp": round(monthly_trimp, 1),
            "days_since_last": days_since_last,
            "last_activity_date": last_activity_date.isoformat() if last_activity_date else None,
            "readiness_level": level,
            "readiness_title": title,
            "readiness_advice": advice,
            "readiness_color": color,
            "readiness_icon": icon,
        }

    # ──────────────────────────────────────────────────────────────
    # Year-over-Year analytics
    # ──────────────────────────────────────────────────────────────

    def get_yearly_stats(self, athlete_id: int) -> list[dict]:
        """Aggregate training metrics per calendar year."""
        rows = (
            self.db.query(FactActivity)
            .filter(
                FactActivity.athlete_id == athlete_id,
                FactActivity.start_date.isnot(None),
            )
            .all()
        )

        by_year: dict[int, dict] = {}
        for r in rows:
            if not r.start_date:
                continue
            year = r.start_date.year
            if year not in by_year:
                by_year[year] = {
                    'dist': 0.0, 'acts': 0,
                    'pace_vals': [], 'cals': 0.0,
                    'load_vals': [], 'elev': 0.0,
                    'runs': 0, 'rides': 0, 'other': 0,
                }
            y = by_year[year]
            y['dist'] += (r.distance_meters or 0) / 1000
            y['acts'] += 1
            if r.avg_pace_sec_km:
                y['pace_vals'].append(r.avg_pace_sec_km)
            cal = (
                r.calories if (r.calories and r.calories > 0)
                else _est_calories(r.activity_type, r.moving_time_sec)
            )
            y['cals'] += cal
            if r.training_load:
                y['load_vals'].append(r.training_load)
            y['elev'] += r.elevation_gain_m or 0
            atype = r.activity_type or ''
            if atype in ('Run', 'TrailRun', 'VirtualRun'):
                y['runs'] += 1
            elif atype in ('Ride', 'VirtualRide'):
                y['rides'] += 1
            else:
                y['other'] += 1

        result = []
        for year in sorted(by_year):
            d = by_year[year]
            result.append({
                'year': year,
                'total_distance_km': round(d['dist'], 1),
                'total_activities': d['acts'],
                'avg_pace_sec_km': (
                    round(sum(d['pace_vals']) / len(d['pace_vals']))
                    if d['pace_vals'] else None
                ),
                'total_calories': round(d['cals']),
                'avg_training_load': (
                    round(sum(d['load_vals']) / len(d['load_vals']), 1)
                    if d['load_vals'] else None
                ),
                'total_elevation_m': round(d['elev']),
                'run_count': d['runs'],
                'ride_count': d['rides'],
                'other_count': d['other'],
            })
        return result

    def get_monthly_breakdown(self, athlete_id: int) -> list[dict]:
        """Per-month distance + activity count for every year in the dataset."""
        rows = (
            self.db.query(FactActivity)
            .filter(
                FactActivity.athlete_id == athlete_id,
                FactActivity.start_date.isnot(None),
            )
            .all()
        )

        by_ym: dict[tuple[int, int], dict] = {}
        for r in rows:
            if not r.start_date:
                continue
            key = (r.start_date.year, r.start_date.month)
            if key not in by_ym:
                by_ym[key] = {'dist': 0.0, 'acts': 0}
            by_ym[key]['dist'] += (r.distance_meters or 0) / 1000
            by_ym[key]['acts'] += 1

        MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        result = []
        for (year, month) in sorted(by_ym):
            d = by_ym[(year, month)]
            result.append({
                'year': year,
                'month': month,
                'month_label': MONTHS[month - 1],
                'distance_km': round(d['dist'], 1),
                'activities': d['acts'],
            })
        return result

