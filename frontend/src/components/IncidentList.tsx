import React from 'react';
import { AlertCircle, Brain, CheckCircle2, ChevronRight, Filter } from 'lucide-react';
import { IncidentSummary, IncidentStatus, Severity } from '../types';

interface IncidentListProps {
  incidents: IncidentSummary[];
  selectedId: string | null;
  onSelectIncident: (id: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  severityFilter: string;
  onSeverityFilterChange: (severity: string) => void;
}

const severityBadgeStyles: Record<Severity, string> = {
  P1: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  P2: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  P3: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  P4: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
};

const statusBadgeStyles: Record<IncidentStatus, string> = {
  TRIGGERED: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse-subtle',
  INVESTIGATING: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  MITIGATING: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  RESOLVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
};

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedId,
  onSelectIncident,
  statusFilter,
  onStatusFilterChange,
  severityFilter,
  onSeverityFilterChange
}) => {
  return (
    <div className="bg-sre-card rounded-xl border border-sre-border flex flex-col h-[740px] shadow-sm">
      {/* Header & Filter Bar */}
      <div className="p-4 border-b border-sre-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">Incident Feed</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {incidents.length}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
          {['ALL', 'TRIGGERED', 'INVESTIGATING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Severity Filters */}
        <div className="flex items-center space-x-1 mt-2 text-xs">
          {['ALL', 'P1', 'P2', 'P3'].map((sev) => (
            <button
              key={sev}
              onClick={() => onSeverityFilterChange(sev)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                severityFilter === sev
                  ? 'bg-slate-700 text-white border border-slate-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-slate-400">
            <CheckCircle2 className="h-8 w-8 text-emerald-400/80 mb-2" />
            <p className="text-sm font-medium text-slate-300">All Systems Nominal</p>
            <p className="text-xs text-slate-500 mt-1">No active incidents matching the current filters.</p>
          </div>
        ) : (
          incidents.map((inc) => {
            const isSelected = inc.id === selectedId;
            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className={`p-3.5 cursor-pointer transition-all hover:bg-slate-800/50 ${
                  isSelected ? 'bg-slate-800/90 border-l-4 border-sky-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        severityBadgeStyles[inc.severity] || severityBadgeStyles.P3
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      {inc.id}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      statusBadgeStyles[inc.status] || statusBadgeStyles.TRIGGERED
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-slate-100 mt-1.5 line-clamp-1">
                  {inc.title}
                </h3>

                <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-400">
                  <span className="font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                    {inc.service}
                  </span>

                  {inc.recalled_from_incident_id && (
                    <div className="flex items-center space-x-1 text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20" title={`Recalled from ${inc.recalled_from_incident_id}`}>
                      <Brain className="h-3 w-3" />
                      <span className="text-[10px] font-medium">Memory Hit</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1">
                    <span>{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <ChevronRight className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isSelected ? 'translate-x-0.5 text-sky-400' : ''}`} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

