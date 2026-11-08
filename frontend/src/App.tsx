import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchHealth,
  fetchMetrics,
  fetchIncidents,
  fetchIncidentById,
  ingestAlert,
  approveRemediationAction,
  resolveIncident
} from './services/api';
import { Incident, IncidentSummary, DashboardMetrics, HealthStatus, Severity } from './types';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { IncidentList } from './components/IncidentList';
import { InvestigationTimeline } from './components/InvestigationTimeline';
import { MemoryInspector } from './components/MemoryInspector';
import { RemediationTerminal } from './components/RemediationTerminal';
import { IncidentResolutionModal } from './components/IncidentResolutionModal';
import { SimulationModal } from './components/SimulationModal';
import { NewAlertModal } from './components/NewAlertModal';
import { ShieldCheck, CheckCircle, Brain } from 'lucide-react';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentIncident, setCurrentIncident] = useState<Incident | null>(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Modals
  const [isResolutionOpen, setIsResolutionOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isNewAlertOpen, setIsNewAlertOpen] = useState(false);

  // Load data
  const loadData = useCallback(async (selectFirstIfNone = false) => {
    try {
      setLoading(true);
      const [hData, mData, iData] = await Promise.all([
        fetchHealth().catch(() => null),
        fetchMetrics().catch(() => null),
        fetchIncidents(statusFilter, severityFilter).catch(() => [])
      ]);

      if (hData) setHealth(hData);
      if (mData) setMetrics(mData);
      setIncidents(iData);

      if (selectFirstIfNone && iData.length > 0 && !selectedId) {
        setSelectedId(iData[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, selectedId]);

  // Load selected incident details
  const loadSelectedIncident = useCallback(async (id: string) => {
    try {
      const inc = await fetchIncidentById(id);
      setCurrentIncident(inc);
    } catch (err) {
      console.error('Failed to load incident', err);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    if (selectedId) {
      loadSelectedIncident(selectedId);
    }
  }, [selectedId, loadSelectedIncident]);

  // Handle remediation approval
  const handleApproveAction = async (actionId: number, approved: boolean) => {
    if (!selectedId) return;
    try {
      setApprovingId(actionId);
      await approveRemediationAction(selectedId, actionId, approved);
      await loadSelectedIncident(selectedId);
      await loadData();
    } catch (err) {
      console.error('Failed to approve action', err);
    } finally {
      setApprovingId(null);
    }
  };

  // Handle resolution
  const handleResolve = async (rootCause: string, resolution: string, lessons: string) => {
    if (!selectedId) return;
    try {
      setResolving(true);
      await resolveIncident(selectedId, rootCause, resolution, lessons);
      setIsResolutionOpen(false);
      await loadSelectedIncident(selectedId);
      await loadData();
    } catch (err) {
      console.error('Failed to resolve incident', err);
    } finally {
      setResolving(false);
    }
  };

  // Handle new alert ingest
  const handleNewAlert = async (data: {
    source: string;
    service: string;
    alert_name: string;
    severity: Severity;
    message: string;
    raw_logs?: string;
  }) => {
    try {
      setLoading(true);
      const inc = await ingestAlert(data);
      setIsNewAlertOpen(false);
      await loadData();
      setSelectedId(inc.id);
    } catch (err) {
      console.error('Failed to ingest alert', err);
    } finally {
      setLoading(false);
    }
  };

  // Run Scenario 1 (Cold Start)
  const handleRunScenario1 = async () => {
    try {
      setSimulating(true);
      const inc = await ingestAlert({
        source: 'Kubernetes-Alertmanager',
        service: 'payment-service',
        alert_name: 'PodEvicted_MemoryStarvation',
        severity: 'P1',
        message: 'PaymentService pods undergoing OOMKilled evictions in prod-eu-west-1. Error rate 14.8%.',
        raw_logs: 'FATAL 2026-11-05T10:14:02Z [payment-service-78f99] OutOfMemoryError: Java heap space. Redis connection thread dump: 250 threads blocked.'
      });
      setIsSimulationOpen(false);
      await loadData();
      setSelectedId(inc.id);
    } catch (err) {
      console.error('Failed to run Scenario 1', err);
    } finally {
      setSimulating(false);
    }
  };

  // Run Scenario 2 (Recalled Case)
  const handleRunScenario2 = async () => {
    try {
      setSimulating(true);
      const inc = await ingestAlert({
        source: 'Datadog-APM',
        service: 'payment-service',
        alert_name: 'LatencySpikeAndMemoryAlarm',
        severity: 'P1',
        message: 'PaymentService latency spiked past 4200ms with Redis connection backlog. Highly similar to prior memory exhaustion.',
        raw_logs: 'WARN 2026-11-05T11:02:11Z [payment-service-82c11] ConnectionTimeout: Redis cluster read timeout. Eviction buffer 98%.'
      });
      setIsSimulationOpen(false);
      await loadData();
      setSelectedId(inc.id);
    } catch (err) {
      console.error('Failed to run Scenario 2', err);
    } finally {
      setSimulating(false);
    }
  };

  // Run Scenario 3 (Auth Service Canary Drift)
  const handleRunScenario3 = async () => {
    try {
      setSimulating(true);
      const inc = await ingestAlert({
        source: 'Prometheus-Alertmanager',
        service: 'auth-service',
        alert_name: 'CanaryLatencyAndTokenSpike',
        severity: 'P2',
        message: 'AuthService canary deployment v2.1.0 showing elevated JWT validation latency and session cache latency.',
        raw_logs: 'WARN 2026-11-05T12:45:00Z [auth-service-canary] TokenValidationException: public key cache miss, latency 1200ms.'
      });
      setIsSimulationOpen(false);
      await loadData();
      setSelectedId(inc.id);
    } catch (err) {
      console.error('Failed to run Scenario 3', err);
    } finally {
      setSimulating(false);
    }
  };

  // Run Scenario 4 (OrdersDB Pool Saturation)
  const handleRunScenario4 = async () => {
    try {
      setSimulating(true);
      const inc = await ingestAlert({
        source: 'Datadog-APM',
        service: 'orders-db',
        alert_name: 'ConnectionPoolExhaustionAndLockWait',
        severity: 'P1',
        message: 'Orders database connection pool saturated at 100% capacity. Deadlock detected on transaction table.',
        raw_logs: 'FATAL 2026-11-05T13:10:00Z [orders-db-pool] ConnectionPoolTimeout: 0 available connections. 80 threads waiting on row lock.'
      });
      setIsSimulationOpen(false);
      await loadData();
      setSelectedId(inc.id);
    } catch (err) {
      console.error('Failed to run Scenario 4', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-sre-dark flex flex-col font-sans">
      <Header
        health={health}
        onRefresh={() => loadData(false)}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onOpenNewAlert={() => setIsNewAlertOpen(true)}
        loading={loading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <DashboardStats metrics={metrics} />

        {/* Master 2-Column Incident Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Incident Feed (4 cols) */}
          <div className="lg:col-span-4">
            <IncidentList
              incidents={incidents}
              selectedId={selectedId}
              onSelectIncident={(id) => setSelectedId(id)}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              severityFilter={severityFilter}
              onSeverityFilterChange={setSeverityFilter}
            />
          </div>

          {/* Right Column: Live Incident Investigation & Hindsight Cockpit (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {currentIncident ? (
              <div className="bg-sre-card rounded-xl border border-sre-border p-5 shadow-sm space-y-5">
                {/* Active Incident Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sre-border pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                        {currentIncident.id}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {currentIncident.service}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                        currentIncident.severity === 'P1'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {currentIncident.severity}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-white mt-2 tracking-tight">
                      {currentIncident.title}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentIncident.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => setIsResolutionOpen(true)}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Mark as Resolved</span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Resolved & Retained in Hindsight</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-grid: Investigation Steps vs Memory Inspector */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* Investigation Transcript (7 cols) */}
                  <div className="md:col-span-7 space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>Autonomous Investigation Transcript</span>
                    </h3>

                    <InvestigationTimeline
                      steps={currentIncident.investigation_steps || []}
                      confirmedRootCause={currentIncident.confirmed_root_cause}
                      suspectedRootCause={currentIncident.suspected_root_cause}
                    />
                  </div>

                  {/* Hindsight Memory Inspector & Guarded Runbook (5 cols) */}
                  <div className="md:col-span-5 space-y-4">
                    <MemoryInspector incident={currentIncident} />

                    <RemediationTerminal
                      actions={currentIncident.remediation_actions || []}
                      onApproveAction={handleApproveAction}
                      approvingId={approvingId}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-sre-card rounded-xl border border-sre-border p-12 text-center flex flex-col items-center justify-center text-slate-400 h-[740px]">
                <Brain className="h-12 w-12 text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-slate-200">No Incident Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Select an incident from the feed or trigger a benchmark scenario to observe Hindsight persistent memory in action.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <IncidentResolutionModal
        isOpen={isResolutionOpen}
        onClose={() => setIsResolutionOpen(false)}
        onSubmit={handleResolve}
        defaultRootCause={currentIncident?.suspected_root_cause || ''}
        submitting={resolving}
      />

      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onRunScenario1={handleRunScenario1}
        onRunScenario2={handleRunScenario2}
        onRunScenario3={handleRunScenario3}
        onRunScenario4={handleRunScenario4}
        loading={simulating}
      />

      <NewAlertModal
        isOpen={isNewAlertOpen}
        onClose={() => setIsNewAlertOpen(false)}
        onSubmit={handleNewAlert}
        submitting={loading}
      />
    </div>
  );
};
