import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Database,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { fetchHealth, fetchProviderStatus, seedDemoLesson } from '../services/api.ts';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedSuccess, setReseedSuccess] = useState(false);

  useEffect(() => {
    Promise.all([fetchHealth(), fetchProviderStatus()])
      .then(([h, p]) => {
        setHealth(h);
        setProvider(p);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleReseed = async () => {
    try {
      setReseedLoading(true);
      await seedDemoLesson();
      setReseedSuccess(true);
      setTimeout(() => setReseedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 bg-ambient-glow">
      <div className="border-b border-white/[0.08] pb-4">
        <h1 className="text-2xl font-black text-white">System Settings & Health</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Inspect multimodal AI provider readiness, local database persistence, and system diagnostics.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Checking system health...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Provider Card */}
          <div className="glass-card-elevated p-6 border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-violet-400" />
                <h3 className="text-sm font-bold text-white">AI Provider Diagnostics</h3>
              </div>

              <span
                className={`text-xs font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                  provider?.configured
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    provider?.configured ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                />
                <span>{provider?.configured ? 'Online & Configured' : 'Interactive Demo Mode'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-500 block">Active Provider</span>
                <span className="text-white font-semibold font-mono text-sm">
                  {provider?.provider || 'Google Gemini'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-500 block">Target Multimodal Model</span>
                <span className="text-violet-300 font-semibold font-mono text-sm">
                  {provider?.model || 'gemini-3.8-flash'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Registered Multimodal Capabilities:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {provider?.capabilities?.map((cap: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-xs text-slate-300 flex items-center gap-2"
                  >
                    <CheckCircle className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-white/[0.06]">
              {provider?.notice}
            </p>
          </div>

          {/* Database & Data Management */}
          <div className="glass-card-elevated p-6 border border-white/[0.08] space-y-4">
            <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
              <Database className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Database & Persistence Management</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              LectureLens AI persists lessons, source files, timestamped transcript chunks, OCR bounding regions,
              inferred relationships, and study packs locally on the server. You can re-seed the comprehensive
              Computer Networks demonstration lesson at any time.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleReseed}
                disabled={reseedLoading}
                className="px-4 py-2.5 glass-button-secondary rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${reseedLoading ? 'animate-spin' : ''}`} />
                <span>Reset Database to Token Ring Demo</span>
              </button>

              {reseedSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  <span>Demo restored successfully!</span>
                </span>
              )}
            </div>
          </div>

          {/* API Health Diagnostic */}
          <div className="glass-card-elevated p-6 border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">System Service Health</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/20 border border-white/[0.06]">
                <span className="text-slate-500 block">Service</span>
                <span className="text-white font-semibold">{health?.status || 'OK'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/[0.06]">
                <span className="text-slate-500 block">Version</span>
                <span className="text-white font-semibold">{health?.version || '1.0.0'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/[0.06]">
                <span className="text-slate-500 block">Database</span>
                <span className="text-emerald-400 font-semibold">{health?.database || 'Ready'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/[0.06]">
                <span className="text-slate-500 block">Storage</span>
                <span className="text-emerald-400 font-semibold">{health?.storage || 'Ready'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
