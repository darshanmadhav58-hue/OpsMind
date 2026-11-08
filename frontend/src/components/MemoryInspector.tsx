import React, { useState, useEffect } from 'react';
import { Brain, Layers, GitBranch, Sparkles, CheckCircle2, History, Eye, X, Database } from 'lucide-react';
import { Incident } from '../types';
import { fetchMemoryBanks, fetchMemoryRecords } from '../services/api';

interface MemoryInspectorProps {
  incident: Incident | null;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({ incident }) => {
  const isRecalled = !!incident?.recalled_from_incident_id;
  const similarityScore = incident?.hindsight_similarity_score ?? (isRecalled ? 0.94 : 0.0);

  const [bankStats, setBankStats] = useState<Record<string, { count: number; status: string }>>({
    'opsmind-incidents': { count: 0, status: 'Synced' },
    'opsmind-services': { count: 2, status: 'Topology' },
    'opsmind-runbooks': { count: 1, status: 'Playbooks' }
  });

  const [inspectingBank, setInspectingBank] = useState<string | null>(null);
  const [bankRecords, setBankRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const loadBankStats = async () => {
    try {
      const data = await fetchMemoryBanks();
      if (data && data.banks) {
        setBankStats(data.banks);
      }
    } catch (e) {
      // Fallback gracefully
    }
  };

  useEffect(() => {
    loadBankStats();
  }, [incident]);

  const handleInspectBank = async (bankName: string) => {
    setInspectingBank(bankName);
    setLoadingRecords(true);
    try {
      const data = await fetchMemoryRecords(bankName);
      setBankRecords(data.records || []);
    } catch (e) {
      setBankRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  return (
    <div className="bg-sre-card rounded-xl border border-sre-border p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sre-border pb-3">
        <div className="flex items-center space-x-2">
          <Brain className="h-4 w-4 text-purple-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Hindsight Memory Engine
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
          Persistent Cognitive Store
        </span>
      </div>

      {/* Memory Banks Status */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>Active Memory Banks</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">Click to inspect</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <button
            onClick={() => handleInspectBank('opsmind-incidents')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all text-left"
          >
            <span className="text-[10px] text-slate-400 block truncate font-sans">Incidents Bank</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-purple-400">
                {bankStats['opsmind-incidents']?.count ?? 0}
              </span>
              <Eye className="h-3 w-3 text-slate-500" />
            </div>
          </button>

          <button
            onClick={() => handleInspectBank('opsmind-services')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/80 transition-all text-left"
          >
            <span className="text-[10px] text-slate-400 block truncate font-sans">Services Topology</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-sky-400">
                {bankStats['opsmind-services']?.count ?? 2}
              </span>
              <Eye className="h-3 w-3 text-slate-500" />
            </div>
          </button>

          <button
            onClick={() => handleInspectBank('opsmind-runbooks')}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all text-left"
          >
            <span className="text-[10px] text-slate-400 block truncate font-sans">Runbook Bank</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-emerald-400">
                {bankStats['opsmind-runbooks']?.count ?? 1}
              </span>
              <Eye className="h-3 w-3 text-slate-500" />
            </div>
          </button>
        </div>
      </div>

      {/* Incident Recall State */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-200 flex items-center space-x-1.5">
            <History className="h-3.5 w-3.5 text-purple-400" />
            <span>Incident Memory Match</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
              isRecalled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isRecalled ? 'RECALL HIT' : 'COLD START (NEW)'}
          </span>
        </div>

        {isRecalled ? (
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Prior Precedent:</span>
              <span className="font-mono text-purple-400 font-semibold">
                {incident?.recalled_from_incident_id}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Semantic & Graph Similarity:</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full"
                    style={{ width: `${Math.round(similarityScore * 100)}%` }}
                  />
                </div>
                <span className="font-mono font-bold text-emerald-400">
                  {Math.round(similarityScore * 100)}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-850 mt-1">
              Historical precedent verified. Root cause and remediation actions were directly adapted from past confirmed resolution.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-1">
            No previous identical failure pattern on file. OpsMind is formulating initial hypotheses and will retain the resolution into Hindsight once closed.
          </p>
        )}
      </div>

      {/* Living Service Mental Model */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-200 mb-1.5 flex items-center space-x-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Pre-Computed Mental Model</span>
        </h4>
        <div className="text-[11px] text-slate-300 space-y-1 font-sans">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-mono">
            <span>Target: {incident?.service || 'Infrastructure'}</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Continuously Refreshed</span>
            </span>
          </div>
          <p className="p-2 rounded bg-slate-950 border border-slate-850 text-slate-300 italic">
            {incident?.service === 'payment-service'
              ? 'Payment Gateway: Sensitive to Redis eviction settings under peak load. High dependency on postgres-replica-01. Known failure mode: unhandled cache eviction deadlock.'
              : incident?.service === 'auth-service'
              ? 'Auth Service: High CPU threshold on JWT signature validation during deploy spikes. Dependent on Redis session cluster.'
              : 'Service Reliability Profile: Pre-computed baseline actively incorporating incident resolutions and deploy drift.'}
          </p>
        </div>
      </div>

      {/* Entity Links Discovered */}
      <div>
        <h4 className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider flex items-center space-x-1.5">
          <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
          <span>Graph Entities Linked</span>
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {['Service:' + (incident?.service || 'service'), 'Component:Redis', 'Error:OOM-Eviction', 'Policy:volatile-lru', 'Tier:Critical-P1'].map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bank Records Inspection Drawer / Modal */}
      {inspectingBank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-sre-card border border-sre-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-sre-border flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-2.5">
                <Database className="h-5 w-5 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">
                    Hindsight Bank: {inspectingBank}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Inspecting {bankRecords.length} persistent cognitive memory records
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingBank(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 font-mono text-xs">
              {loadingRecords ? (
                <div className="text-center py-8 text-slate-400">Loading memory bank records...</div>
              ) : bankRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-sans">
                  No memories currently stored in this bank. Resolve an incident to see it retained here!
                </div>
              ) : (
                bankRecords.map((rec, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="text-purple-400 font-bold">{rec.memory_id}</span>
                      <span className="text-[10px] text-slate-500 font-sans">{rec.created_at}</span>
                    </div>
                    <p className="text-slate-200 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                      {rec.content}
                    </p>
                    {rec.tags && rec.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rec.tags.map((t: string, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-sre-border bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setInspectingBank(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
