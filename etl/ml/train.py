"""
Treinamento do modelo KMeans para clusterização de treinos.
Clusters: leve (0), moderado (1), intenso (2)
"""
import os

import joblib
import numpy as np
import pandas as pd
from loguru import logger
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "training_cluster.pkl")

FEATURES = [
    "avg_pace_sec_km",
    "distance_km",
    "avg_heartrate",
    "elevation_gain_m",
    "moving_time_sec",
    "training_load",
]

CLUSTER_LABELS = {0: "leve", 1: "moderado", 2: "intenso"}


def train(df: pd.DataFrame, k: int = 3) -> Pipeline:
    """
    Treina o pipeline KMeans nos dados de atividades.
    Retorna o pipeline treinado e persiste em disco.
    """
    df = df.copy()
    if "distance_km" not in df.columns and "distance_meters" in df.columns:
        df["distance_km"] = df["distance_meters"] / 1000

    available_features = [f for f in FEATURES if f in df.columns]
    X = df[available_features].fillna(df[available_features].median())

    if len(X) < k:
        logger.warning(f"Not enough samples ({len(X)}) to train with k={k}. Need at least {k}.")
        return None

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("kmeans", KMeans(n_clusters=k, random_state=42, n_init=10, max_iter=300)),
    ])
    pipeline.fit(X)

    labels = pipeline.predict(X)
    if len(set(labels)) > 1:
        score = silhouette_score(X, labels)
        logger.info(f"KMeans trained — k={k}, silhouette={score:.3f}, inertia={pipeline['kmeans'].inertia_:.1f}")
    else:
        logger.warning("All points assigned to a single cluster — check data quality")

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    logger.info(f"Model saved to {MODEL_PATH}")
    return pipeline


def infer(df: pd.DataFrame) -> pd.Series:
    """
    Aplica o modelo treinado para predizer clusters.
    Retorna Series com labels: 'leve', 'moderado', 'intenso'.
    """
    if not os.path.exists(MODEL_PATH):
        logger.warning("No trained model found. Run train() first.")
        return pd.Series(["moderado"] * len(df))

    pipeline = joblib.load(MODEL_PATH)
    df = df.copy()
    if "distance_km" not in df.columns and "distance_meters" in df.columns:
        df["distance_km"] = df["distance_meters"] / 1000

    available_features = [f for f in FEATURES if f in df.columns]
    X = df[available_features].fillna(df[available_features].median())
    raw_labels = pipeline.predict(X)

    # Map numeric clusters to semantic labels based on average pace
    cluster_pace_map = {}
    temp_df = df.copy()
    temp_df["_cluster"] = raw_labels
    if "avg_pace_sec_km" in temp_df.columns:
        cluster_pace_map = temp_df.groupby("_cluster")["avg_pace_sec_km"].mean().to_dict()

    sorted_clusters = sorted(cluster_pace_map, key=lambda c: cluster_pace_map[c], reverse=True)
    semantic_map = {}
    label_order = ["leve", "moderado", "intenso"]
    for i, cluster_id in enumerate(sorted_clusters):
        semantic_map[cluster_id] = label_order[i] if i < len(label_order) else "moderado"

    if not semantic_map:
        semantic_map = CLUSTER_LABELS

    return pd.Series([semantic_map.get(lbl, "moderado") for lbl in raw_labels])
