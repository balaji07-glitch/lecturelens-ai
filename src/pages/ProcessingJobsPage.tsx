import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { fetchJobs, retryJob } from '../services/api.ts';
import type { ProcessingJob } from '../types/index.ts';

export const ProcessingJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await fetchJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (id: string) => {
    try {
      setRetryingId(id);
      await retryJob(id);
      await loadJobs();
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 bg-ambient-glow">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">Multimodal Pipeline Jobs</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time status of audio transcription, visual OCR, concept extraction, and alignment workers.
          </p>
        </div>

        <button
          onClick={loadJobs}
          className="p-2 glass-button-secondary rounded-xl text-xs font-semibold flex items-center gap-1.5"
          title="Refresh Jobs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs">Fetching worker tasks...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel p-10 text-center text-slate-400 space-y-2">
          <Layers className="h-8 w-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-white">No active or historical processing jobs</p>
          <p className="text-xs text-slate-500">
            Jobs are created automatically when audio or slide files are ingested into a lecture workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isCompleted = job.status === 'completed';
            const isFailed = job.status === 'failed';
            const isRunning = job.status === 'running';

            return (
              <div
                key={job.id}
                className="glass-card-elevated p-4 sm:p-5 border border-white/[0.08] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-400'
                            : isFailed
                            ? 'bg-rose-400'
                            : 'bg-violet-400 animate-pulse'
                        }`}
                      />
                      <span className="text-xs font-mono font-semibold uppercase text-violet-300">
                        Stage: {job.stage.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs text-slate-300 font-medium">
                        {job.filename || 'Ingestion Task'}
                      </span>
                    </div>

                    {job.lesson_title && (
                      <p className="text-xs text-slate-400">In: {job.lesson_title}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono px-2.5 py-0.5 rounded-full uppercase font-medium ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isFailed
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      }`}
                    >
                      {job.status}
                    </span>

                    {isFailed && (
                      <button
                        onClick={() => handleRetry(job.id)}
                        disabled={retryingId === job.id}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40"
                      >
                        {retryingId === job.id ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted
                        ? 'bg-emerald-400'
                        : isFailed
                        ? 'bg-rose-400'
                        : 'bg-gradient-to-r from-violet-500 to-cyan-400'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>

                {job.error_message && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{job.error_message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                  <span>Started: {new Date(job.started_at).toLocaleTimeString()}</span>
                  {job.completed_at && (
                    <span>Finished: {new Date(job.completed_at).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
