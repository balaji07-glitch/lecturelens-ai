import React, { useState } from 'react';
import {
  Mic,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type {
  TranscriptSegment,
  VisualEvidence,
  Concept,
  EvidenceAlignment,
  Conflict,
} from '../../types/index.ts';

interface EvidenceGraphProps {
  transcripts: TranscriptSegment[];
  visuals: VisualEvidence[];
  concepts: Concept[];
  alignments: EvidenceAlignment[];
  conflicts: Conflict[];
  onSelectNode?: (type: 'audio' | 'visual' | 'concept' | 'conflict', id: string) => void;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({
  transcripts,
  visuals,
  concepts,
  alignments,
  conflicts,
  onSelectNode,
}) => {
  const [filterModality, setFilterModality] = useState<'all' | 'audio' | 'visual' | 'concepts'>('all');
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'audio' | 'visual' | 'concept' | 'conflict';
    data: any;
  } | null>(null);

  const handleNodeClick = (type: 'audio' | 'visual' | 'concept' | 'conflict', data: any) => {
    setSelectedEntity({ type, data });
    if (onSelectNode) onSelectNode(type, data.id);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Legend Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/[0.08]">
        {/* Modality Filter Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          {(['all', 'audio', 'visual', 'concepts'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterModality(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                filterModality === filter
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
            <span>Spoken Audio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span>Visual Source</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span>Concept</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span>Contradiction</span>
          </div>
        </div>
      </div>

      {/* Interactive Relationship Grid & Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Audio Segments */}
        {(filterModality === 'all' || filterModality === 'audio') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                <Mic className="h-3.5 w-3.5" />
                Spoken Evidence ({transcripts.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {transcripts.map((t) => {
                const isSelected = selectedEntity?.data?.id === t.id;
                const min = Math.floor(t.start_time / 60);
                const sec = Math.floor(t.start_time % 60);

                return (
                  <div
                    key={t.id}
                    onClick={() => handleNodeClick('audio', t)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-violet-600/20 border-violet-400 shadow-md shadow-violet-500/10'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-violet-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-violet-300 font-semibold">
                        {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] text-slate-500">{t.speaker || 'Speaker'}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {t.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Column 2: Extracted Alignments & Conflicts (The Bridge) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Evidence Alignments ({alignments.length + conflicts.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {conflicts.map((cf) => {
              const isSelected = selectedEntity?.data?.id === cf.id;
              return (
                <div
                  key={cf.id}
                  onClick={() => handleNodeClick('conflict', cf)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-400 shadow-md shadow-rose-500/10'
                      : 'bg-rose-500/10 border-rose-500/30 hover:border-rose-400/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Discrepancy / Conflict</span>
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2">{cf.conflict_description}</p>
                  <div className="mt-2 text-[10px] font-mono text-rose-400/80">
                    Status: {cf.review_status}
                  </div>
                </div>
              );
            })}

            {alignments.map((a) => {
              const isSelected = selectedEntity?.data?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => handleNodeClick('concept', a)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-500/10'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-cyan-300 capitalize">
                      {a.relationship_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {Math.round(a.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {a.explanation}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Method: {a.alignment_method}</span>
                    <span className="text-emerald-400 font-mono">● {a.review_status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Visual & Concepts */}
        {(filterModality === 'all' || filterModality === 'visual' || filterModality === 'concepts') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Visuals & Concepts ({visuals.length + concepts.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {visuals.map((v) => {
                const isSelected = selectedEntity?.data?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleNodeClick('visual', v)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-cyan-400/40'
                    }`}
                  >
                    <span className="text-xs font-semibold text-cyan-300 block mb-1">
                      Visual Diagram Source
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-2">{v.visual_description}</p>
                    <div className="mt-2 text-[10px] text-slate-400 flex flex-wrap gap-1">
                      {v.detected_elements.slice(0, 3).map((el, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-white/[0.04]">
                          {el}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {concepts.map((c) => {
                const isSelected = selectedEntity?.data?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleNodeClick('concept', c)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05] hover:border-emerald-400/40'
                    }`}
                  >
                    <span className="text-xs font-semibold text-emerald-300 block mb-1">
                      {c.name}
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-2">{c.description}</p>
                    <span className="mt-2 inline-block text-[10px] font-mono text-slate-500 uppercase">
                      {c.concept_type}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Entity Details Panel */}
      {selectedEntity && (
        <div className="glass-panel p-4 border border-violet-500/30 bg-violet-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
              Selected Evidence Node: {selectedEntity.type}
            </span>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="text-xs text-slate-200 space-y-1">
            <pre className="font-mono text-[11px] whitespace-pre-wrap bg-black/40 p-2.5 rounded-lg border border-white/[0.08]">
              {JSON.stringify(selectedEntity.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
