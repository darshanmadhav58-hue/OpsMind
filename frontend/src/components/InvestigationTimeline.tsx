import React from 'react';
import {
  Search,
  Brain,
  Sparkles,
  Terminal,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { InvestigationStep, StepType } from '../types';

interface InvestigationTimelineProps {
  steps: InvestigationStep[];
  confirmedRootCause?: string;
  suspectedRootCause?: string;
}

const stepConfig: Record<StepType, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  TRIAGE: {
    icon: Search,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Automated Triage & Telemetry Classification'
  },
  RECALL: {
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    label: 'Hindsight Memory Retrieval (Hybrid 4-Way Search)'
  },
  REFLECT: {
    icon: Sparkles,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    label: 'Causal Inference & Hypothesis Reflection'
  },
  HYPOTHESIS: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    label: 'Differential Root Cause Analysis'
  },
  RUNBOOK: {
    icon: Terminal,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Guarded Remediation Plan Synthesis'
  }
};

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({
  steps,
  confirmedRootCause,
  suspectedRootCause
}) => {
  return (
    <div className="space-y-4">
      {/* Root Cause Card if identified */}
      {(confirmedRootCause || suspectedRootCause) && (
        <div className={`p-4 rounded-xl border ${confirmedRootCause ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900 border-sky-500/30'} shadow-md`}>
          <div className="flex items-center space-x-2 mb-2">
            <ShieldCheck className={`h-4 w-4 ${confirmedRootCause ? 'text-emerald-400' : 'text-sky-400'}`} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {confirmedRootCause ? 'Confirmed Root Cause (Verified)' : 'Suspected Root Cause (Hindsight Inferred)'}
            </h4>
          </div>
          <p className="text-sm font-medium text-slate-100 leading-relaxed">
            {confirmedRootCause || suspectedRootCause}
          </p>
        </div>
      )}

      {/* Investigation Steps Timeline */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {steps.map((step, idx) => {
          const cfg = stepConfig[step.step_type] || stepConfig.TRIAGE;
          const Icon = cfg.icon;

          return (
            <div key={idx} className="relative group">
              {/* Timeline Pin Icon */}
              <div
                className={`absolute -left-6 top-1 h-5 w-5 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center`}
              >
                <Icon className={`h-3 w-3 ${cfg.color}`} />
              </div>

              {/* Card Container */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {step.step_type}
                    </span>
                    <h5 className="text-xs font-semibold text-slate-200 tracking-tight">
                      {step.title}
                    </h5>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed mt-2 font-sans">
                  {step.description}
                </p>

                {step.evidence && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-black/60 border border-slate-800/80 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Evidence / Telemetry Artifact:
                    </span>
                    <code>{step.evidence}</code>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

