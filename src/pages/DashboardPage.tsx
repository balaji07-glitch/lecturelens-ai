import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Mic,
  Image as ImageIcon,
  Sparkles,
  Clock,
  ArrowRight,
  Trash2,
  RefreshCw,
  Layers,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { fetchLessons, deleteLesson, seedDemoLesson } from '../services/api.ts';
import { LearningAnalyticsWidget } from '../components/dashboard/LearningAnalyticsWidget.tsx';
import type { Lesson } from '../types/index.ts';

export const DashboardPage: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchLessons();
      setLessons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this lecture workspace and its extracted evidence?')) {
      return;
    }
    try {
      await deleteLesson(id);
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDemo = async () => {
    try {
      setActionLoading(true);
      await seedDemoLesson();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Aggregated metrics from real stored data
  const totalTranscripts = lessons.reduce((acc, l) => acc + (l.stats?.transcript_count || 0), 0);
  const totalVisuals = lessons.reduce((acc, l) => acc + (l.stats?.visual_count || 0), 0);
  const totalAlignments = lessons.reduce((acc, l) => acc + (l.stats?.alignment_count || 0), 0);
  const totalConflicts = lessons.reduce((acc, l) => acc + (l.stats?.conflict_count || 0), 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-ambient-glow">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Lecture Workspace Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse ingested lectures, cross-modal alignments, and verified study artifacts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleResetDemo}
            disabled={actionLoading}
            className="px-3.5 py-2 glass-button-secondary rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Reset to comprehensive Computer Networks demonstration"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Restore Demo Lesson</span>
          </button>

          <Link
            to="/lessons/new"
            className="px-4 py-2 glass-button-primary rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Lesson</span>
          </Link>
        </div>
      </div>

      {/* Real Statistics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">Active Lessons</span>
          <span className="text-2xl font-bold text-white font-mono">{lessons.length}</span>
        </div>

        <div className="glass-card p-4 border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">Transcript Chunks</span>
          <span className="text-2xl font-bold text-violet-400 font-mono">{totalTranscripts}</span>
        </div>

        <div className="glass-card p-4 border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">Visual Sources</span>
          <span className="text-2xl font-bold text-cyan-400 font-mono">{totalVisuals}</span>
        </div>

        <div className="glass-card p-4 border border-white/[0.08]">
          <span className="text-xs text-slate-400 block mb-1">Verified Alignments</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono">{totalAlignments}</span>
        </div>
      </div>

      {/* Learning Analytics: Mastery & Study Time Visualizer */}
      <LearningAnalyticsWidget lessons={lessons} />

      {/* Lessons List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-400" />
            <span>Your Ingested Lectures ({lessons.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="glass-panel p-12 text-center text-slate-400">
            <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading lecture workspaces...</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="glass-panel p-12 text-center space-y-4 border border-white/[0.08]">
            <Layers className="h-10 w-10 mx-auto text-slate-600" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No lectures uploaded yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Create a new lesson and upload audio or diagram files, or click below to restore the comprehensive
                multimodal Token Ring demonstration.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleResetDemo}
                className="px-4 py-2 glass-button-secondary rounded-xl text-xs font-semibold"
              >
                Restore Demo Lesson
              </button>
              <Link
                to="/lessons/new"
                className="px-4 py-2 glass-button-primary rounded-xl text-xs font-semibold"
              >
                Create First Lesson
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => {
              const hasAudio = (lesson.stats?.transcript_count || 0) > 0;
              const hasVisual = (lesson.stats?.visual_count || 0) > 0;

              return (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                  className="glass-card-elevated p-5 border border-white/[0.08] hover:border-violet-500/40 cursor-pointer flex flex-col justify-between transition-all group space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header line with Subject & Delete */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-violet-300 font-mono">
                        {lesson.subject}
                      </span>
                      <button
                        onClick={(e) => handleDelete(lesson.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="Delete lesson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Lesson Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-violet-200 transition-colors line-clamp-2 leading-snug">
                      {lesson.title}
                    </h3>

                    {/* Description */}
                    {lesson.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {lesson.description}
                      </p>
                    )}

                    {/* Modality Badges */}
                    <div className="flex items-center gap-2 pt-1">
                      {hasAudio && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 flex items-center gap-1 font-mono">
                          <Mic className="h-3 w-3" />
                          <span>{lesson.stats?.transcript_count} Audio Segs</span>
                        </span>
                      )}
                      {hasVisual && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-1 font-mono">
                          <ImageIcon className="h-3 w-3" />
                          <span>{lesson.stats?.visual_count} Visuals</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Stats & Open CTA */}
                  <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-mono font-medium">
                        {lesson.stats?.alignment_count || 0} alignments
                      </span>
                      {Boolean(lesson.stats?.conflict_count) && (
                        <span className="text-rose-400 font-mono font-medium">
                          · {lesson.stats?.conflict_count} conflict
                        </span>
                      )}
                    </div>

                    <span className="text-violet-300 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
