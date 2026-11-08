import pytest
import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.memory.hindsight_service import hindsight_service, HindsightService
from app.services.ai_investigator import ai_investigator
from app.services.learning_engine import learning_engine
from app.core.config import settings
from app.db.database import Base
from app.db.models import Incident
from app.schemas.incident import AlertIngest, IncidentResolutionRequest
from app.api.incidents import ingest_alert, resolve_incident

TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def setup_isolated_env():
    Base.metadata.create_all(bind=test_engine)
    # Reset in-memory store and re-seed topology for clean deterministic testing
    hindsight_service._local_memory_store = {b: [] for b in hindsight_service.banks}
    hindsight_service._seed_initial_service_topology()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_scenario_1_cold_start_novel_outage(db):
    """Scenario 1: Novel memory crash with 0 prior precedent."""
    with open("scenarios/scenario_1_cold_case.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    alert = AlertIngest(**data["payload"])
    inc = ingest_alert(alert, db)
    
    # Assert cold start properties
    assert inc.id.startswith("INC-")
    assert inc.service == "payment-service"
    assert inc.severity == "P1"
    assert inc.status in ("INVESTIGATING", "TRIGGERED")
    assert inc.recalled_from_incident_id is None
    
    # Assert investigation steps contain RECALL with zero precedent
    step_types = [s.step_type for s in inc.investigation_steps]
    assert "RECALL" in step_types
    assert "REFLECT" in step_types

    # Assert safe diagnostic remediation actions
    actions = [a.command for a in inc.remediation_actions]
    assert any("kubectl top pods" in cmd for cmd in actions)

    # Resolve incident and verify Hindsight retention
    res_data = data["resolution"]
    res_req = IncidentResolutionRequest(**res_data)
    resolved = resolve_incident(inc.id, res_req, db)
    assert resolved.status == "RESOLVED"
    assert resolved.hindsight_memory_id is not None
    assert resolved.hindsight_memory_id.startswith("MEM-")

    # Verify memory is in Hindsight bank
    hits = hindsight_service.recall(settings.HINDSIGHT_BANK_INCIDENTS, "payment-service memory starvation eviction", top_k=1)
    assert len(hits) >= 1
    assert hits[0].metadata.get("incident_id") == inc.id


def test_scenario_2_recurrent_outage_hindsight_advantage(db):
    """Scenario 2: Similar failure occurs later; Hindsight recalls Scenario 1."""
    # First seed Scenario 1 as resolved
    with open("scenarios/scenario_1_cold_case.json", "r", encoding="utf-8") as f:
        sc1 = json.load(f)
    inc1 = ingest_alert(AlertIngest(**sc1["payload"]), db)
    resolve_incident(inc1.id, IncidentResolutionRequest(**sc1["resolution"]), db)

    # Now trigger Scenario 2
    with open("scenarios/scenario_2_recalled_case.json", "r", encoding="utf-8") as f:
        sc2 = json.load(f)
    inc2 = ingest_alert(AlertIngest(**sc2["payload"]), db)

    # Verify Hindsight recalled Scenario 1
    assert inc2.recalled_from_incident_id == inc1.id
    assert inc2.hindsight_similarity_score is not None
    assert inc2.hindsight_similarity_score >= 0.50
    assert inc2.status == "MITIGATING"

    # Verify that proven fix was suggested in remediation actions
    commands = [a.command for a in inc2.remediation_actions]
    assert any("volatile-lru" in cmd for cmd in commands)


def test_scenario_3_auth_canary_topology_isolation(db):
    """Scenario 3: AuthService canary latency drift; isolates from payment memory."""
    with open("scenarios/scenario_3_auth_canary.json", "r", encoding="utf-8") as f:
        sc3 = json.load(f)
    inc3 = ingest_alert(AlertIngest(**sc3["payload"]), db)

    assert inc3.service == "auth-service"
    assert inc3.severity == "P2"
    # Should not falsely recall payment-service memory
    assert inc3.recalled_from_incident_id is None

    # Should recall auth topology from opsmind-services
    steps = [s.description for s in inc3.investigation_steps]
    combined_steps = " ".join(steps)
    assert "auth-service" in combined_steps.lower() or "jwt" in combined_steps.lower()


def test_scenario_4_database_pool_runbook_recall(db):
    """Scenario 4: OrdersDB pool contention; matches runbook recommendations."""
    with open("scenarios/scenario_4_db_pool.json", "r", encoding="utf-8") as f:
        sc4 = json.load(f)
    inc4 = ingest_alert(AlertIngest(**sc4["payload"]), db)

    assert inc4.service == "orders-db"
    assert inc4.severity == "P1"
    # Remediation actions should include diagnostics for connection pool / thread state
    assert len(inc4.investigation_steps) >= 2
    assert len(inc4.remediation_actions) >= 1

