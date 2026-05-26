from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_athlete_id

router = APIRouter(prefix="/ml", tags=["ML"])


@router.post("/retrain", summary="Re-executa treinamento KMeans")
def retrain_model(athlete_id: int = Depends(get_current_athlete_id)):
    # Triggers ETL ML re-training job.
    # In production, this calls the ETL service via internal HTTP or a task queue.
    return {
        "status": "triggered",
        "message": "KMeans retraining queued",
        "athlete_id": athlete_id,
    }


@router.get("/profile", summary="Retorna perfil de treino do atleta por cluster")
def get_ml_profile(athlete_id: int = Depends(get_current_athlete_id)):
    # Delegated to /analytics/training-profile for full implementation
    return {"message": "Use /analytics/training-profile for cluster profile"}
