from __future__ import annotations
from typing import Optional

from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    athlete_id: int
    firstname: Optional[str]
    lastname: Optional[str]


class RefreshRequest(BaseModel):
    refresh_token: str
