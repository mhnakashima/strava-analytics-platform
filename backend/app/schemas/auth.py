from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    athlete_id: int
    firstname: str | None
    lastname: str | None


class RefreshRequest(BaseModel):
    refresh_token: str
