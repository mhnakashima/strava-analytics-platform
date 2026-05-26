from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routers import activities, analytics, auth, ml
from app.core.config import settings

app = FastAPI(
    title="Strava Analytics API",
    description="Backend da Plataforma de Analytics para Performance Esportiva",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Parse inline — never rely on @property evaluated after startup
_cors_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def _cors_headers(request: Request) -> dict:
    """Return CORS headers for the request's origin if it is allowed."""
    origin = request.headers.get("origin", "")
    if origin in _cors_origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Ensure CORS headers are always present, even on unhandled 500 errors."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=_cors_headers(request),
    )


app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(analytics.router)
app.include_router(ml.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "strava-analytics-api"}
