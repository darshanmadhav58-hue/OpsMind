import pytest
import os
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.memory.hindsight_service import HindsightService, hindsight_service
from app.services.ai_investigator import AIInvestigator, ai_investigator
from app.core.config import settings
from app.db.database import Base
from app.db.models import Incident
from app.schemas.incident import IncidentCreate, AlertIngest, IncidentResolutionRequest
from app.api.incidents import create_incident, ingest_alert, resolve_incident

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    # Ensure clean isolated memory state for each test run
    hindsight_service._local_memory_store = {b: [] for b in hindsight_service.banks}
    hindsight_service._seed_initial_service_topology()
    yield
    Base.metadata.drop_all(bind=test_engine)
    hindsight_service._local_memory_store = {b: [] for b in hindsight_service.banks}
    hindsight_service._seed_initial_service_topology()


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_hindsight_retain_and_recall():
    """Verify that Hindsight retain stores memories and recall retrieves them via multi-strategy search."""
    bank = settings.HINDSIGHT_BANK_INCIDENTS
    test_content = "Incident INC-TEST-001: payment-service crashed due to Redis connection pool exhaustion. Fix was expanding pool size to 50."
    tags = ["payment-service", "redis", "pool-exhaustion", "p1"]
    meta = {"incident_id": "INC-TEST-001", "service": "payment-service"}

    # Retain
    mem_id = hindsight_service.retain(bank_id=bank, content=test_content, tags=tags, metadata=meta)
    assert mem_id.startswith("MEM-")

    # Recall
    hits = hindsight_service.recall(bank_id=bank, query="payment-service Redis pool exhaustion", top_k=3)
    assert len(hits) >= 1
    assert any(h.memory_id == mem_id for h in hits)
    assert hits[0].score >= 0.50
    assert "redis" in hits[0].entities


def test_hindsight_reflect():
    """Verify Hindsight agentic reflection over memory bank contents."""
    bank = settings.HINDSIGHT_BANK_SERVICES
    reflection = hindsight_service.reflect(bank_id=bank, query="payment-service architecture and redis dependency")
    assert "Hindsight Reflection" in reflection
    assert "payment-service" in reflection


def test_cross_session_memory_persistence():
    """Verify cognitive memories persist to disk and survive complete server/process restarts."""
    bank = settings.HINDSIGHT_BANK_INCIDENTS
    unique_content = "Incident INC-PERSIST-999: auth-service token leak resolved via public key rotation."
    hindsight_service.retain(
        bank_id=bank,
        content=unique_content,
        tags=["auth-service", "token-leak"],
        metadata={"incident_id": "INC-PERSIST-999", "service": "auth-service"}
    )

    # Simulate fresh backend boot: create brand new HindsightService instance that loads from disk
    new_hindsight_instance = HindsightService()
    hits = new_hindsight_instance.recall(bank_id=bank, query="auth-service token leak", top_k=1)
    
    assert len(hits) >= 1
    assert "INC-PERSIST-999" in hits[0].content
    assert hits[0].score >= 0.50


def test_gemini_integration_and_fallback(db_session):
    """Verify AIInvestigator handles Gemini integration gracefully and provides expert reasoning."""
    investigator = AIInvestigator()
    incident = Incident(
        id="INC-GEMINI-TEST",
        title="High CPU and Memory Spike",
        service="payment-service",
        severity="P1",
        status="TRIGGERED",
        error_message="Worker pool exhausted",
        raw_logs="Thread dump: 150 threads in WAITING state on Redis cache lock."
    )
    db_session.add(incident)
    db_session.commit()

    investigated = investigator.investigate(incident, db_session)
    assert investigated.status in ("INVESTIGATING", "MITIGATING")
    assert investigated.suspected_root_cause is not None
    assert len(investigated.investigation_steps) >= 2


def test_two_stage_demonstration_golden_path(db_session):
    """
    CRUCIAL COMPETITION TEST:
    STAGE 1: Ingest novel cold-start incident -> SRE investigates -> confirms root cause -> resolves -> Hindsight retains.
    STAGE 2: Ingest recurrent incident -> Hindsight automatically recalls Stage 1 -> explains similarity -> suggests proven fix.
    """
    # === STAGE 1: NOVEL OUTAGE (COLD START) ===
    alert_1 = AlertIngest(
        source="Kubernetes-Alertmanager",
        service="checkout-service",
        alert_name="OOMKilled_MemoryStarvation",
        severity="P1",
        message="checkout-service pod memory limits exceeded. 504 Gateway Timeouts.",
        raw_logs="OutOfMemoryError: Java heap space. Redis cache keys unevicted."
    )
    inc_1 = ingest_alert(alert_1, db_session)
    assert inc_1.status in ("INVESTIGATING", "TRIGGERED")
    # In cold start, no prior incident matches
    assert inc_1.recalled_from_incident_id is None

    # SRE investigates, identifies root cause, and resolves incident
    resolution_1 = IncidentResolutionRequest(
        confirmed_root_cause="Redis cache eviction policy set to noeviction under high traffic",
        resolution_summary="Applied hotfix: config set maxmemory-policy volatile-lru and expanded Redis RAM",
        lessons_learned="Never allow noeviction policy in production caching tiers."
    )
    resolved_1 = resolve_incident(inc_1.id, resolution_1, db_session)
    assert resolved_1.status == "RESOLVED"
    assert resolved_1.hindsight_memory_id is not None  # Successfully retained in Hindsight!

    # === STAGE 2: RECURRENT OUTAGE (HINDSIGHT MEMORY ADVANTAGE) ===
    # A similar incident triggers 2 weeks later
    alert_2 = AlertIngest(
        source="Datadog",
        service="checkout-service",
        alert_name="LatencySpikeAndMemoryAlarm",
        severity="P1",
        message="checkout-service latency surge past 5000ms. High memory pressure on cache.",
        raw_logs="Redis connection backlog. Unevicted keys count rising rapidly."
    )
    inc_2 = ingest_alert(alert_2, db_session)

    # Verify Hindsight Memory automatically recalled Stage 1 incident!
    assert inc_2.recalled_from_incident_id == inc_1.id
    assert inc_2.hindsight_similarity_score is not None
    assert inc_2.hindsight_similarity_score >= 0.50
    assert inc_2.status == "MITIGATING"

    # Verify Investigation Steps contain RECALL and REFLECT citing the prior incident
    step_types = [s.step_type for s in inc_2.investigation_steps]
    assert "RECALL" in step_types
    assert "REFLECT" in step_types

    # Verify that Guarded Remediation Actions were generated from the prior fix
    commands = [a.command for a in inc_2.remediation_actions]
    assert any("volatile-lru" in cmd for cmd in commands)
