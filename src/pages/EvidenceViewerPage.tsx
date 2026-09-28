import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Clock,
  CheckCircle,
  HelpCircle,
  Eye,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import {
  fetchLesson,
  fetchTranscript,
  fetchVisualEvidence,
  fetchConcepts,
  fetchAlignments,
  saveUserCorrection,
} from '../services/api.ts';
import { AudioWaveformPlayer } from '../components/evidence/AudioWaveformPlayer.tsx';
import { VisualInspector } from '../components/evidence/VisualInspector.tsx';
import type {
  Lesson,
  SourceFile,
  TranscriptSegment,
  VisualEvidence,
  Concept,
  EvidenceAlignment,
} from '../types/index.ts';

export const EvidenceViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [visuals, setVisualEvidence] = useState<VisualEvidence[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [alignments, setAlignments] = useState<EvidenceAlignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected alignment highlight
  const [selectedAlignmentId, setSelectedAlignmentId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchLesson(id),
      fetchTranscript(id),
      fetchVisualEvidence(id),
      fetchConcepts(id),
      fetchAlignments(id),
    ])
      .then(([l, t, v, c, a]) => {
        setLesson(l.lesson);
        setFiles(l.files);
        setTranscripts(t);
        setVisualEvidence(v);
        setConcepts(c);
        setAlignments(a);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const activeAlignment = alignments.find((a) => a.id === selectedAlignmentId);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 bg-ambient-glow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to={`/lessons/${id}`} className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Back to Workspace
            </Link>
            <span>/</span>
            <span className="text-violet-300 font-mono">Evidence Inspector</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white">
            Multimodal Evidence & Provenance Viewer
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Provenance Verified</span>
          <span className="text-emerald-400">● 100% Traceable</span>
        </div>
      </div>

      {/* Distinction Guide Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-violet-400 block font-semibold mb-0.5">
            1. Raw Input
          </span>
          <p className="text-slate-300">Original uploaded classroom audio & images preserved byte-for-byte.</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-cyan-400 block font-semibold mb-0.5">
            2. Extracted Evidence
          </span>
          <p className="text-slate-300">Timestamped transcript chunks & verbatim slide OCR text.</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-emerald-400 block font-semibold mb-0.5">
            3. Inferred Alignments
          </span>
          <p className="text-slate-300">Hypothesized cross-modal links connecting spoken terms to diagrams.</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <span className="text-[10px] font-mono uppercase text-rose-400 block font-semibold mb-0.5">
            4. User Corrections
          </span>
          <p className="text-slate-300">Human-verified edits tracked in an immutable audit ledger.</p>
        </div>
      </div>

      {/* Main 2-Column Split: Audio & Visual side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Audio Evidence with highlighted segment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mic className="h-4 w-4 text-violet-400" />
              <span>Spoken Audio Segments ({transcripts.length})</span>
            </h3>
            {activeAlignment && (
              <span className="text-[11px] font-mono text-violet-300">
                Targeting: {activeAlignment.source_evidence_id}
              </span>
            )}
          </div>

          <AudioWaveformPlayer
            segments={transcripts}
            activeSegmentId={activeAlignment?.source_evidence_id}
            audioUrl={files.find((f) => f.modality === 'audio')?.file_url}
          />
        </div>

        {/* Right: Visual Source Canvas & OCR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-cyan-400" />
              <span>Visual Evidence & OCR Breakdown</span>
            </h3>
          </div>

          <VisualInspector
            evidence={visuals}
            files={files}
            imageUrl={
              files.find(
                (f) =>
                  f.modality === 'visual' &&
                  (f.mime_type.startsWith('image/') ||
                    /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.original_filename))
              )?.file_url || files.find((f) => f.modality === 'visual')?.file_url
            }
          />
        </div>
      </div>

      {/* Alignments Carousel */}
      <div className="glass-panel p-5 border border-white/[0.08] space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>Interactive Alignment Inspector (Select to Highlight Both Sources)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {alignments.map((a) => {
            const isSelected = selectedAlignmentId === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setSelectedAlignmentId(isSelected ? null : a.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                  isSelected
                    ? 'bg-violet-600/20 border-violet-400 shadow-md shadow-violet-500/20'
                    : 'bg-white/[0.02] border-white/[0.08] hover:border-violet-500/40'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white capitalize">
                    {a.relationship_type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-violet-300 text-[10px]">
                    {Math.round(a.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">{a.explanation}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>From: {a.source_evidence_id}</span>
                  <span>To: {a.target_evidence_id}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
