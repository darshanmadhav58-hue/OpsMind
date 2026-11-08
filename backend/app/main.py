from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.database import init_db
from app.api.health import router as health_router
from app.api.incidents import router as incidents_router
from app.api.memory import router as memory_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    logger.info("Starting OpsMind Backend Engine...")
    init_db()
    logger.info("SQLite operational database initialized.")
    yield
    # Shutdown
    logger.info("Shutting down OpsMind Backend Engine...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Incident Response & Memory AI powered by Vectorize Hindsight persistent memory.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["System Health"])
app.include_router(incidents_router, prefix=f"{settings.API_V1_STR}/incidents", tags=["Incidents & Investigation"])
app.include_router(memory_router, prefix=f"{settings.API_V1_STR}/memory", tags=["Hindsight Memory Engine"])


@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": f"{settings.API_V1_STR}/health"
    }
