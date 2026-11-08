from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class IncidentBase(BaseModel):
    title: str = Field(..., json_schema_extra={"example": "PaymentService Connection Pool Depleted"})
    service: str = Field(..., json_schema_extra={"example": "payment-service"})
    severity: str = Field("P2", json_schema_extra={"example": "P1"})
    status: str = Field("TRIGGERED", json_schema_extra={"example": "TRIGGERED"})
    error_message: Optional[str] = None
    raw_logs: Optional[str] = None


class IncidentCreate(IncidentBase):
    pass


class AlertIngest(BaseModel):
    source: str = Field("Prometheus", json_schema_extra={"example": "Prometheus"})
    service: str = Field(..., json_schema_extra={"example": "payment-service"})
    alert_name: str = Field(..., json_schema_extra={"example": "HighErrorRate5xx"})
    severity: str = Field("P2", json_schema_extra={"example": "P1"})
    message: str = Field(..., json_schema_extra={"example": "HTTP 504 Gateway Timeout elevated on /checkout"})
    raw_logs: Optional[str] = None


class InvestigationStepSchema(BaseModel):
    id: int
    step_type: str
    title: str
    description: str
    evidence: Optional[str] = None
    confidence: float = 1.0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RemediationActionSchema(BaseModel):
    id: int
    command: str
    description: str
    risk_level: str = "SAFE"
    is_approved: bool = False
    approved_by: Optional[str] = None
    status: str = "PENDING"
    output: Optional[str] = None
    created_at: datetime
    executed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RemediationApprovalRequest(BaseModel):
    approved: bool
    approved_by: str = Field(..., json_schema_extra={"example": "sre-oncall@opsmind.io"})


class IncidentResolutionRequest(BaseModel):
    confirmed_root_cause: str = Field(..., json_schema_extra={"example": "Redis eviction policy was set to noeviction, exhausting memory."})
    resolution_summary: str = Field(..., json_schema_extra={"example": "Updated Redis maxmemory policy to volatile-lru and expanded cluster memory to 8GB."})
    lessons_learned: Optional[str] = None


class IncidentResponse(IncidentBase):
    id: str
    suspected_root_cause: Optional[str] = None
    confirmed_root_cause: Optional[str] = None
    resolution_summary: Optional[str] = None
    hindsight_memory_id: Optional[str] = None
    hindsight_similarity_score: Optional[float] = None
    recalled_from_incident_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    investigation_steps: List[InvestigationStepSchema] = []
    remediation_actions: List[RemediationActionSchema] = []

    model_config = ConfigDict(from_attributes=True)


class IncidentSummary(BaseModel):
    id: str
    title: str
    service: str
    severity: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    hindsight_memory_id: Optional[str] = None
    recalled_from_incident_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DashboardMetrics(BaseModel):
    total_incidents: int
    active_incidents: int
    critical_incidents: int
    resolved_incidents: int
    average_mttr_minutes: float
    total_memory_recalls: int
    severity_distribution: dict
    status_distribution: dict
    service_distribution: dict
