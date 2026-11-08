import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import root
from app.api.health import health_check
from app.api.incidents import (
    create_incident,
    ingest_alert,
    get_incident,
    list_incidents,
    resolve_incident,
    approve_remediation_action,
    get_dashboard_metrics
)
from app.api.memory import get_memory_banks, get_bank_records
from app.db.database import Base
from app.db.models import RemediationAction
from app.schemas.incident import (
    IncidentCreate,
    AlertIngest,
    IncidentResolutionRequest,
    RemediationApprovalRequest
)

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
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_root_endpoint():
    res = root()
    assert "OpsMind" in res["name"]
    assert res["health_url"] == "/api/v1/health"


def test_health_endpoint(db_session):
    res = health_check(db_session)
    assert res["status"] == "operational"
    assert res["database"] == "healthy"
    assert "hindsight" in res


def test_create_and_get_incident(db_session):
    payload = IncidentCreate(
        title="Payment gateway latency elevated",
        service="payment-service",
        severity="P1",
        status="TRIGGERED",
        error_message="Upstream timeout after 5000ms",
        raw_logs="ERROR 2026-11-05 10:14:22 [PaymentWorker] ConnectTimeout: Redis pool full"
    )
    created = create_incident(payload, db_session)
    assert created.id.startswith("INC-")
    assert created.service == "payment-service"
    assert created.severity == "P1"
    # Automated investigation should generate at least TRIAGE, RECALL, and REFLECT steps
    assert len(created.investigation_steps) >= 3
    step_types = [s.step_type for s in created.investigation_steps]
    assert "TRIAGE" in step_types
    assert "RECALL" in step_types

    fetched = get_incident(created.id, db_session)
    assert fetched.id == created.id
    assert fetched.title == payload.title


def test_alert_ingest(db_session):
    alert = AlertIngest(
        source="Prometheus-Alertmanager",
        service="auth-service",
        alert_name="High5xxErrorRate",
        severity="P2",
        message="5xx rate exceeding 5% threshold over 5m",
        raw_logs="502 Bad Gateway to identity provider"
    )
    created = ingest_alert(alert, db_session)
    assert created.service == "auth-service"
    assert "High5xxErrorRate" in created.title
    assert created.status in ("INVESTIGATING", "MITIGATING")


def test_resolve_incident(db_session):
    created = create_incident(IncidentCreate(
        title="High memory consumption on cache node",
        service="cache-service",
        severity="P2",
        status="TRIGGERED"
    ), db_session)

    resolve_payload = IncidentResolutionRequest(
        confirmed_root_cause="Key leak in session store cache",
        resolution_summary="Purged orphan sessions and deployed patch v1.4.2",
        lessons_learned="Set TTL on all session keys by default"
    )
    resolved = resolve_incident(created.id, resolve_payload, db_session)
    assert resolved.status == "RESOLVED"
    assert resolved.confirmed_root_cause == resolve_payload.confirmed_root_cause
    assert resolved.resolution_summary == resolve_payload.resolution_summary
    assert resolved.resolved_at is not None
    assert resolved.hindsight_memory_id is not None


def test_approve_remediation_action(db_session):
    created = create_incident(IncidentCreate(
        title="Out of memory on worker",
        service="worker-service",
        severity="P1",
        status="TRIGGERED"
    ), db_session)

    action = RemediationAction(
        incident_id=created.id,
        command="kubectl rollout restart deployment/worker",
        description="Restart deployment to clear stuck threads",
        risk_level="CAUTION",
        status="PENDING"
    )
    db_session.add(action)
    db_session.commit()
    db_session.refresh(action)

    approval_payload = RemediationApprovalRequest(
        approved=True,
        approved_by="sre-senior@opsmind.io"
    )
    approved_action = approve_remediation_action(created.id, action.id, approval_payload, db_session)
    assert approved_action.is_approved is True
    assert approved_action.approved_by == "sre-senior@opsmind.io"
    assert approved_action.status == "APPROVED"
    assert "applied successfully" in approved_action.output


def test_dashboard_metrics(db_session):
    create_incident(IncidentCreate(
        title="DB Lock contention",
        service="orders-db",
        severity="P1",
        status="TRIGGERED"
    ), db_session)

    metrics = get_dashboard_metrics(db_session)
    assert metrics.total_incidents >= 1
    assert metrics.active_incidents >= 1
    assert metrics.critical_incidents >= 1
    assert "P1" in metrics.severity_distribution


def test_memory_api_endpoints():
    banks_res = get_memory_banks()
    assert "banks" in banks_res
    assert "opsmind-incidents" in banks_res["banks"]

    records_res = get_bank_records("opsmind-services")
    assert records_res["bank"] == "opsmind-services"
    assert records_res["total_records"] >= 2
    assert len(records_res["records"]) >= 2

