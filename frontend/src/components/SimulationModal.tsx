import React from 'react';
import { X, Play, Brain, Sparkles, CheckCircle2, History, ShieldAlert, Database } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunScenario1: () => void;
  onRunScenario2: () => void;
  onRunScenario3?: () => void;
  onRunScenario4?: () => void;
  loading: boolean;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onRunScenario1,
  onRunScenario2,
  onRunScenario3,
  onRunScenario4,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-sre-card border border-sre-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-sre-border flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Hindsight Memory Benchmark Scenarios
              </h3>
              <p className="text-xs text-slate-400">
                4 Deterministic SRE scenarios proving persistent memory, topology grounding, and runbook recall.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Scenario 1 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    STAGE 1: COLD START
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    Novel Incident: PaymentService Memory Crash
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  First-time occurrence. A high-memory alarm triggers on <code>payment-service</code>. 
                  OpsMind checks Hindsight, confirms zero prior precedent, and performs an exploratory investigation. 
                  Resolving this incident retains the post-mortem into Hindsight persistent memory.
                </p>
              </div>

              <button
                onClick={onRunScenario1}
                disabled={loading}
                className="shrink-0 ml-4 flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Run Scenario 1</span>
              </button>
            </div>

            <div className="mt-2.5 flex items-center space-x-4 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <Brain className="h-3 w-3 text-slate-500" />
                <span>Memory Recalls: 0 (Cold)</span>
              </span>
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Retains resolution into Hindsight</span>
              </span>
            </div>
          </div>

          {/* Scenario 2 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 hover:border-purple-500/50 transition-all bg-gradient-to-r from-purple-950/20 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    STAGE 2: HINDSIGHT ADVANTAGE
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    Recurrent Outage: Latency Spike & Memory Alarm
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Occurs weeks later. OpsMind queries Hindsight via 4-way hybrid search, 
                  instantly recalls Stage 1 incident, explains why symptoms match, highlights the verified fix 
                  (<code>volatile-lru</code> eviction policy), and drafts the validated runbook in seconds.
                </p>
              </div>

              <button
                onClick={onRunScenario2}
                disabled={loading}
                className="shrink-0 ml-4 flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                <History className="h-3.5 w-3.5" />
                <span>Run Scenario 2</span>
              </button>
            </div>

            <div className="mt-2.5 flex items-center space-x-4 text-[11px] text-purple-300 font-mono">
              <span className="flex items-center space-x-1 font-bold">
                <Brain className="h-3 w-3 text-purple-400" />
                <span>Instant Memory Recall (&gt;50% Match)</span>
              </span>
              <span>Proven Remediation Ready</span>
            </div>
          </div>

          {/* Scenario 3 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    STAGE 3: TOPOLOGY ISOLATION
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    Canary Drift: AuthService Token Validation Spikes
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Canary deployment on <code>auth-service</code> exhibits JWT token verification latency. OpsMind queries 
                  the <code>opsmind-services</code> bank, references auth architecture, and avoids false correlation with payment cache leaks.
                </p>
              </div>

              {onRunScenario3 && (
                <button
                  onClick={onRunScenario3}
                  disabled={loading}
                  className="shrink-0 ml-4 flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Run Scenario 3</span>
                </button>
              )}
            </div>

            <div className="mt-2.5 flex items-center space-x-4 text-[11px] text-sky-300 font-mono">
              <span className="flex items-center space-x-1">
                <ShieldAlert className="h-3 w-3 text-sky-400" />
                <span>Service Topology Grounding</span>
              </span>
              <span>Prevents Cross-Service Memory Hallucination</span>
            </div>
          </div>

          {/* Scenario 4 */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    STAGE 4: RUNBOOK RECALL
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    Database Saturation: OrdersDB Pool Contention
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Database connection pool exhaustion on <code>orders-db</code>. OpsMind searches the 
                  <code>opsmind-runbooks</code> bank, retrieves institutional connection handling playbooks, and stages non-destructive diagnostics.
                </p>
              </div>

              {onRunScenario4 && (
                <button
                  onClick={onRunScenario4}
                  disabled={loading}
                  className="shrink-0 ml-4 flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>Run Scenario 4</span>
                </button>
              )}
            </div>

            <div className="mt-2.5 flex items-center space-x-4 text-[11px] text-emerald-300 font-mono">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Institutional Runbook Bank Retrieval</span>
              </span>
              <span>Guarded Execution Protocol</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-sre-border bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Powered by Vectorize Hindsight Persistent Cognitive Memory</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
};
