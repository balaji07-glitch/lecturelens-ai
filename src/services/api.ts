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
  ProcessingJob,
  SearchResult,
} from '../types/index.ts';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchProviderStatus() {
  const res = await fetch(`${API_BASE}/provider-status`);
  return res.json();
}

export async function fetchLessons(): Promise<Lesson[]> {
  const res = await fetch(`${API_BASE}/lessons`);
  if (!res.ok) throw new Error('Failed to fetch lessons');
  return res.json();
}

export async function createLesson(data: {
  title: string;
  subject: string;
  course?: string;
  instructor?: string;
  lecture_date?: string;
  description?: string;
}): Promise<Lesson> {
  const res = await fetch(`${API_BASE}/lessons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create lesson');
  return res.json();
}

export async function fetchLesson(id: string): Promise<{
  lesson: Lesson;
  files: SourceFile[];
  transcript_count: number;
  visual_count: number;
  concept_count: number;
  alignment_count: number;
  conflict_count: number;
}> {
  const res = await fetch(`${API_BASE}/lessons/${id}`);
  if (!res.ok) throw new Error('Failed to fetch lesson details');
  return res.json();
}

export async function deleteLesson(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lessons/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete lesson');
}

export async function seedDemoLesson(): Promise<void> {
  const res = await fetch(`${API_BASE}/lessons/seed-demo`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed demo lesson');
}

export async function uploadLessonFiles(lessonId: string, files: File[]): Promise<SourceFile[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch(`${API_BASE}/lessons/${lessonId}/files`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload files');
  const data = await res.json();
  return data.files;
}

export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/files/${fileId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete file');
}

export async function triggerProcessing(lessonId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/process`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to initiate processing');
}

export async function fetchTranscript(lessonId: string): Promise<TranscriptSegment[]> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/transcript`);
  if (!res.ok) throw new Error('Failed to fetch transcript');
  return res.json();
}

export async function fetchVisualEvidence(lessonId: string): Promise<VisualEvidence[]> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/visual-evidence`);
  if (!res.ok) throw new Error('Failed to fetch visual evidence');
  return res.json();
}

export async function fetchConcepts(lessonId: string): Promise<Concept[]> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/concepts`);
  if (!res.ok) throw new Error('Failed to fetch concepts');
  return res.json();
}

export async function fetchAlignments(lessonId: string): Promise<EvidenceAlignment[]> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/alignments`);
  if (!res.ok) throw new Error('Failed to fetch alignments');
  return res.json();
}

export async function fetchEvidenceMap(lessonId: string): Promise<{
  nodes: Array<{ id: string; label: string; type: string; details: any }>;
  edges: Array<{ id: string; source: string; target: string; label: string; type: string; confidence: number }>;
}> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/evidence-map`);
  if (!res.ok) throw new Error('Failed to fetch evidence map');
  return res.json();
}

export async function fetchConflicts(lessonId: string): Promise<Conflict[]> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/conflicts`);
  if (!res.ok) throw new Error('Failed to fetch conflicts');
  return res.json();
}

