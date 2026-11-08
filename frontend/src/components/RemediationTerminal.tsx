import React from 'react';
import { Terminal, Shield, Check, X, AlertTriangle } from 'lucide-react';
import { RemediationAction, RiskLevel } from '../types';

interface RemediationTerminalProps {
  actions: RemediationAction[];
  onApproveAction: (actionId: number, approved: boolean) => void;
  approvingId: number | null;
}

const riskStyles: Record<RiskLevel, { badge: string; text: string }> = {
  SAFE: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    text: 'Safe to execute automatically'
  },
  CAUTION: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    text: 'May cause transient request drops'
  },
  HIGH: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    text: 'Destructive change - strict approval required'
  }
};

export const RemediationTerminal: React.FC<RemediationTerminalProps> = ({
  actions,
  onApproveAction,
  approvingId
}) => {
  return (
    <div className="bg-sre-card rounded-xl border border-sre-border p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sre-border pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Guarded Remediation Terminal (Human-in-the-Loop)
          </h3>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Shield className="h-3 w-3" />
          <span>Operator Approval Required</span>
        </div>
      </div>

      {/* Action Items */}
      {actions.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs">
          No automated runbook actions generated yet. Investigation is in progress.
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((act) => {
            const risk = riskStyles[act.risk_level] || riskStyles.SAFE;
            const isPending = act.status === 'PENDING';
            const isExecuting = approvingId === act.id;

            return (
              <div
                key={act.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5"
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${risk.badge}`}
                    >
                      {act.risk_level}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {act.description}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      act.status === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : act.status === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>

                {/* Command Block */}
                <div className="p-2.5 rounded-lg bg-black/80 border border-slate-800 font-mono text-xs text-sky-400 flex items-center justify-between">
                  <code>{act.command}</code>
                  <span className="text-[10px] text-slate-600 font-sans">Dry-run Verified</span>
                </div>

                {/* Action Feedback / Terminal Output */}
                {act.output && (
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400">
                    <span className="text-slate-500 text-[10px] block mb-0.5">Execution Log:</span>
                    {act.output}
                  </div>
                )}

                {/* Human Approval Controls */}
                {isPending && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      <span>{risk.text}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onApproveAction(act.id, false)}
                        disabled={isExecuting}
                        className="flex items-center space-x-1 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5 text-rose-400" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => onApproveAction(act.id, true)}
                        disabled={isExecuting}
                        className="flex items-center space-x-1 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                      >
                        {isExecuting ? (
                          <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Approve & Apply</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
