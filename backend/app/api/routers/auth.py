from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.dim_athlete import DimAthlete
from app.schemas.auth import TokenResponse
from app.services.strava_service import StravaService

router = APIRouter(prefix="/auth", tags=["Auth"])
strava_svc = StravaService()


@router.get("/strava", summary="Inicia fluxo OAuth Strava")
def strava_login():
    return RedirectResponse(url=strava_svc.get_auth_url())


@router.get("/callback", summary="Callback OAuth — redireciona para o frontend com JWT")
def strava_callback(code: str, db: Session = Depends(get_db)):
    try:
        token_data = strava_svc.exchange_code(code)
    except Exception:
        return RedirectResponse(url=f"{settings.frontend_url}/?error=oauth_failed")

    strava_athlete = token_data.get("athlete", {})
    strava_id = strava_athlete.get("id")
    if not strava_id:
        return RedirectResponse(url=f"{settings.frontend_url}/?error=invalid_response")

    athlete = db.query(DimAthlete).filter(DimAthlete.strava_id == strava_id).first()
    if not athlete:
        athlete = DimAthlete(
            strava_id=strava_id,
            firstname=strava_athlete.get("firstname"),
            lastname=strava_athlete.get("lastname"),
            city=strava_athlete.get("city"),
            country=strava_athlete.get("country"),
            weight_kg=strava_athlete.get("weight"),
        )
        db.add(athlete)
        db.flush()

    athlete.strava_access_token = token_data.get("access_token")
    athlete.strava_refresh_token = token_data.get("refresh_token")
    athlete.strava_token_expires_at = token_data.get("expires_at")
    db.commit()
    db.refresh(athlete)

    token = create_access_token({"athlete_id": athlete.athlete_id})

    # Redirect to /callback on the frontend — token in URL fragment so it never hits a server
    redirect_url = (
        f"{settings.frontend_url}/callback"
        f"#token={token}"
        f"&athlete_id={athlete.athlete_id}"
        f"&firstname={athlete.firstname or ''}"
        f"&lastname={athlete.lastname or ''}"
    )
    return RedirectResponse(url=redirect_url)


@router.post("/refresh", response_model=TokenResponse, summary="Renova access token JWT")
def refresh_jwt(athlete_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException

    athlete = db.query(DimAthlete).filter(DimAthlete.athlete_id == athlete_id).first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Athlete not found")
    token = create_access_token({"athlete_id": athlete.athlete_id})
    return TokenResponse(
        access_token=token,
        athlete_id=athlete.athlete_id,
        firstname=athlete.firstname,
        lastname=athlete.lastname,
    )
