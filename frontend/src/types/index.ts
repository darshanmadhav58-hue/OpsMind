export type Severity = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'TRIGGERED' | 'INVESTIGATING' | 'MITIGATING' | 'RESOLVED';
export type StepType = 'TRIAGE' | 'RECALL' | 'REFLECT' | 'HYPOTHESIS' | 'RUNBOOK';
export type RiskLevel = 'SAFE' | 'CAUTION' | 'HIGH';
export type ActionStatus = 'PENDING' | 'APPROVED' | 'EXECUTED' | 'REJECTED';

export interface InvestigationStep {
  id: number;
  incident_id?: string;
  step_type: StepType;
  title: string;
  description: string;
  evidence?: string;
  confidence: number;
  created_at: string;
}

export interface RemediationAction {
  id: number;
  incident_id?: string;
  command: string;
  description: string;
  risk_level: RiskLevel;
  is_approved: boolean;
  approved_by?: string;
  status: ActionStatus;
  output?: string;
  created_at: string;
  executed_at?: string;
}

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  error_message?: string;
  raw_logs?: string;
  suspected_root_cause?: string;
  confirmed_root_cause?: string;
  resolution_summary?: string;
  hindsight_memory_id?: string;
  hindsight_similarity_score?: number;
  recalled_from_incident_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  investigation_steps: InvestigationStep[];
  remediation_actions: RemediationAction[];
}

export interface IncidentSummary {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  status: IncidentStatus;
  created_at: string;
  resolved_at?: string;
  hindsight_memory_id?: string;
  recalled_from_incident_id?: string;
}

export interface DashboardMetrics {
  total_incidents: number;
  active_incidents: number;
  critical_incidents: number;
  resolved_incidents: number;
  average_mttr_minutes: number;
  total_memory_recalls: number;
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  service_distribution: Record<string, number>;
}

export interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  timestamp: string;
  database: string;
  hindsight: {
    base_url: string;
    bank_incidents: string;
    bank_services: string;
    hindsight_sdk_active?: boolean;
    persisted_memories?: number;
  };
  ai_engine?: {
    gemini_configured: boolean;
    model: string;
  };
}
