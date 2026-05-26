import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings


class StravaService:
    def get_auth_url(self) -> str:
        params = {
            "client_id": settings.strava_client_id,
            "redirect_uri": settings.strava_redirect_uri,
            "response_type": "code",
            "scope": "read_all,activity:read_all",
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{settings.strava_auth_url}?{query}"

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def exchange_code(self, code: str) -> dict:
        with httpx.Client() as client:
            resp = client.post(
                settings.strava_token_url,
                data={
                    "client_id": settings.strava_client_id,
                    "client_secret": settings.strava_client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                },
            )
            resp.raise_for_status()
            return resp.json()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def refresh_token(self, refresh_token: str) -> dict:
        with httpx.Client() as client:
            resp = client.post(
                settings.strava_token_url,
                data={
                    "client_id": settings.strava_client_id,
                    "client_secret": settings.strava_client_secret,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
            )
            resp.raise_for_status()
            return resp.json()
