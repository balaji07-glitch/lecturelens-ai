import React, { useState } from 'react';
import {
  BookOpen,
  Layers,
  HelpCircle,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { StudyArtifact, FlashcardItem, QuizQuestionItem } from '../../types/index.ts';

interface StudyPackViewProps {
  artifacts: StudyArtifact[];
  onGenerate: (type: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isGenerating: boolean;
}

export const StudyPackView: React.FC<StudyPackViewProps> = ({
  artifacts,
  onGenerate,
  onDelete,
  isGenerating,
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    artifacts[0]?.id || null
  );
  const [copied, setCopied] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  const activeArtifact = artifacts.find((a) => a.id === selectedArtifactId) || artifacts[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = (artifact: StudyArtifact) => {
    const blob = new Blob([artifact.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFlip = (cardId: string) => {
    setFlippedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submittedQuiz) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  return (
    <div className="space-y-6">
      {/* Top Generator Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/[0.08]">
        <div>
          <h3 className="text-sm font-semibold text-white">Study Pack Generator</h3>
          <p className="text-xs text-slate-400">
            Synthesize structured study artifacts strictly grounded in verified lecture evidence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onGenerate('structured_notes')}
            disabled={isGenerating}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] transition-colors disabled:opacity-50"
          >
            + Notes
          </button>
          <button
            onClick={() => onGenerate('flashcards')}
            disabled={isGenerating}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] transition-colors disabled:opacity-50"
          >
            + Flashcards
          </button>
          <button
            onClick={() => onGenerate('practice_quiz')}
            disabled={isGenerating}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/30 hover:bg-violet-600/40 text-violet-200 border border-violet-500/40 transition-colors disabled:opacity-50"
          >
            + Practice Quiz
          </button>
        </div>
      </div>

      {/* Artifact Selector Tabs */}
      {artifacts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {artifacts.map((art) => {
            const isSelected = activeArtifact?.id === art.id;
            return (
              <button
                key={art.id}
                onClick={() => setSelectedArtifactId(art.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-violet-600/20 text-white border border-violet-500/50 shadow-md shadow-violet-500/10'
                    : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {art.artifact_type === 'flashcards' ? (
                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                ) : art.artifact_type === 'practice_quiz' ? (
                  <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                )}
                <span>{art.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Artifact Viewport */}
      {activeArtifact ? (
        <div className="glass-card-elevated p-5 sm:p-6 border border-white/[0.08] space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-violet-400 block mb-1">
                Artifact Type: {activeArtifact.artifact_type.replace(/_/g, ' ')}
              </span>
              <h2 className="text-lg font-bold text-white">{activeArtifact.title}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(activeArtifact.content)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/[0.04] transition-colors"
                title="Copy Content"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleDownloadMarkdown(activeArtifact)}
                className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/[0.04] transition-colors"
                title="Export Markdown"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(activeArtifact.id)}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg bg-white/[0.04] transition-colors"
                title="Delete Artifact"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Render by Artifact Type */}
          {activeArtifact.artifact_type === 'flashcards' && activeArtifact.parsed_data?.flashcards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeArtifact.parsed_data.flashcards.map((fc: FlashcardItem) => {
                const isFlipped = flippedCards[fc.id] || false;
                return (
                  <div
                    key={fc.id}
                    onClick={() => toggleFlip(fc.id)}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/40 cursor-pointer min-h-[170px] flex flex-col justify-between transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400">
                          {isFlipped ? 'Answer (Click to flip)' : 'Question (Click to flip)'}
                        </span>
                        <span className="text-xs text-slate-500">{fc.related_concept}</span>
                      </div>

                      <p className="text-sm font-medium text-slate-100 leading-relaxed">
                        {isFlipped ? fc.answer : fc.question}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Source: {fc.source_evidence_hint}</span>
                      <span className="text-violet-400 group-hover:translate-x-1 transition-transform">
                        ↻ Flip
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeArtifact.artifact_type === 'practice_quiz' && activeArtifact.parsed_data?.quiz ? (
            <div className="space-y-6">
              {activeArtifact.parsed_data.quiz.map((q: QuizQuestionItem, qIdx: number) => {
                const selectedOption = quizAnswers[q.id];
                const isCorrect = selectedOption === q.correct_index;

                return (
                  <div
                    key={q.id || qIdx}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm font-semibold text-white">
                        {qIdx + 1}. {q.question}
                      </span>
                      {submittedQuiz && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            isCorrect
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isChosen = selectedOption === optIdx;
                        let optionStyle =
                          'bg-white/[0.02] border-white/[0.08] text-slate-300 hover:bg-white/[0.05]';

                        if (submittedQuiz) {
                          if (optIdx === q.correct_index) {
                            optionStyle =
                              'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold';
                          } else if (isChosen) {
                            optionStyle =
                              'bg-rose-500/20 border-rose-500/50 text-rose-200 line-through';
                          }
                        } else if (isChosen) {
                          optionStyle =
                            'bg-violet-600/30 border-violet-500 text-white font-medium';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {submittedQuiz && optIdx === q.correct_index && (
                              <Check className="h-4 w-4 text-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {submittedQuiz && (
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06] text-xs text-slate-300 space-y-1">
                        <span className="font-semibold text-violet-300 block">Explanation:</span>
                        <p>{q.explanation}</p>
                        <span className="text-[11px] text-slate-500 block pt-1">
                          Evidence Source: {q.supporting_source}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end gap-3 pt-2">
                {!submittedQuiz ? (
                  <button
                    onClick={() => setSubmittedQuiz(true)}
                    className="px-5 py-2.5 glass-button-primary rounded-xl text-xs sm:text-sm font-semibold"
                  >
                    Submit Quiz & Verify Evidence
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSubmittedQuiz(false);
                      setQuizAnswers({});
                    }}
                    className="px-4 py-2 glass-button-secondary rounded-xl text-xs font-semibold"
                  >
                    Retake Quiz
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Structured Notes / Markdown */
            <div className="prose prose-invert max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans bg-black/20 p-5 rounded-2xl border border-white/[0.04]">
              {activeArtifact.content}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-10 text-center text-slate-400">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-violet-400 opacity-60" />
          <p className="text-sm font-medium text-slate-300">No study artifacts generated yet.</p>
          <p className="text-xs text-slate-500 mt-1">
            Click "+ Notes", "+ Flashcards", or "+ Practice Quiz" to generate evidence-grounded study materials.
          </p>
        </div>
      )}
    </div>
  );
};
