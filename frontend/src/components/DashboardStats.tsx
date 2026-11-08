import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Zap, Activity, Brain } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface DashboardStatsProps {
  metrics: DashboardMetrics | null;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Incidents',
      value: metrics?.total_incidents ?? 0,
      icon: Activity,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      sub: 'All recorded outages'
    },
    {
      title: 'Active Incidents',
      value: metrics?.active_incidents ?? 0,
      icon: AlertTriangle,
      color: (metrics?.critical_incidents ?? 0) > 0 ? 'text-rose-400' : 'text-amber-400',
      bg: (metrics?.critical_incidents ?? 0) > 0 ? 'bg-rose-500/10' : 'bg-amber-500/10',
      border: (metrics?.critical_incidents ?? 0) > 0 ? 'border-rose-500/30' : 'border-amber-500/20',
      sub: `${metrics?.critical_incidents ?? 0} Critical (P1)`
    },
    {
      title: 'Resolved Incidents',
      value: metrics?.resolved_incidents ?? 0,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      sub: 'Retained in memory'
    },
    {
      title: 'Avg MTTR',
      value: `${metrics?.average_mttr_minutes ?? 0}m`,
      icon: Clock,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      sub: 'Mean Time to Resolution'
    },
    {
      title: 'Hindsight Recalls',
      value: metrics?.total_memory_recalls ?? 0,
      icon: Brain,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      sub: 'Instant context match'
    },
    {
      title: 'Memory Efficacy',
      value: metrics && metrics.total_incidents > 0 
        ? `${Math.round(((metrics.total_memory_recalls || 1) / Math.max(metrics.total_incidents, 1)) * 100)}%`
        : '100%',
      icon: Zap,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      sub: 'Zero cold-start recurrence'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-3.5 rounded-xl bg-sre-card border ${c.border} flex flex-col justify-between shadow-sm hover:border-slate-600 transition-all`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bg} ${c.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                {c.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                {c.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

