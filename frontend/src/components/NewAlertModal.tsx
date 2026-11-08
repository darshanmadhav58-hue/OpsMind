import React, { useState } from 'react';
import { X, PlusCircle, AlertTriangle } from 'lucide-react';
import { Severity } from '../types';

interface NewAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    source: string;
    service: string;
    alert_name: string;
    severity: Severity;
    message: string;
    raw_logs?: string;
  }) => void;
  submitting: boolean;
}

export const NewAlertModal: React.FC<NewAlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitting
}) => {
  const [service, setService] = useState('payment-service');
  const [alertName, setAlertName] = useState('HighErrorRate5xx');
  const [severity, setSeverity] = useState<Severity>('P2');
  const [message, setMessage] = useState('Elevated 5xx response rate on endpoint /v1/checkout/charge');
  const [rawLogs, setRawLogs] = useState('ERROR 2026-11-05 11:20:04 [Worker-4] TimeoutException: Connection pool exhausted. Waiting threads: 142');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!service.trim() || !alertName.trim() || !message.trim()) return;
    onSubmit({
      source: 'Alertmanager-Webhook',
      service,
      alert_name: alertName,
      severity,
      message,
      raw_logs: rawLogs
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-sre-card border border-sre-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-sre-border flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Ingest Telemetry Alert
              </h3>
              <p className="text-xs text-slate-400">
                Simulate a live webhook alert from Prometheus, Datadog, or PagerDuty.
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

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Service
              </label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="e.g. payment-service"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-sky-500"
              >
                <option value="P1">P1 - Critical Outage</option>
                <option value="P2">P2 - High Degradation</option>
                <option value="P3">P3 - Moderate Impairment</option>
                <option value="P4">P4 - Low / Informational</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alert Name
            </label>
            <input
              type="text"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder="e.g. HighErrorRate5xx"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Error Message
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. HTTP 504 Gateway Timeout elevated on /checkout"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Raw Server Logs (Optional)
            </label>
            <textarea
              rows={3}
              value={rawLogs}
              onChange={(e) => setRawLogs(e.target.value)}
              placeholder="Paste relevant trace or stack trace..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:outline-none focus:border-sky-500"
            />
          </div>

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
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              <span>Ingest & Trigger Investigation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

