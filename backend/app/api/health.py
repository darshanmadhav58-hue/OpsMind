from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.database import get_db
from app.core.config import settings
from app.memory.hindsight_service import hindsight_service
from app.services.ai_investigator import ai_investigator

router = APIRouter()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "unhealthy"
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "operational",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
        "hindsight": {
            "base_url": settings.HINDSIGHT_BASE_URL,
            "bank_incidents": settings.HINDSIGHT_BANK_INCIDENTS,
            "bank_services": settings.HINDSIGHT_BANK_SERVICES,
            "hindsight_sdk_active": hindsight_service.hindsight_client is not None,
            "persisted_memories": sum(len(v) for v in hindsight_service._local_memory_store.values()),
        },
        "ai_engine": {
            "gemini_configured": bool(ai_investigator.client),
            "model": settings.GEMINI_MODEL
        }
    }
