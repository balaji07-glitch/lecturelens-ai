import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Mic,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Upload,
  RefreshCw,
  Clock,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Volume2,
  HelpCircle,
  X,
  Bot,
} from 'lucide-react';
import { GeminiChatbot } from '../components/chat/GeminiChatbot.tsx';
import {
  fetchLesson,
  fetchTranscript,
  fetchVisualEvidence,
  fetchConcepts,
  fetchAlignments,
  fetchConflicts,
  fetchCorrections,
  fetchAnswers,
  askQuestion,
  triggerProcessing,
  uploadLessonFiles,
  saveUserCorrection,
  resolveConflict,
  reviewAlignment,
  generateStudyArtifact,
  fetchStudyArtifacts,
  deleteStudyArtifact,
  fetchAccessibility,
} from '../services/api.ts';
import { AudioWaveformPlayer } from '../components/evidence/AudioWaveformPlayer.tsx';
import { VisualInspector } from '../components/evidence/VisualInspector.tsx';
import { EvidenceGraph } from '../components/evidence/EvidenceGraph.tsx';
import { GroundedChat } from '../components/qa/GroundedChat.tsx';
import { StudyPackView } from '../components/study/StudyPackView.tsx';
import { AccessibilityView } from '../components/accessibility/AccessibilityView.tsx';
import { MultimodalUploadZone } from '../components/upload/MultimodalUploadZone.tsx';
import type {
  Lesson,
  SourceFile,
  TranscriptSegment,
  VisualEvidence,
  Concept,
  EvidenceAlignment,
  Conflict,
  UserCorrection,
  QuestionAnswer,
  StudyArtifact,
  GroundedEvidenceReference,
} from '../types/index.ts';

