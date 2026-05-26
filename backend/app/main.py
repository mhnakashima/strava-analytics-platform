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

# Auth uses Authorization: Bearer <JWT>, not cookies, so allow_origins=["*"]
# with allow_credentials=False is both correct and avoids origin-matching issues.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return CORS-safe JSON for unhandled 500 errors."""
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"Access-Control-Allow-Origin": "*"},
    )


app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(analytics.router)
app.include_router(ml.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "strava-analytics-api"}
