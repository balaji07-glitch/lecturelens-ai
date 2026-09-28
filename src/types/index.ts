export type ModalityType = 'audio' | 'visual' | 'multimodal';

export type ProcessingStatus = 
  | 'queued' 
  | 'validating' 
  | 'uploading' 
  | 'transcribing' 
  | 'extracting_text' 
  | 'analyzing_visuals' 
  | 'aligning_evidence' 
  | 'generating_artifacts' 
  | 'completed' 
  | 'failed';

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  course?: string;
  instructor?: string;
  lecture_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  stats?: {
    transcript_count: number;
    visual_count: number;
    concept_count: number;
    alignment_count: number;
    conflict_count: number;
    study_artifact_count: number;
  };
}

export interface SourceFile {
  id: string;
  lesson_id: string;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  modality: 'audio' | 'visual';
  file_size: number;
  file_url: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface TranscriptSegment {
  id: string;
  lesson_id: string;
  source_file_id: string;
  start_time: number; // in seconds
  end_time: number; // in seconds
  speaker?: string;
  text: string;
  extraction_method: 'gemini-3.8-flash' | 'gemini-3.5-transcribe' | 'whisper' | 'demo-grounded';
  confidence: number; // 0.0 - 1.0
  correction_status?: 'original' | 'edited';
  corrected_text?: string;
}

export interface VisualEvidence {
  id: string;
  lesson_id: string;
  source_file_id: string;
  page_number?: number;
  image_region?: {
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  };
  ocr_text: string;
  visual_description: string;
  detected_elements: string[];
  extraction_method: 'gemini-3.8-flash-vision' | 'tesseract-ocr' | 'demo-grounded';
  confidence: number;
  processing_status: 'completed' | 'failed' | 'uncertain';
  uncertainty_reason?: string;
  user_corrected_ocr?: string;
}

export interface Concept {
  id: string;
  lesson_id: string;
  name: string;
  description: string;
  concept_type: 'core_concept' | 'component' | 'protocol' | 'equation' | 'definition';
  related_evidence_ids: string[];
  source_modalities: ModalityType[];
  created_at: string;
}

export type AlignmentRelationshipType = 
  | 'audio_explains_visual'
  | 'diagram_label_matches_spoken_term'
  | 'equation_discussed_in_audio'
  | 'slide_heading_relates_to_transcript'
  | 'potential_contradiction'
  | 'concept_mutual_reference';

export interface EvidenceAlignment {
  id: string;
  lesson_id: string;
  source_evidence_id: string; // e.g. transcript segment id
  target_evidence_id: string; // e.g. visual evidence id
  relationship_type: AlignmentRelationshipType;
  explanation: string;
  alignment_method: 'direct_text_match' | 'semantic_similarity' | 'temporal_proximity' | 'model_inferred' | 'human_confirmed';
  confidence: number;
  review_status: 'pending' | 'confirmed' | 'rejected' | 'modified';
  created_at: string;
}

export interface Conflict {
  id: string;
  lesson_id: string;
  evidence_ids: string[];
  conflict_description: string;
  audio_claim?: string;
  visual_claim?: string;
  review_status: 'open' | 'resolved' | 'acknowledged';
  resolution_note?: string;
  created_at: string;
}

export interface UserCorrection {
  id: string;
  lesson_id: string;
  evidence_id: string;
  evidence_type: 'transcript' | 'visual_ocr' | 'visual_description' | 'alignment';
  original_value: string;
  corrected_value: string;
  explanation?: string;
  created_at: string;
}

export interface GroundedEvidenceReference {
  evidence_id: string;
  modality: 'audio' | 'visual' | 'concept';
  title: string;
  detail: string;
  timestamp?: string; // e.g. "01:24"
  source_name?: string;
  confidence?: number;
}

export interface QuestionAnswer {
  id: string;
  lesson_id: string;
  question: string;
  direct_answer: string;
  explanation: string;
  answer_mode: 'audio_only' | 'visual_only' | 'multimodal' | 'insufficient_evidence';
  evidence_references: GroundedEvidenceReference[];
  related_concepts: string[];
  uncertainty_note?: string;
  is_cached_or_fallback?: boolean;
  provider_notice?: string;
  created_at: string;
}

export type StudyArtifactType = 
  | 'structured_notes'
  | 'flashcards'
  | 'practice_quiz'
  | 'revision_summary'
  | 'concept_map';

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
  related_concept: string;
  source_evidence_hint: string;
}

export interface QuizQuestionItem {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  supporting_source: string;
}

export interface StudyArtifact {
  id: string;
  lesson_id: string;
  artifact_type: StudyArtifactType;
  title: string;
  content: string; // Markdown or JSON string
  parsed_data?: {
    flashcards?: FlashcardItem[];
    quiz?: QuizQuestionItem[];
    concept_nodes?: Array<{ id: string; label: string; type: string }>;
    concept_edges?: Array<{ source: string; target: string; label: string }>;
  };
  source_evidence_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ProcessingJob {
  id: string;
  lesson_id: string;
  lesson_title?: string;
  source_file_id?: string;
  filename?: string;
  stage: ProcessingStatus;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number; // 0 - 100
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface SearchResult {
  id: string;
  lesson_id: string;
  lesson_title: string;
  modality: 'audio' | 'visual' | 'concept' | 'study_artifact';
  title: string;
  snippet: string;
  match_type: 'transcript' | 'ocr' | 'visual_description' | 'concept' | 'study_artifact';
  timestamp?: string;
  created_at: string;
}