export async function resolveConflict(conflictId: string, resolutionNote: string): Promise<Conflict> {
  const res = await fetch(`${API_BASE}/conflicts/${conflictId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resolution_note: resolutionNote }),
  });
  if (!res.ok) throw new Error('Failed to resolve conflict');
  return res.json();
}

export async function reviewAlignment(alignmentId: string, status: 'confirmed' | 'rejected'): Promise<EvidenceAlignment> {
  const res = await fetch(`${API_BASE}/alignments/${alignmentId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to review alignment');
  return res.json();
}

export async function saveUserCorrection(data: {
  evidence_id: string;
  lesson_id: string;
  evidence_type: 'transcript' | 'visual_ocr';
  corrected_value: string;
  explanation?: string;
}): Promise<UserCorrection> {
  const res = await fetch(`${API_BASE}/evidence/${data.evidence_id}/corrections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save correction');
  return res.json();
}

export async function fetchCorrections(lessonId: string): Promise<UserCorrection[]> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/corrections`);
  if (!res.ok) throw new Error('Failed to fetch corrections');
  return res.json();
}

export async function askQuestion(
  lessonId: string,
  question: string,
  onStatusUpdate?: (status: string) => void
): Promise<QuestionAnswer> {
  const maxAttempts = 3;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/lessons/${lessonId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      // Handle 503 Service Unavailable or transient rate limits with retry
      if (res.status === 503 || res.status === 429) {
        if (attempt < maxAttempts) {
          if (onStatusUpdate) {
            onStatusUpdate('AI model temporarily busy; retrying or using cached verification...');
          }
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const rawErr = errorData.error || `Request failed with status ${res.status}`;
        // Prevent raw JSON or 503 dumps from being thrown
        if (res.status === 503 || rawErr.includes('503') || rawErr.includes('Service Unavailable')) {
          throw new Error('AI model temporarily busy; retrying or using cached verification...');
        }
        throw new Error(rawErr);
      }

      return await res.json();
    } catch (err: any) {
      const isTransient =
        err?.message?.includes('503') ||
        err?.message?.includes('429') ||
        err?.message?.includes('temporarily busy') ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError');

      if (attempt < maxAttempts && isTransient) {
        if (onStatusUpdate) {
          onStatusUpdate('AI model temporarily busy; retrying or using cached verification...');
        }
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      // If exhausted retries on transient error, rethrow friendly message
      if (isTransient) {
        throw new Error('AI model temporarily busy; retrying or using cached verification...');
      }
      throw err;
    }
  }

  throw new Error('AI model temporarily busy; retrying or using cached verification...');
}

export async function fetchAnswers(lessonId: string): Promise<QuestionAnswer[]> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/answers`);
  if (!res.ok) throw new Error('Failed to fetch answers');
  return res.json();
}

export async function generateStudyArtifact(lessonId: string, artifactType: string): Promise<StudyArtifact> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/study-artifacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artifact_type: artifactType }),
  });
  if (!res.ok) throw new Error('Failed to generate study artifact');
  return res.json();
}

export async function fetchStudyArtifacts(lessonId: string): Promise<StudyArtifact[]> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/study-artifacts`);
  if (!res.ok) throw new Error('Failed to fetch study artifacts');
  return res.json();
}

export async function deleteStudyArtifact(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/study-artifacts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete artifact');
}

export async function fetchAccessibility(lessonId: string): Promise<{
  plain_language_summary: string;
  diagram_accessibility: Array<{
    visual_id: string;
    title: string;
    visible_facts: string;
    inferred_meaning: string;
    audio_reading_text: string;
  }>;
  glossary: Array<{ term: string; plain_definition: string }>;
}> {
  const res = await fetch(`${API_BASE}/lessons/${lessonId}/accessibility`);
  if (!res.ok) throw new Error('Failed to fetch accessibility descriptions');
  return res.json();
}

export async function searchAcrossLessons(query: string): Promise<SearchResult[]> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search');
  return res.json();
}

export async function fetchJobs(): Promise<ProcessingJob[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function retryJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${id}/retry`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry job');
}

export interface ChatMessagePayload {
  messages: Array<{ role: 'user' | 'model'; content: string }>;
  systemRole?: 'academic_tutor' | 'socratic_mentor' | 'exam_prepper' | 'diagram_explainer';
  modelSpeed?: 'fast' | 'general' | 'complex';
  useGoogleSearch?: boolean;
  lessonContext?: {
    title: string;
    transcriptSummary?: string;
    keyConcepts?: string[];
  };
}

export interface ChatMessageResult {
  reply: string;
  modelUsed: string;
  groundingSources?: Array<{ title: string; uri: string }>;
  searchQueries?: string[];
}

export async function sendChatMessage(payload: ChatMessagePayload): Promise<ChatMessageResult> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to send chat message');
  }
  return res.json();
}

