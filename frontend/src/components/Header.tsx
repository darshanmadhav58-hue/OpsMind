import React from 'react';
import { ShieldAlert, BrainCircuit, RefreshCw, Play, PlusCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  onRefresh: () => void;
  onOpenSimulation: () => void;
  onOpenNewAlert: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onRefresh,
  onOpenSimulation,
  onOpenNewAlert,
  loading
}) => {
  const isGeminiActive = health?.ai_engine?.gemini_configured ?? false;

  return (
    <header className="bg-sre-card/80 border-b border-sre-border/70 backdrop-blur sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/30">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">OpsMind</h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-500/10 text-sky-400 rounded-md border border-sky-500/20">
                SRE AI Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Persistent Memory Incident Response Engine
            </p>
          </div>
        </div>

        {/* System & Memory Badges */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Hindsight Status Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs">
            <BrainCircuit className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Hindsight Memory:</span>
            <span className="font-mono font-medium text-emerald-400">
              {health?.hindsight?.hindsight_sdk_active ? 'SDK Connected' : 'Persistent (Disk Synced)'}
            </span>
          </div>

          {/* AI Engine Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300">
            <Sparkles className={`h-3.5 w-3.5 ${isGeminiActive ? 'text-amber-400' : 'text-sky-400'}`} />
            <span>AI:</span>
            <span className="font-mono font-medium text-slate-200">
              {isGeminiActive ? 'Gemini 2.5 Flash' : 'SRE Causal Engine'}
            </span>
          </div>

          {/* Database Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>SQLite SRE Store</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenSimulation}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all border border-indigo-400/30"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Run Benchmark Demo</span>
          </button>

          <button
            onClick={onOpenNewAlert}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all border border-sky-400/20"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Ingest Alert</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Incidents"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
