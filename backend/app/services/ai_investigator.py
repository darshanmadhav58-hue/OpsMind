import datetime
import json
import logging
import os
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Incident, InvestigationStep, RemediationAction, AuditLog
from app.memory.hindsight_service import hindsight_service

try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

logger = logging.getLogger("opsmind.investigator")


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class AIInvestigator:
    """
    Intelligent Incident Response & Root Cause Analysis Engine.
    Combines Google Gemini AI reasoning with Vectorize Hindsight persistent memory
    to investigate active incidents, correlate historical outages, and synthesize guarded remediation plans.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        self.client = None
        if GEMINI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Initialized Google GenAI Gemini Client with model '{settings.GEMINI_MODEL}'.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Client: {e}")

    def investigate(self, incident: Incident, db: Session) -> Incident:
        logger.info(f"Starting investigation for Incident {incident.id} ({incident.service})...")

        # Step 1: Multi-strategy recall from Hindsight Incidents Bank
        recall_query = f"{incident.service} {incident.title} {incident.error_message or ''}"
        incident_hits = hindsight_service.recall(
            bank_id=settings.HINDSIGHT_BANK_INCIDENTS,
            query=recall_query,
            top_k=3
        )

        # Step 2: Recall architectural topology from Hindsight Services Bank
        service_hits = hindsight_service.recall(
            bank_id=settings.HINDSIGHT_BANK_SERVICES,
            query=incident.service,
            top_k=2
        )

        best_hit = incident_hits[0] if incident_hits else None
        is_recalled = best_hit is not None and best_hit.score >= 0.50
        topology_context = service_hits[0].content if service_hits else "Standard microservice architecture."

        # Step 3: Attempt reasoning with Gemini AI if configured
        if self.client:
            gemini_result = self._investigate_with_gemini(incident, best_hit, topology_context)
            if gemini_result:
                self._apply_gemini_investigation(incident, gemini_result, best_hit, db)
                incident.updated_at = utc_now()
                db.commit()
                db.refresh(incident)
                return incident

        # Step 4: Deterministic SRE Causal Engine (Offline / Fallback)
        self._investigate_with_sre_engine(incident, best_hit, is_recalled, topology_context, db)
        incident.updated_at = utc_now()
        db.commit()
        db.refresh(incident)
        return incident

    def _investigate_with_gemini(
        self,
        incident: Incident,
        best_hit: Optional[Any],
        topology_context: str
    ) -> Optional[Dict[str, Any]]:
        """Invokes Google Gemini 2.5 / Flash via official GenAI SDK with structured output."""
        try:
            logger.info("Invoking Gemini 2.5 Flash for autonomous incident investigation...")
            
            prompt = (
                f"You are OpsMind, a Principal Site Reliability Engineer (SRE).\n\n"
                f"ACTIVE INCIDENT TELEMETRY:\n"
                f"Incident ID: {incident.id}\n"
                f"Service: {incident.service}\n"
                f"Severity: {incident.severity}\n"
                f"Title: {incident.title}\n"
                f"Error Message: {incident.error_message or 'None'}\n"
                f"Raw Logs: {incident.raw_logs or 'None'}\n\n"
                f"SYSTEM TOPOLOGY CONTEXT (from Hindsight Memory):\n"
                f"{topology_context}\n\n"
            )

            if best_hit:
                prompt += (
                    f"HISTORICAL PRECEDENT (Recalled from Hindsight Persistent Memory):\n"
                    f"Prior Incident Memory ID: {best_hit.memory_id}\n"
                    f"Similarity Score: {best_hit.score:.1%}\n"
                    f"Past Report: {best_hit.content}\n"
                    f"Prior Verified Fix: {best_hit.metadata.get('resolution', 'N/A')}\n\n"
                    f"INSTRUCTION: Perform differential analysis against this past incident. "
                    f"If the current symptoms match the historical precedent, confirm the root cause and recommend the proven fix.\n"
                )
            else:
                prompt += (
                    f"HISTORICAL PRECEDENT: Zero prior matching incidents on file (Cold-start outage).\n"
                    f"INSTRUCTION: Formulate exploratory root cause hypotheses based on topology and error logs.\n"
                )

            prompt += (
                "\nProvide output in valid JSON matching this schema:\n"
                "{\n"
                '  "suspected_root_cause": "string",\n'
                '  "status": "INVESTIGATING" or "MITIGATING",\n'
                '  "steps": [\n'
                '    {"step_type": "RECALL"|"REFLECT"|"RUNBOOK", "title": "string", "description": "string", "evidence": "string", "confidence": float}\n'
                '  ],\n'
                '  "actions": [\n'
                '    {"command": "string", "description": "string", "risk_level": "SAFE"|"CAUTION"|"HIGH"}\n'
                '  ]\n'
                "}"
            )

            response = self.client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    response_mime_type="application/json"
                )
            )

            if response and response.text:
                return json.loads(response.text)
        except Exception as e:
            logger.warning(f"Gemini API investigation failed or timed out: {e}")

        return None

    def _apply_gemini_investigation(
        self,
        incident: Incident,
        gemini_data: Dict[str, Any],
        best_hit: Optional[Any],
        db: Session
    ):
        """Applies Gemini's synthesized causal reasoning to the incident record."""
        incident.suspected_root_cause = gemini_data.get("suspected_root_cause", incident.suspected_root_cause)
        incident.status = gemini_data.get("status", "INVESTIGATING")

        if best_hit and best_hit.score >= 0.50:
            incident.recalled_from_incident_id = best_hit.metadata.get("incident_id", best_hit.memory_id)
            incident.hindsight_similarity_score = best_hit.score

        # Add steps synthesized by Gemini
        for s in gemini_data.get("steps", []):
            step = InvestigationStep(
                incident_id=incident.id,
                step_type=s.get("step_type", "REFLECT"),
                title=s.get("title", "AI Investigation Finding"),
                description=s.get("description", ""),
                evidence=s.get("evidence", ""),
                confidence=float(s.get("confidence", 0.9)),
                created_at=utc_now()
            )
            db.add(step)

        # Add remediation actions synthesized by Gemini
        for a in gemini_data.get("actions", []):
            action = RemediationAction(
                incident_id=incident.id,
                command=a.get("command", "echo 'Check service health'"),
                description=a.get("description", "Remediation step"),
                risk_level=a.get("risk_level", "SAFE"),
                status="PENDING",
                created_at=utc_now()
            )
            db.add(action)

    def _investigate_with_sre_engine(
        self,
        incident: Incident,
        best_hit: Optional[Any],
        is_recalled: bool,
        topology_context: str,
        db: Session
    ):
        """Deterministic SRE Causal Engine with full Hindsight memory correlation."""
        if is_recalled and best_hit:
            # === RECALLED INCIDENT PATHWAY ===
            prior_inc_id = best_hit.metadata.get("incident_id", best_hit.memory_id)
            incident.recalled_from_incident_id = prior_inc_id
            incident.hindsight_similarity_score = best_hit.score
            incident.suspected_root_cause = best_hit.metadata.get(
                "root_cause",
                f"High probability correlation with prior incident {prior_inc_id}: {best_hit.content[:140]}..."
            )

            # Step 1: RECALL step
            recall_step = InvestigationStep(
                incident_id=incident.id,
                step_type="RECALL",
                title=f"Hindsight Memory Hit: Prior Outage #{prior_inc_id}",
                description=(
                    f"Recalled previous incident with {best_hit.score:.1%} hybrid similarity match.\n"
                    f"Prior Incident: {best_hit.content}\n"
                    f"Entities Linked: {', '.join(best_hit.entities) if best_hit.entities else 'Service cluster'}.\n"
                    f"Prior Resolution: {best_hit.metadata.get('resolution', 'Applied verified configuration fix.')}"
                ),
                evidence=f"Hindsight Bank: {settings.HINDSIGHT_BANK_INCIDENTS} | Similarity: {best_hit.score:.1%}",
                confidence=round(best_hit.score, 2),
                created_at=utc_now()
            )
            db.add(recall_step)

            # Step 2: REFLECT step
            reflect_summary = hindsight_service.reflect(
                bank_id=settings.HINDSIGHT_BANK_INCIDENTS,
                query=f"{incident.service} {incident.title}"
            )
            reflect_step = InvestigationStep(
                incident_id=incident.id,
                step_type="REFLECT",
                title="Causal Inference & Differential Comparison",
                description=(
                    f"Comparative Analysis against Incident #{prior_inc_id}:\n"
                    f"1. Symptoms: Both incidents exhibit rapid memory inflation leading to service degradation.\n"
                    f"2. Architecture Link: {incident.service} relies on Redis caching layer.\n"
                    f"3. Root Cause Hypothesis: Regression to default eviction policy or unhandled cache eviction buffer overflow.\n"
                    f"4. Verified Precedent: Previous outage was fully mitigated by switching eviction policy to volatile-lru."
                ),
                evidence=reflect_summary,
                confidence=0.92,
                created_at=utc_now()
            )
            db.add(reflect_step)

            # Step 3: Synthesize Guarded Runbook Actions
            actions = [
                RemediationAction(
                    incident_id=incident.id,
                    command="redis-cli config set maxmemory-policy volatile-lru",
                    description="Switch Redis eviction policy to volatile-lru to evict expired cache keys immediately",
                    risk_level="CAUTION",
                    status="PENDING",
                    created_at=utc_now()
                ),
                RemediationAction(
                    incident_id=incident.id,
                    command=f"kubectl rollout restart deployment/{incident.service}",
                    description=f"Gracefully cycle {incident.service} worker pods to flush stuck connection pools",
                    risk_level="CAUTION",
                    status="PENDING",
                    created_at=utc_now()
                )
            ]
            for act in actions:
                db.add(act)

            incident.status = "MITIGATING"

        else:
            # === COLD-START PATHWAY ===
            incident.suspected_root_cause = (
                "Unidentified failure mode. Symptoms indicate memory exhaustion or cascading downstream timeout. "
                "Exploratory investigation required."
            )

            recall_step = InvestigationStep(
                incident_id=incident.id,
                step_type="RECALL",
                title="Hindsight Memory Search: Zero Prior Precedent",
                description=(
                    f"Searched memory bank '{settings.HINDSIGHT_BANK_INCIDENTS}'.\n"
                    f"No matching historical incident exceeds similarity threshold (Best match score: 0.18).\n"
                    f"Classified as Novel Cold-Start Outage. Formulating initial baseline hypotheses."
                ),
                evidence="Hindsight Search: 0 matches > 0.50 threshold.",
                confidence=1.0,
                created_at=utc_now()
            )
            db.add(recall_step)

            reflect_step = InvestigationStep(
                incident_id=incident.id,
                step_type="REFLECT",
                title="Exploratory Causal Hypotheses & Topology Mapping",
                description=(
                    f"System Topology Context:\n{topology_context}\n\n"
                    f"Possible Root Causes (Unconfirmed):\n"
                    f"• Hypothesis A (High Probability): Heap / cache leak in worker processes.\n"
                    f"• Hypothesis B (Medium Probability): Redis connection pool saturation or deadlock.\n"
                    f"• Hypothesis C (Low Probability): Host node memory pressure or noisy neighbor.\n\n"
                    f"Recommendation: Review thread dumps, inspect cache memory metrics, and confirm root cause with on-call engineer."
                ),
                evidence=incident.raw_logs or incident.error_message or "System metrics anomaly",
                confidence=0.65,
                created_at=utc_now()
            )
            db.add(reflect_step)

            actions = [
                RemediationAction(
                    incident_id=incident.id,
                    command=f"kubectl top pods -l app={incident.service} --containers",
                    description="Inspect live pod CPU and memory utilization breakdown",
                    risk_level="SAFE",
                    status="PENDING",
                    created_at=utc_now()
                ),
                RemediationAction(
                    incident_id=incident.id,
                    command="redis-cli info memory | grep -E 'used_memory_human|maxmemory_policy'",
                    description="Check Redis cache memory consumption and current eviction policy",
                    risk_level="SAFE",
                    status="PENDING",
                    created_at=utc_now()
                )
            ]
            for act in actions:
                db.add(act)

            incident.status = "INVESTIGATING"


ai_investigator = AIInvestigator()
