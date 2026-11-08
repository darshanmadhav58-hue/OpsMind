from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Float, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    service = Column(String(128), nullable=False, index=True)
    severity = Column(String(16), nullable=False, default="P2", index=True)
    status = Column(String(32), nullable=False, default="TRIGGERED", index=True)
    
    error_message = Column(Text, nullable=True)
    raw_logs = Column(Text, nullable=True)
    
    suspected_root_cause = Column(Text, nullable=True)
    confirmed_root_cause = Column(Text, nullable=True)
    resolution_summary = Column(Text, nullable=True)
    
    hindsight_memory_id = Column(String(128), nullable=True)
    hindsight_similarity_score = Column(Float, nullable=True)
    recalled_from_incident_id = Column(String(64), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    investigation_steps = relationship("InvestigationStep", back_populates="incident", cascade="all, delete-orphan")
    remediation_actions = relationship("RemediationAction", back_populates="incident", cascade="all, delete-orphan")


class InvestigationStep(Base):
    __tablename__ = "investigation_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    step_type = Column(String(32), nullable=False)  # TRIAGE, RECALL, REFLECT, HYPOTHESIS, RUNBOOK
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    incident = relationship("Incident", back_populates="investigation_steps")


class RemediationAction(Base):
    __tablename__ = "remediation_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    command = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    risk_level = Column(String(16), default="SAFE")  # SAFE, CAUTION, HIGH
    is_approved = Column(Boolean, default=False)
    approved_by = Column(String(128), nullable=True)
    status = Column(String(32), default="PENDING")   # PENDING, APPROVED, EXECUTED, REJECTED
    output = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    executed_at = Column(DateTime(timezone=True), nullable=True)

    incident = relationship("Incident", back_populates="remediation_actions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), nullable=True, index=True)
    action = Column(String(64), nullable=False)
    actor = Column(String(128), default="SRE-Agent")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now)
