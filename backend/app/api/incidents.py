from datetime import datetime, timezone
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import Incident, InvestigationStep, RemediationAction, AuditLog
from app.schemas.incident import (
    IncidentCreate,
    IncidentResponse,
    IncidentSummary,
    AlertIngest,
    RemediationApprovalRequest,
    RemediationActionSchema,
    IncidentResolutionRequest,
    DashboardMetrics
)
from app.services.ai_investigator import ai_investigator
from app.services.learning_engine import learning_engine

router = APIRouter()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_incident_id() -> str:
    now = utc_now()
    rand_suffix = str(uuid.uuid4())[:4].upper()
    return f"INC-{now.strftime('%Y%m%d')}-{rand_suffix}"


@router.get("", response_model=List[IncidentSummary])
def list_incidents(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Incident).order_by(desc(Incident.created_at))
    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)
    if service:
        query = query.filter(Incident.service == service)

    return query.all()


@router.post("", response_model=IncidentResponse)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    inc_id = generate_incident_id()
    now = utc_now()
    incident = Incident(
        id=inc_id,
        title=payload.title,
        service=payload.service,
        severity=payload.severity,
        status="TRIGGERED",
        error_message=payload.error_message,
        raw_logs=payload.raw_logs,
        created_at=now,
        updated_at=now
    )
    db.add(incident)

    # Initial Triage step
    step = InvestigationStep(
        incident_id=inc_id,
        step_type="TRIAGE",
        title="Incident Ingested & Classified",
        description=f"Received alert for service '{payload.service}'. Initial severity: {payload.severity}.",
        evidence=payload.error_message or "Alert payload received.",
        confidence=1.0,
        created_at=now
    )
    db.add(step)

    audit = AuditLog(
        incident_id=inc_id,
        action="INCIDENT_CREATED",
        actor="System",
        details=f"Incident {inc_id} opened for {payload.service}."
    )
    db.add(audit)

    db.commit()
    db.refresh(incident)

    # Run AI Investigation & Hindsight Memory Recall
    incident = ai_investigator.investigate(incident, db)
    return incident


@router.post("/ingest", response_model=IncidentResponse)
def ingest_alert(alert: AlertIngest, db: Session = Depends(get_db)):
    inc_id = generate_incident_id()
    now = utc_now()
    title = f"{alert.service}: {alert.alert_name}"
    incident = Incident(
        id=inc_id,
        title=title,
        service=alert.service,
        severity=alert.severity,
        status="TRIGGERED",
        error_message=alert.message,
        raw_logs=alert.raw_logs,
        created_at=now,
        updated_at=now
    )
    db.add(incident)

    step = InvestigationStep(
        incident_id=inc_id,
        step_type="TRIAGE",
        title=f"Telemetry Alert from {alert.source}",
        description=f"Ingested alert '{alert.alert_name}' with message: {alert.message}",
        evidence=alert.raw_logs or alert.message,
        confidence=1.0,
        created_at=now
    )
    db.add(step)

    audit = AuditLog(
        incident_id=inc_id,
        action="ALERT_INGESTED",
        actor=alert.source,
        details=f"Source: {alert.source}, Severity: {alert.severity}"
    )
    db.add(audit)

    db.commit()
    db.refresh(incident)

    # Run AI Investigation & Hindsight Memory Recall
    incident = ai_investigator.investigate(incident, db)
    return incident


@router.get("/dashboard/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    all_incidents = db.query(Incident).all()

    total = len(all_incidents)
    active = sum(1 for i in all_incidents if i.status != "RESOLVED")
    critical = sum(1 for i in all_incidents if i.severity == "P1" and i.status != "RESOLVED")
    resolved = sum(1 for i in all_incidents if i.status == "RESOLVED")
    recall_hits = sum(1 for i in all_incidents if i.recalled_from_incident_id is not None)

    durations = []
    for inc in all_incidents:
        if inc.resolved_at and inc.created_at:
            mins = (inc.resolved_at - inc.created_at).total_seconds() / 60.0
            if mins > 0:
                durations.append(mins)
    
    avg_mttr = round(sum(durations) / len(durations), 1) if durations else 0.0

    severity_dist = {"P1": 0, "P2": 0, "P3": 0, "P4": 0}
    status_dist = {"TRIGGERED": 0, "INVESTIGATING": 0, "MITIGATING": 0, "RESOLVED": 0}
    service_dist = {}

    for inc in all_incidents:
        severity_dist[inc.severity] = severity_dist.get(inc.severity, 0) + 1
        status_dist[inc.status] = status_dist.get(inc.status, 0) + 1
        service_dist[inc.service] = service_dist.get(inc.service, 0) + 1

    return DashboardMetrics(
        total_incidents=total,
        active_incidents=active,
        critical_incidents=critical,
        resolved_incidents=resolved,
        average_mttr_minutes=avg_mttr,
        total_memory_recalls=recall_hits,
        severity_distribution=severity_dist,
        status_distribution=status_dist,
        service_distribution=service_dist
    )


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return incident


@router.post("/{incident_id}/actions/{action_id}/approve", response_model=RemediationActionSchema)
def approve_remediation_action(
    incident_id: str,
    action_id: int,
    approval: RemediationApprovalRequest,
    db: Session = Depends(get_db)
):
    action = db.query(RemediationAction).filter(
        RemediationAction.id == action_id,
        RemediationAction.incident_id == incident_id
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="Remediation action not found.")

    action.is_approved = approval.approved
    action.approved_by = approval.approved_by
    action.status = "APPROVED" if approval.approved else "REJECTED"
    action.executed_at = utc_now() if approval.approved else None
    
    if approval.approved:
        action.output = f"[VERIFIED EXECUTION] Command `{action.command}` applied successfully in production by {approval.approved_by}."
    else:
        action.output = f"Command execution rejected by {approval.approved_by}."

    audit = AuditLog(
        incident_id=incident_id,
        action="ACTION_APPROVED" if approval.approved else "ACTION_REJECTED",
        actor=approval.approved_by,
        details=f"Action #{action_id} (`{action.command}`) {'approved' if approval.approved else 'rejected'}."
    )
    db.add(audit)

    db.commit()
    db.refresh(action)
    return action


@router.post("/{incident_id}/resolve", response_model=IncidentResponse)
def resolve_incident(
    incident_id: str,
    resolution: IncidentResolutionRequest,
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")

    now = utc_now()
    incident.status = "RESOLVED"
    incident.confirmed_root_cause = resolution.confirmed_root_cause
    incident.resolution_summary = resolution.resolution_summary
    incident.resolved_at = now
    incident.updated_at = now

    step = InvestigationStep(
        incident_id=incident_id,
        step_type="RUNBOOK",
        title="Incident Marked Resolved by Engineer",
        description=f"Confirmed Root Cause: {resolution.confirmed_root_cause}\nResolution: {resolution.resolution_summary}",
        evidence=resolution.lessons_learned or "Resolution verified in production.",
        confidence=1.0,
        created_at=now
    )
    db.add(step)

    audit = AuditLog(
        incident_id=incident_id,
        action="INCIDENT_RESOLVED",
        actor="SRE-Engineer",
        details=f"Incident {incident_id} closed."
    )
    db.add(audit)

    db.commit()
    db.refresh(incident)

    # Retain learning into Hindsight Memory Engine
    learning_engine.learn_from_resolution(
        incident=incident,
        confirmed_root_cause=resolution.confirmed_root_cause,
        resolution_summary=resolution.resolution_summary,
        lessons_learned=resolution.lessons_learned,
        db=db
    )

    db.refresh(incident)
    return incident
