from __future__ import annotations

"""
Transformações e cálculo de métricas derivadas.
"""
import math

import numpy as np
import pandas as pd
from loguru import logger


# Activity types where pace (time/distance) is a meaningful metric
PACE_ACTIVITY_TYPES = {"Run", "TrailRun", "Walk", "Hike", "VirtualRun", "RaceWalk"}

# Activity types where KMeans intensity clustering makes sense
CLUSTER_ACTIVITY_TYPES = {"Run", "TrailRun", "VirtualRun"}


def calc_pace(distance_meters: float | None, moving_time_sec: int | None, activity_type: str = "Run") -> float | None:
    """Retorna pace em segundos/km — apenas para atividades com pace relevante."""
    if activity_type not in PACE_ACTIVITY_TYPES:
        return None
    if not distance_meters or not moving_time_sec or distance_meters <= 0:
        return None
    pace = moving_time_sec / (distance_meters / 1000)
    # Sanity cap: > 30 min/km means GPS error or near-zero distance
    if pace > 1800:
        return None
    return round(pace, 2)


def calc_trimp(duration_min: float, avg_hr: float, max_hr: float, resting_hr: float = 55) -> float | None:
    """
    TRIMP (Training Impulse) de Bannister:
    TRIMP = duration × HRr × (0.64 × e^(1.92 × HRr))
    onde HRr = (avg_hr - rest_hr) / (max_hr - rest_hr)
    """
    if not avg_hr or not max_hr or max_hr <= resting_hr:
        return None
    hr_ratio = (avg_hr - resting_hr) / (max_hr - resting_hr)
    hr_ratio = max(0.0, min(1.0, hr_ratio))
    trimp = duration_min * hr_ratio * (0.64 * math.exp(1.92 * hr_ratio))
    return round(trimp, 2)


def calc_hr_zones(hr_streams: list[float], max_hr: int) -> dict[str, float]:
    """
    Calcula percentual de tempo em cada zona cardíaca.
    Zona 1: <60% FCmax
    Zona 2: 60-70% FCmax
    Zona 3: 70-80% FCmax
    Zona 4: 80-90% FCmax
    Zona 5: >90% FCmax
    """
    if not hr_streams or not max_hr:
        return {f"zone_{i}": 0.0 for i in range(1, 6)}

    arr = np.array(hr_streams)
    total = len(arr)
    thresholds = [0.60, 0.70, 0.80, 0.90]
    limits = [t * max_hr for t in thresholds]

    zones = {
        "zone_1": float(np.sum(arr < limits[0]) / total * 100),
        "zone_2": float(np.sum((arr >= limits[0]) & (arr < limits[1])) / total * 100),
        "zone_3": float(np.sum((arr >= limits[1]) & (arr < limits[2])) / total * 100),
        "zone_4": float(np.sum((arr >= limits[2]) & (arr < limits[3])) / total * 100),
        "zone_5": float(np.sum(arr >= limits[3]) / total * 100),
    }
    return {k: round(v, 1) for k, v in zones.items()}


def transform_activities(raw: list[dict], athlete_max_hr: int = 180) -> pd.DataFrame:
    """
    Transforma lista de atividades brutas da API Strava em DataFrame normalizado.
    """
    if not raw:
        return pd.DataFrame()

    records = []
    for act in raw:
        try:
            distance_m = act.get("distance", 0) or 0
            moving_time = act.get("moving_time") or 0
            elapsed_time = act.get("elapsed_time") or 0
            avg_hr = act.get("average_heartrate")
            max_hr = act.get("max_heartrate")
            start_date_str = act.get("start_date_local") or act.get("start_date")

            activity_type = act.get("type") or act.get("sport_type") or "Run"
            pace = calc_pace(distance_m, moving_time, activity_type)
            duration_min = moving_time / 60 if moving_time else 0
            trimp = calc_trimp(duration_min, avg_hr or 0, athlete_max_hr) if avg_hr else None

            records.append({
                "activity_id": act["id"],
                "strava_name": act.get("name"),
                "start_date": pd.to_datetime(start_date_str, utc=True) if start_date_str else None,
                "distance_meters": distance_m,
                "moving_time_sec": moving_time,
                "elapsed_time_sec": elapsed_time,
                "elevation_gain_m": act.get("total_elevation_gain"),
                "avg_pace_sec_km": pace,
                "best_pace_sec_km": None,
                "avg_heartrate": avg_hr,
                "max_heartrate": max_hr,
                "calories": act.get("calories"),
                "kudos_count": act.get("kudos_count", 0),
                "training_load": trimp,
                "activity_type": activity_type,
            })
        except Exception as exc:
            logger.warning(f"Skipping activity {act.get('id')}: {exc}")
            continue

    df = pd.DataFrame(records)
    if df.empty:
        return df

    df["date_id"] = pd.to_datetime(df["start_date"]).dt.strftime("%Y%m%d").astype("Int64")
    logger.info(f"Transformed {len(df)} activities")
    return df


def add_rolling_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Adiciona rolling averages de pace e volume (7, 30, 90 dias)."""
    if df.empty or "start_date" not in df.columns:
        return df

    df = df.sort_values("start_date").reset_index(drop=True)
    df["distance_km"] = df["distance_meters"] / 1000

    for window in [7, 30, 90]:
        df[f"rolling_pace_{window}d"] = (
            df["avg_pace_sec_km"].rolling(window, min_periods=1).mean().round(2)
        )
        df[f"rolling_volume_km_{window}d"] = (
            df["distance_km"].rolling(window, min_periods=1).sum().round(2)
        )

    return df
