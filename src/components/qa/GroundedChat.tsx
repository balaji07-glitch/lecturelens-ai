import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Volume2,
  Image as ImageIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { QuestionAnswer, GroundedEvidenceReference, Concept } from '../../types/index.ts';

interface GroundedChatProps {
  answers: QuestionAnswer[];
  onAskQuestion: (question: string) => Promise<void>;
  isLoading: boolean;
  onSelectEvidenceReference?: (ref: GroundedEvidenceReference) => void;
  statusMessage?: string | null;
  errorMessage?: string | null;
  onClearError?: () => void;
  lessonTitle?: string;
  concepts?: Concept[];
}

export const GroundedChat: React.FC<GroundedChatProps> = ({
  answers,
  onAskQuestion,
  isLoading,
  onSelectEvidenceReference,
  statusMessage,
  errorMessage,
  onClearError,
  lessonTitle = '',
  concepts = [],
}) => {
  const [question, setQuestion] = useState('');

  // Dynamically generate quick inquiries based on selected lecture
  const isTokenRing =
    lessonTitle.toLowerCase().includes('ring') ||
    lessonTitle.toLowerCase().includes('token');
  const isAiMl =
    lessonTitle.toLowerCase().includes('artificial intelligence') ||
    lessonTitle.toLowerCase().includes('machine learning') ||
    lessonTitle.toLowerCase().includes('ai') ||
    lessonTitle.toLowerCase().includes('ml');

  let sampleQuestions: string[] = [];
  if (isAiMl) {
    sampleQuestions = [
      'What are the core steps in the Data Ingestion & Feature Engineering pipeline?',
      'How does the Model Training & Hyperparameter Tuning module operate?',
      'What real-world AI applications were discussed in this lecture?',
      'What is the role of the Real-Time Inference & Deployment API?',
    ];
  } else if (isTokenRing) {
    sampleQuestions = [
      'What did the teacher say about the failure warning shown on the diagram?',
      'How does the 3-byte token frame work according to the lecture?',
      'Why are collisions impossible in this topology?',
      'What is the difference between a physical star and logical ring?',
    ];
  } else {
    sampleQuestions = [
      `What are the main concepts covered in ${lessonTitle || 'this lecture'}?`,
      concepts[0] ? `How does ${concepts[0].name} function according to the lecture?` : 'What are the key takeaways from the lecture audio?',
      concepts[1] ? `What is the role of ${concepts[1].name} in this system?` : 'What visual diagram details were explained in class?',
      'What key conclusions and takeaways were discussed by the instructor?',
    ];
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onAskQuestion(question.trim());
    setQuestion('');
  };

  const handleSampleClick = (q: string) => {
    if (isLoading) return;
    onAskQuestion(q);
  };

  return (
    <div className="space-y-5">
      {/* Sample Query Prompts */}
      <div className="space-y-1.5">
        <span className="text-xs text-slate-400 font-medium">Quick Grounded Inquiries:</span>
        <div className="flex flex-wrap gap-1.5">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSampleClick(q)}
              disabled={isLoading}
              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/40 hover:bg-violet-600/10 text-slate-300 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Question Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question grounded in lecture audio and visual evidence..."
          className="flex-1 glass-input px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="px-4 py-2.5 glass-button-primary rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {/* Transient / Retry Status Notification */}
      {statusMessage && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-violet-600/15 border border-violet-500/35 text-xs text-violet-200 animate-pulse">
          <RefreshCw className="h-4 w-4 animate-spin text-violet-400 shrink-0" />
          <div className="leading-snug">
            <span className="font-semibold block text-violet-300">Transient Service Notice:</span>
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* User-Friendly Error / Recovery Indicator (prevents raw JSON dumps) */}
      {errorMessage && !statusMessage && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                {errorMessage.includes('{') || errorMessage.includes('ApiError') || errorMessage.includes('503') || errorMessage.includes('status 5')
                  ? 'AI model temporarily busy; retrying or using cached verification...'
                  : errorMessage}
              </span>
            </div>
            {onClearError && (
              <button
                onClick={onClearError}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                aria-label="Dismiss message"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-300 pl-6 leading-relaxed">
            The AI model service is under high demand. Structured lecture evidence and cached answers remain verified and available.
          </p>
        </div>
      )}

      {/* Answers Feed */}
      <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
        {answers.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400">
            <Sparkles className="h-8 w-8 mx-auto mb-2 text-violet-400 opacity-70" />
            <p className="text-sm font-medium text-slate-300">
              No questions asked yet for this lecture.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Ask anything about the spoken lecture, equations, or visual slides. Answers will cite verified
              timestamps and diagram components.
            </p>
          </div>
        ) : (
          answers.map((qa) => {
            const isRawApiError =
              qa.explanation?.includes('GoogleGenAI') ||
              qa.explanation?.includes('ApiError') ||
              qa.explanation?.includes('503') ||
              qa.explanation?.includes('RESOURCE_EXHAUSTED') ||
              qa.explanation?.trim().startsWith('{') ||
              qa.direct_answer?.includes('GoogleGenAI') ||
              qa.direct_answer?.includes('ApiError') ||
              qa.direct_answer?.includes('503') ||
              qa.direct_answer?.trim().startsWith('{') ||
              qa.direct_answer?.includes('Encountered an issue processing');

            return (
              <div
                key={qa.id}
                className="glass-card-elevated p-4 sm:p-5 border border-white/[0.08] space-y-3.5 relative overflow-hidden"
              >
                {/* Modality Tag & Verification State */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Q: {qa.question}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {qa.is_cached_or_fallback && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Cached Verification</span>
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        qa.answer_mode === 'multimodal'
                          ? 'bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : qa.answer_mode === 'audio_only'
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : qa.answer_mode === 'visual_only'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      ● {qa.answer_mode.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Direct Answer */}
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Direct Answer:
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                    {isRawApiError
                      ? 'AI model temporarily busy; retrying or using cached verification...'
                      : qa.direct_answer}
                  </p>
                </div>

                {/* Detailed Grounded Explanation */}
                {qa.explanation && !isRawApiError && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Grounded Synthesis:
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{qa.explanation}</p>
                  </div>
                )}

                {/* Cached Verification Indicator Banner */}
                {qa.is_cached_or_fallback && qa.provider_notice && (
                  <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/25 text-xs text-cyan-200 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />
                      <div>
                        <span className="font-semibold block text-cyan-300">
                          Verified via Cached Lecture Evidence:
                        </span>
                        <p className="text-slate-300">{qa.provider_notice}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onAskQuestion(qa.question)}
                      className="text-[11px] font-semibold text-cyan-300 hover:text-white underline shrink-0 flex items-center gap-1 mt-0.5"
                      title="Retry with live Gemini model"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Retry Live</span>
                    </button>
                  </div>
                )}

                {/* Fallback for raw ApiError */}
                {isRawApiError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span>AI Model Service Notice (503 High Demand)</span>
                    </div>
                    <p className="text-slate-300">
                      The live AI model is temporarily experiencing high demand. Grounded answers can still be
                      verified directly from the audio timeline and slide diagrams above.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => onAskQuestion(qa.question)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-semibold flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Retry Question Now</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Supporting Evidence Citations */}
                {qa.evidence_references && qa.evidence_references.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Traceable Evidence Citations ({qa.evidence_references.length}):
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {qa.evidence_references.map((ref, idx) => (
                        <div
                          key={idx}
                          onClick={() => onSelectEvidenceReference && onSelectEvidenceReference(ref)}
                          className="p-2.5 rounded-lg bg-black/30 border border-white/[0.08] hover:border-violet-400/50 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-violet-300 flex items-center gap-1">
                              {ref.modality === 'audio' ? (
                                <Volume2 className="h-3 w-3 text-violet-400" />
                              ) : (
                                <ImageIcon className="h-3 w-3 text-cyan-400" />
                              )}
                              {ref.title}
                            </span>
                            {ref.timestamp && (
                              <span className="font-mono text-[10px] text-slate-400 flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {ref.timestamp}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">{ref.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Uncertainty or Insufficient Evidence Banner */}
                {qa.uncertainty_note && !isRawApiError && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      <strong>Uncertainty Note:</strong> {qa.uncertainty_note}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