export const LessonWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // State
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [files, setFiles] = useState<SourceFile[]>([]);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [visuals, setVisualEvidence] = useState<VisualEvidence[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [alignments, setAlignments] = useState<EvidenceAlignment[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [corrections, setCorrections] = useState<UserCorrection[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [artifacts, setArtifacts] = useState<StudyArtifact[]>([]);
  const [accessibilityData, setAccessibilityData] = useState<any>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'transcript' | 'visuals' | 'map' | 'study' | 'accessibility' | 'conflicts' | 'gemini_chat'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [askStatusMessage, setAskStatusMessage] = useState<string | null>(null);
  const [askErrorMessage, setAskErrorMessage] = useState<string | null>(null);
  const [isGeneratingArtifact, setIsGeneratingArtifact] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | undefined>(undefined);
  const [showAddFilesModal, setShowAddFilesModal] = useState(false);
  const [modalFiles, setModalFiles] = useState<File[]>([]);
  const [isUploadingModalFiles, setIsUploadingModalFiles] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [
        lessonData,
        transcriptData,
        visualData,
        conceptData,
        alignmentData,
        conflictData,
        correctionData,
        answerData,
        artifactData,
      ] = await Promise.all([
        fetchLesson(id),
        fetchTranscript(id),
        fetchVisualEvidence(id),
        fetchConcepts(id),
        fetchAlignments(id),
        fetchConflicts(id),
        fetchCorrections(id),
        fetchAnswers(id),
        fetchStudyArtifacts(id),
      ]);

      setLesson(lessonData.lesson);
      setFiles(lessonData.files);
      setTranscripts(transcriptData);
      setVisualEvidence(visualData);
      setConcepts(conceptData);
      setAlignments(alignmentData);
      setConflicts(conflictData);
      setCorrections(correctionData);
      setAnswers(answerData);
      setArtifacts(artifactData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  // Load accessibility data on demand when tab selected
  useEffect(() => {
    if (activeTab === 'accessibility' && !accessibilityData && id) {
      fetchAccessibility(id)
        .then((data) => setAccessibilityData(data))
        .catch((err) => console.error(err));
    }
  }, [activeTab, id, accessibilityData]);

  const handleTriggerReprocess = async () => {
    if (!id) return;
    try {
      setIsProcessing(true);
      await triggerProcessing(id);
      // Wait a moment then reload
      setTimeout(async () => {
        await loadAll();
        setIsProcessing(false);
      }, 2500);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!id || !e.target.files || e.target.files.length === 0) return;
    try {
      setIsProcessing(true);
      await uploadLessonFiles(id, Array.from(e.target.files));
      await triggerProcessing(id);
      setTimeout(async () => {
        await loadAll();
        setIsProcessing(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handleModalUploadAndProcess = async () => {
    if (!id || modalFiles.length === 0) return;
    try {
      setIsUploadingModalFiles(true);
      await uploadLessonFiles(id, modalFiles);
      await triggerProcessing(id);
      setShowAddFilesModal(false);
      setModalFiles([]);
      setTimeout(async () => {
        await loadAll();
        setIsUploadingModalFiles(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setIsUploadingModalFiles(false);
    }
  };

  const handleAskQuestion = async (q: string) => {
    if (!id) return;
    try {
      setIsAsking(true);
      setAskStatusMessage(null);
      setAskErrorMessage(null);
      const answer = await askQuestion(id, q, (status) => {
        setAskStatusMessage(status);
      });
      setAnswers((prev) => [answer, ...prev]);
    } catch (err: any) {
      console.warn('Ask AI encountered an issue:', err?.message || err);
      setAskErrorMessage(
        'AI model temporarily busy; retrying or using cached verification...'
      );
    } finally {
      setIsAsking(false);
      setAskStatusMessage(null);
    }
  };

  const handleSaveTranscriptCorrection = async (
    segmentId: string,
    newText: string,
    explanation: string
  ) => {
    if (!id) return;
    await saveUserCorrection({
      evidence_id: segmentId,
      lesson_id: id,
      evidence_type: 'transcript',
      corrected_value: newText,
      explanation,
    });
    setTranscripts((prev) =>
      prev.map((t) => (t.id === segmentId ? { ...t, text: newText, correction_status: 'edited' } : t))
    );
    const updatedCorrections = await fetchCorrections(id);
    setCorrections(updatedCorrections);
  };

  const handleSaveOcrCorrection = async (
    evidenceId: string,
    newOcr: string,
    explanation: string
  ) => {
    if (!id) return;
    await saveUserCorrection({
      evidence_id: evidenceId,
      lesson_id: id,
      evidence_type: 'visual_ocr',
      corrected_value: newOcr,
      explanation,
    });
    setVisualEvidence((prev) =>
      prev.map((v) => (v.id === evidenceId ? { ...v, ocr_text: newOcr } : v))
    );
    const updatedCorrections = await fetchCorrections(id);
    setCorrections(updatedCorrections);
  };

  const handleResolveConflict = async (conflictId: string) => {
    const note = prompt('Enter resolution note:', 'Confirmed via teacher clarification.');
    if (!note) return;
    try {
      const updated = await resolveConflict(conflictId, note);
      setConflicts((prev) => prev.map((c) => (c.id === conflictId ? updated : c)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewAlignment = async (alignmentId: string, status: 'confirmed' | 'rejected') => {
    try {
      const updated = await reviewAlignment(alignmentId, status);
      setAlignments((prev) => prev.map((a) => (a.id === alignmentId ? updated : a)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateStudyArtifact = async (type: string) => {
    if (!id) return;
    try {
      setIsGeneratingArtifact(true);
      const art = await generateStudyArtifact(id, type);
      setArtifacts((prev) => [...prev, art]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingArtifact(false);
    }
  };

  const handleDeleteStudyArtifact = async (artifactId: string) => {
    try {
      await deleteStudyArtifact(artifactId);
      setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectEvidenceRef = (ref: GroundedEvidenceReference) => {
    if (ref.modality === 'audio') {
      setActiveTab('transcript');
      setActiveSegmentId(ref.evidence_id);
    } else if (ref.modality === 'visual') {
      setActiveTab('visuals');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8 bg-[#080B16]">
        <div className="glass-panel p-8 text-center space-y-3">
          <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Loading multimodal lesson workspace...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-12 text-center text-slate-400">
        <h2 className="text-lg font-bold text-white mb-2">Lesson not found</h2>
        <Link to="/dashboard" className="text-xs text-violet-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 bg-ambient-glow">
      {/* Top Breadcrumb & Processing Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/dashboard" className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-violet-300 font-mono">{lesson.subject}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white">{lesson.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setModalFiles([]);
              setShowAddFilesModal(true);
            }}
            className="px-3.5 py-1.5 glass-button-secondary rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Add Files</span>
          </button>

          <button
            onClick={handleTriggerReprocess}
            disabled={isProcessing}
            className="px-3.5 py-1.5 glass-button-primary rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Processing Modalities...' : 'Re-run Alignment'}</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Banner if open conflict exists */}
      {conflicts.some((c) => c.review_status === 'open') && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>
              <strong>Discrepancy Detected:</strong> Spoken audio statement contradicts visual slide label.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('conflicts')}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold border border-rose-500/40 whitespace-nowrap"
          >
            Review Discrepancy
          </button>
        </div>
      )}

      {/* 3-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (3 cols): Lesson Metadata, Source Files, & Modalities */}
        <div className="lg:col-span-3 space-y-4">
          {/* Metadata Card */}
          <div className="glass-panel p-4 border border-white/[0.08] space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Lecture Information
            </span>

            <div className="space-y-2 text-xs">
              {lesson.course && (
                <div>
                  <span className="text-slate-500 block">Course</span>
                  <span className="text-white font-medium">{lesson.course}</span>
                </div>
              )}
              {lesson.instructor && (
                <div>
                  <span className="text-slate-500 block">Instructor</span>
                  <span className="text-white font-medium">{lesson.instructor}</span>
                </div>
              )}
              {lesson.lecture_date && (
                <div>
                  <span className="text-slate-500 block">Date</span>
                  <span className="text-slate-300 font-mono">{lesson.lecture_date}</span>
                </div>
              )}
            </div>

            {lesson.description && (
              <p className="text-xs text-slate-400 pt-2 border-t border-white/[0.06] leading-relaxed">
                {lesson.description}
              </p>
            )}
          </div>

          {/* Original Source Files */}
          <div className="glass-panel p-4 border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Source Files ({files.length})
              </span>
            </div>

            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.modality === 'audio' ? (
                      <Mic className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    )}
                    <span className="text-slate-200 truncate">{file.original_filename}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">● {file.processing_status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modalities Coverage */}
          <div className="glass-panel p-4 border border-white/[0.08] space-y-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Modality Coverage
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-violet-400" />
                  Spoken Audio Chunks
                </span>
                <span className="font-mono text-white font-semibold">{transcripts.length}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                  Visual Sources
                </span>
                <span className="font-mono text-white font-semibold">{visuals.length}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  Cross-Modal Alignments
                </span>
                <span className="font-mono text-white font-semibold">{alignments.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column (6 cols): Primary Workspace Tabs */}
        <div className="lg:col-span-6 space-y-4">
          {/* Workspace Tabs Navigation */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel border border-white/[0.08] overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'transcript', label: 'Transcript', icon: Mic },
              { id: 'visuals', label: 'Visuals', icon: ImageIcon },
              { id: 'map', label: 'Evidence Map', icon: Layers },
              { id: 'study', label: 'Study Pack', icon: Sparkles },
              { id: 'gemini_chat', label: 'Gemini Chat & Search', icon: Bot },
              { id: 'accessibility', label: 'Accessibility', icon: ShieldCheck },
              { id: 'conflicts', label: `Discrepancies (${conflicts.length})`, icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Core Concepts */}
              <div className="glass-card-elevated p-5 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span>Extracted Core Concepts ({concepts.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {concepts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-violet-500/30 space-y-1.5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{c.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                          {c.concept_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Alignments Highlights */}
              <div className="glass-card-elevated p-5 border border-white/[0.08] space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <span>Verified Cross-Modal Alignments</span>
                </h3>

                <div className="space-y-2.5">
                  {alignments.slice(0, 3).map((al) => (
                    <div
                      key={al.id}
                      className="p-3 rounded-xl bg-black/20 border border-white/[0.06] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-cyan-300 font-semibold">
                        <span>{al.relationship_type.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-slate-500 text-[10px]">
                          {Math.round(al.confidence * 100)}% conf
                        </span>
                      </div>
                      <p className="text-slate-300">{al.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Transcript */}
          {activeTab === 'transcript' && (
            <AudioWaveformPlayer
              segments={transcripts}
              activeSegmentId={activeSegmentId}
              audioUrl={files.find((f) => f.modality === 'audio')?.file_url}
              onSaveCorrection={handleSaveTranscriptCorrection}
            />
          )}

          {/* Tab 3: Visuals */}
          {activeTab === 'visuals' && (
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
              onSaveOcrCorrection={handleSaveOcrCorrection}
            />
          )}

          {/* Tab 4: Evidence Map */}
          {activeTab === 'map' && (
            <EvidenceGraph
              transcripts={transcripts}
              visuals={visuals}
              concepts={concepts}
              alignments={alignments}
              conflicts={conflicts}
            />
          )}

          {/* Tab 5: Study Pack */}
          {activeTab === 'study' && (
            <StudyPackView
              artifacts={artifacts}
              onGenerate={handleGenerateStudyArtifact}
              onDelete={handleDeleteStudyArtifact}
              isGenerating={isGeneratingArtifact}
            />
          )}

          {/* Tab 6: Accessibility */}
          {activeTab === 'accessibility' && (
            <AccessibilityView data={accessibilityData} lessonTitle={lesson.title} />
          )}

          {/* Tab 7: Conflicts & Corrections */}
          {activeTab === 'conflicts' && (
            <div className="space-y-6">
              {/* Conflicts List */}
              <div className="glass-card-elevated p-5 border border-white/[0.08] space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span>Detected Cross-Modal Inconsistencies ({conflicts.length})</span>
                </h3>

                {conflicts.length === 0 ? (
                  <p className="text-xs text-slate-400">No discrepancies detected between spoken and slide evidence.</p>
                ) : (
                  conflicts.map((cf) => (
                    <div
                      key={cf.id}
                      className="p-4 rounded-xl bg-black/30 border border-rose-500/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-300">
                          Discrepancy: {cf.conflict_description}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                            cf.review_status === 'resolved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {cf.review_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-violet-950/20 border border-violet-500/20">
                          <span className="text-[10px] font-mono uppercase text-violet-300 block mb-1">
                            Audio Claim:
                          </span>
                          <p className="text-slate-300">{cf.audio_claim}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20">
                          <span className="text-[10px] font-mono uppercase text-cyan-300 block mb-1">
                            Visual Slide Claim:
                          </span>
                          <p className="text-slate-300">{cf.visual_claim}</p>
                        </div>
                      </div>

                      {cf.resolution_note && (
                        <div className="text-xs text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                          <strong>Resolution Note:</strong> {cf.resolution_note}
                        </div>
                      )}

                      {cf.review_status !== 'resolved' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleResolveConflict(cf.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40"
                          >
                            Resolve Discrepancy
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* User Correction Audit History */}
              <div className="glass-card-elevated p-5 border border-white/[0.08] space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>User Corrections Audit Trail ({corrections.length})</span>
                </h3>

                {corrections.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No user corrections recorded yet. Edit transcript segments or OCR text to track changes here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {corrections.map((corr) => (
                      <div
                        key={corr.id}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-semibold text-white capitalize">
                            Type: {corr.evidence_type}
                          </span>
                          <span className="font-mono text-[10px]">
                            {new Date(corr.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-slate-300">
                          <span className="text-rose-400 line-through mr-2">
                            "{corr.original_value.slice(0, 80)}..."
                          </span>
                          <span className="text-emerald-400">
                            → "{corr.corrected_value.slice(0, 80)}..."
                          </span>
                        </div>
                        {corr.explanation && (
                          <p className="text-[11px] text-slate-500 italic">Reason: {corr.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (3 cols): Grounded Ask AI Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-panel p-4 border border-white/[0.08] space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white">Grounded Ask AI</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                Evidence Only
              </span>
            </div>

            <GroundedChat
              answers={answers}
              lessonTitle={lesson?.title}
              concepts={concepts}
              onAskQuestion={handleAskQuestion}
              isLoading={isAsking}
              onSelectEvidenceReference={handleSelectEvidenceRef}
              statusMessage={askStatusMessage}
              errorMessage={askErrorMessage}
              onClearError={() => setAskErrorMessage(null)}
            />
          </div>
        </div>
      </div>

      {/* Add Files Modal with Drag, Search, and Copy-Paste */}
      {showAddFilesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-card-elevated w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 border border-white/[0.12] space-y-5 bg-[#080B16]/95">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add Modalities to Lecture</h3>
                <p className="text-xs text-slate-400">
                  Search library samples, paste screenshots/notes, or drop files to ingest into "{lesson.title}".
                </p>
              </div>
              <button
                onClick={() => setShowAddFilesModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <MultimodalUploadZone files={modalFiles} onFilesChange={setModalFiles} />

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
              <button
                onClick={() => setShowAddFilesModal(false)}
                className="px-4 py-2 glass-button-secondary rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={handleModalUploadAndProcess}
                disabled={modalFiles.length === 0 || isUploadingModalFiles}
                className="px-5 py-2 glass-button-primary rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isUploadingModalFiles ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Ingesting {modalFiles.length} files...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Ingest {modalFiles.length} Files</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
