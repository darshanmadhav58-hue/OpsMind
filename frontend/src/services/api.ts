import { Incident, IncidentSummary, DashboardMetrics, HealthStatus, RemediationAction } from '../types';

const BASE_URL = '/api/v1';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to fetch health status');
  return res.json();
}

export async function fetchMetrics(): Promise<DashboardMetrics> {
  const res = await fetch(`${BASE_URL}/incidents/dashboard/metrics`);
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function fetchIncidents(status?: string, severity?: string): Promise<IncidentSummary[]> {
  const params = new URLSearchParams();
  if (status && status !== 'ALL') params.append('status', status);
  if (severity && severity !== 'ALL') params.append('severity', severity);

  const url = `${BASE_URL}/incidents${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchIncidentById(id: string): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/incidents/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch incident ${id}`);
  return res.json();
}

export async function createIncident(data: {
  title: string;
  service: string;
  severity: string;
  error_message?: string;
  raw_logs?: string;
}): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create incident');
  return res.json();
}

export async function ingestAlert(data: {
  source: string;
  service: string;
  alert_name: string;
  severity: string;
  message: string;
  raw_logs?: string;
}): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/incidents/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to ingest alert');
  return res.json();
}

export async function approveRemediationAction(
  incidentId: string,
  actionId: number,
  approved: boolean,
  approvedBy: string = 'sre-lead@opsmind.io'
): Promise<RemediationAction> {
  const res = await fetch(`${BASE_URL}/incidents/${incidentId}/actions/${actionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved, approved_by: approvedBy }),
  });
  if (!res.ok) throw new Error('Failed to submit action approval');
  return res.json();
}

export async function resolveIncident(
  incidentId: string,
  confirmedRootCause: string,
  resolutionSummary: string,
  lessonsLearned?: string
): Promise<Incident> {
  const res = await fetch(`${BASE_URL}/incidents/${incidentId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      confirmed_root_cause: confirmedRootCause,
      resolution_summary: resolutionSummary,
      lessons_learned: lessonsLearned,
    }),
  });
  if (!res.ok) throw new Error('Failed to resolve incident');
  return res.json();
}

export async function fetchMemoryBanks(): Promise<{
  banks: Record<string, { count: number; status: string; disk_persisted: boolean }>;
  total_memories: number;
  persistence_file: string;
  connected_url: string;
  hindsight_sdk_active: boolean;
  hindsight_server_online: boolean;
}> {
  const res = await fetch(`${BASE_URL}/memory/banks`);
  if (!res.ok) throw new Error('Failed to fetch memory banks');
  return res.json();
}

export async function fetchMemoryRecords(bank: string = 'opsmind-incidents'): Promise<{
  bank: string;
  total_records: number;
  records: Array<{
    memory_id: string;
    bank_id: string;
    content: string;
    tags: string[];
    metadata: Record<string, any>;
    created_at: string;
  }>;
}> {
  const res = await fetch(`${BASE_URL}/memory/records?bank=${encodeURIComponent(bank)}`);
  if (!res.ok) throw new Error('Failed to fetch memory records');
  return res.json();
}


