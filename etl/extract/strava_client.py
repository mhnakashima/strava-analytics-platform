from __future__ import annotations

import time
from typing import Any

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from config import STRAVA_API_BASE, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_TOKEN_URL

RATE_LIMIT_REQUESTS_PER_15MIN = 95  # Conservative limit (actual: 100)
_request_count = 0
_window_start = time.time()


def _check_rate_limit():
    global _request_count, _window_start
    elapsed = time.time() - _window_start
    if elapsed >= 900:
        _request_count = 0
        _window_start = time.time()
    if _request_count >= RATE_LIMIT_REQUESTS_PER_15MIN:
        sleep_secs = 900 - elapsed + 5
        logger.warning(f"Rate limit approaching — sleeping {sleep_secs:.0f}s")
        time.sleep(sleep_secs)
        _request_count = 0
        _window_start = time.time()
    _request_count += 1


def refresh_access_token(refresh_token: str) -> dict:
    with httpx.Client() as client:
        resp = client.post(
            STRAVA_TOKEN_URL,
            data={
                "client_id": STRAVA_CLIENT_ID,
                "client_secret": STRAVA_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        return resp.json()


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def get(access_token: str, endpoint: str, params: dict | None = None) -> Any:
    _check_rate_limit()
    url = f"{STRAVA_API_BASE}{endpoint}"
    headers = {"Authorization": f"Bearer {access_token}"}
    with httpx.Client(timeout=30) as client:
        resp = client.get(url, headers=headers, params=params or {})
        if resp.status_code == 429:
            retry_after = int(resp.headers.get("X-RateLimit-Reset", 900))
            logger.warning(f"429 received — sleeping {retry_after}s")
            time.sleep(retry_after)
            raise Exception("Rate limited")
        resp.raise_for_status()
        return resp.json()


def fetch_activities(access_token: str, after_timestamp: int | None = None, per_page: int = 100) -> list[dict]:
    all_activities = []
    page = 1
    while True:
        params = {"per_page": per_page, "page": page}
        if after_timestamp:
            params["after"] = after_timestamp
        batch = get(access_token, "/athlete/activities", params)
        if not batch:
            break
        all_activities.extend(batch)
        logger.info(f"Fetched page {page} — {len(batch)} activities")
        if len(batch) < per_page:
            break
        page += 1
    logger.info(f"Total activities fetched: {len(all_activities)}")
    return all_activities


def fetch_activity_detail(access_token: str, activity_id: int) -> dict:
    return get(access_token, f"/activities/{activity_id}", {"include_all_efforts": True})
