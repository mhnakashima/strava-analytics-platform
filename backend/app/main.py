from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import activities, analytics, auth, ml
from app.core.config import settings

app = FastAPI(
    title="Strava Analytics API",
    description="Backend da Plataforma de Analytics para Performance Esportiva",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(analytics.router)
app.include_router(ml.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "strava-analytics-api"}
