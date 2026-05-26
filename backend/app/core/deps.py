from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token

bearer_scheme = HTTPBearer()


def get_current_athlete_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> int:
    payload = decode_token(credentials.credentials)
    athlete_id: int | None = payload.get("athlete_id")
    if not athlete_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return athlete_id
