import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Incident, InvestigationStep, AuditLog
from app.memory.hindsight_service import hindsight_service

logger = logging.getLogger("opsmind.learning")


class LearningEngine:
    """
    Post-Incident Learning & Continuous Improvement Engine.
    Retains verified post-mortems and resolutions into Vectorize Hindsight persistent memory,
    ensuring that past engineering lessons are automatically recalled for future incidents.
    """

    def learn_from_resolution(
        self,
        incident: Incident,
        confirmed_root_cause: str,
        resolution_summary: str,
        lessons_learned: Optional[str],
        db: Session
    ) -> str:
        logger.info(f"Retaining post-mortem for Incident {incident.id} into Hindsight Memory...")

        # Construct comprehensive post-mortem content for Hindsight retention
        content = (
            f"Incident #{incident.id} Resolution Report:\n"
            f"Service: {incident.service} (Severity: {incident.severity})\n"
            f"Title: {incident.title}\n"
            f"Symptoms: {incident.error_message or 'Service performance degradation'}\n"
            f"Confirmed Root Cause: {confirmed_root_cause}\n"
            f"Applied Resolution: {resolution_summary}\n"
            f"Lessons Learned: {lessons_learned or 'None documented.'}\n"
            f"Tags: {incident.service}, outage-fix, verified-resolution"
        )

        tags = [
            incident.service,
            incident.severity.lower(),
            "incident-resolution",
            "post-mortem",
            "verified-fix"
        ]

        # Extract domain keywords for entity linking
        for kw in ["redis", "postgres", "oom", "eviction", "deadlock", "timeout", "latency", "memory"]:
            if kw in confirmed_root_cause.lower() or kw in (incident.error_message or "").lower():
                tags.append(kw)

        metadata = {
            "incident_id": incident.id,
            "service": incident.service,
            "severity": incident.severity,
            "root_cause": confirmed_root_cause,
            "resolution": resolution_summary,
            "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else ""
        }

        # 1. Retain into Hindsight Incidents Bank
        memory_id = hindsight_service.retain(
            bank_id=settings.HINDSIGHT_BANK_INCIDENTS,
            content=content,
            tags=tags,
            metadata=metadata
        )

        # 2. Retain verified remediation into Runbooks Bank if applicable
        if "volatile-lru" in resolution_summary.lower() or "policy" in resolution_summary.lower():
            hindsight_service.retain(
                bank_id=settings.HINDSIGHT_BANK_RUNBOOKS,
                content=f"Verified Runbook for {incident.service}: {resolution_summary}",
                tags=[incident.service, "runbook", "verified-fix"],
                metadata={"incident_id": incident.id, "service": incident.service}
            )

        incident.hindsight_memory_id = memory_id
        db.commit()

        logger.info(f"Successfully retained Incident {incident.id} in Hindsight with Memory ID: {memory_id}")
        return memory_id


learning_engine = LearningEngine()

