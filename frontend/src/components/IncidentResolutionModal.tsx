import React, { useState } from 'react';
import { X, CheckCircle, Brain, BookOpen } from 'lucide-react';

interface IncidentResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (confirmedRootCause: string, resolutionSummary: string, lessonsLearned: string) => void;
  defaultRootCause?: string;
  submitting: boolean;
}

export const IncidentResolutionModal: React.FC<IncidentResolutionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultRootCause = '',
  submitting
}) => {
  const [rootCause, setRootCause] = useState(defaultRootCause);
  const [resolution, setResolution] = useState('');
  const [lessons, setLessons] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCause.trim() || !resolution.trim()) return;
    onSubmit(rootCause, resolution, lessons);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-sre-card border border-sre-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-sre-border flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Resolve Incident & Retain in Memory
              </h3>
              <p className="text-xs text-slate-400">
                Confirmed findings will be learned by Hindsight for future incidents.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Confirmed Root Cause *
            </label>
            <textarea
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. Unbounded Redis cache eviction bug in v2.4.1 caused memory starvation."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Resolution Summary *
            </label>
            <textarea
              rows={2}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="e.g. Updated Redis maxmemory-policy to volatile-lru and expanded cluster size."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="h-3.5 w-3.5 text-purple-400" />
              <span>Lessons Learned & Directives (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="e.g. Add alert threshold on Redis evicted_keys metric. Disallow noeviction in production configs."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-sky-500 font-sans"
            />
          </div>

          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/20 text-xs text-purple-300 flex items-start space-x-2">
            <Brain className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Hindsight Retain:</strong> This submission directly updates the <code>opsmind-incidents</code> bank and refreshes the service mental model so similar alerts are resolved autonomously.
            </p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-sre-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Brain className="h-3.5 w-3.5" />
              )}
              <span>Retain & Resolve</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

