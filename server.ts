import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import {
  readDb,
  writeDb,
  resetToDemo,
  type DatabaseSchema,
} from './server/db.ts';
import {
  isGeminiConfigured,
  transcribeAudio,
  analyzeVisual,
  extractConceptsFromEvidence,
  alignMultimodalEvidence,
  answerQuestionGrounded,
  generateCachedVerificationAnswer,
  generateStudyArtifact,
  generateAccessibilityData,
  executeMultiTurnChat,
} from './server/ai.ts';
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
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Configure multer file upload
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/x-m4a',
      'audio/m4a',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown',
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.mimetype.startsWith('audio/') ||
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('text/') ||
      file.originalname.endsWith('.txt') ||
      file.originalname.endsWith('.md')
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static directory for uploaded files
  app.use('/uploads', express.static(uploadsDir));

  // Initialize DB
  readDb();

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'LectureLens AI Multimodal Backend',
      version: '1.0.0',
      database: 'connected',
      storage: 'ready',
    });
  });

  // Provider Status
  app.get('/api/provider-status', (_req, res) => {
    const configured = isGeminiConfigured();
    res.json({
      configured,
      provider: 'Google Gemini',
      model: 'gemini-3.8-flash',
      capabilities: [
        'Multimodal Audio Transcription (Timestamped)',
        'Slide & Whiteboard OCR Text Extraction',
        'Visual Diagram & Equation Semantic Analysis',
        'Cross-Modal Evidence Alignment & Conflict Detection',
        'Strictly Grounded Q&A with Modality References',
        'Automated Study Packs & Accessibility Studio',
      ],
      notice: configured
        ? 'Gemini Multimodal API active.'
        : 'API key not configured in environment. Interactive demo and local heuristics active with traceable provenance.',
    });
  });

  // Re-seed Demo Lesson
  app.post('/api/lessons/seed-demo', (_req, res) => {
    const demo = resetToDemo();
    res.json({ message: 'Demo lesson reset successfully', lesson: demo.lessons[0] });
  });

  // Lessons List
  app.get('/api/lessons', (_req, res) => {
    const db = readDb();
    // Compute stats for each lesson
    const enriched = db.lessons.map((lesson) => {
      const transcript_count = db.transcriptSegments.filter((t) => t.lesson_id === lesson.id).length;
      const visual_count = db.visualEvidence.filter((v) => v.lesson_id === lesson.id).length;
      const concept_count = db.concepts.filter((c) => c.lesson_id === lesson.id).length;
      const alignment_count = db.evidenceAlignments.filter((a) => a.lesson_id === lesson.id).length;
      const conflict_count = db.conflicts.filter((cf) => cf.lesson_id === lesson.id).length;
      const study_artifact_count = db.studyArtifacts.filter((s) => s.lesson_id === lesson.id).length;
      return {
        ...lesson,
        stats: {
          transcript_count,
          visual_count,
          concept_count,
          alignment_count,
          conflict_count,
          study_artifact_count,
        },
      };
    });
    res.json(enriched);
  });

  // Create Lesson
  app.post('/api/lessons', (req, res) => {
    const { title, subject, course, instructor, lecture_date, description } = req.body;
    if (!title || !subject) {
      return res.status(400).json({ error: 'Title and subject are required' });
    }

    const newLesson: Lesson = {
      id: 'lesson-' + Date.now(),
      title,
      subject,
      course: course || '',
      instructor: instructor || '',
      lecture_date: lecture_date || new Date().toISOString().split('T')[0],
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const db = readDb();
    db.lessons.unshift(newLesson);
    writeDb(db);

    res.status(201).json(newLesson);
  });

  // Get Single Lesson
  app.get('/api/lessons/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const lesson = db.lessons.find((l) => l.id === id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const files = db.sourceFiles.filter((f) => f.lesson_id === id);
    const transcripts = db.transcriptSegments.filter((t) => t.lesson_id === id);
    const visuals = db.visualEvidence.filter((v) => v.lesson_id === id);
    const concepts = db.concepts.filter((c) => c.lesson_id === id);
    const alignments = db.evidenceAlignments.filter((a) => a.lesson_id === id);
    const conflicts = db.conflicts.filter((cf) => cf.lesson_id === id);
    const artifacts = db.studyArtifacts.filter((s) => s.lesson_id === id);

    res.json({
      lesson: {
        ...lesson,
        stats: {
          transcript_count: transcripts.length,
          visual_count: visuals.length,
          concept_count: concepts.length,
          alignment_count: alignments.length,
          conflict_count: conflicts.length,
          study_artifact_count: artifacts.length,
        },
      },
      files,
      transcript_count: transcripts.length,
      visual_count: visuals.length,
      concept_count: concepts.length,
      alignment_count: alignments.length,
      conflict_count: conflicts.length,
    });
  });

  // Delete Lesson
  app.delete('/api/lessons/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.lessons = db.lessons.filter((l) => l.id !== id);
    db.sourceFiles = db.sourceFiles.filter((f) => f.lesson_id !== id);
    db.transcriptSegments = db.transcriptSegments.filter((t) => t.lesson_id !== id);
    db.visualEvidence = db.visualEvidence.filter((v) => v.lesson_id !== id);
    db.concepts = db.concepts.filter((c) => c.lesson_id !== id);
    db.evidenceAlignments = db.evidenceAlignments.filter((a) => a.lesson_id !== id);
    db.conflicts = db.conflicts.filter((cf) => cf.lesson_id !== id);
    db.userCorrections = db.userCorrections.filter((uc) => uc.lesson_id !== id);
    db.questionAnswers = db.questionAnswers.filter((qa) => qa.lesson_id !== id);
    db.studyArtifacts = db.studyArtifacts.filter((sa) => sa.lesson_id !== id);
    db.processingJobs = db.processingJobs.filter((pj) => pj.lesson_id !== id);
    writeDb(db);
    res.json({ message: 'Lesson deleted successfully' });
  });

  // Upload Files to Lesson
  app.post('/api/lessons/:id/files', upload.array('files', 10), (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const lesson = db.lessons.find((l) => l.id === id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const uploadedFiles = req.files as Express.Multer.File[];
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const createdFiles: SourceFile[] = [];

    for (const f of uploadedFiles) {
      const isAudio = f.mimetype.startsWith('audio/');
      const fileId = 'file-' + Date.now() + '-' + Math.round(Math.random() * 1e4);
      const newSourceFile: SourceFile = {
        id: fileId,
        lesson_id: id,
        original_filename: f.originalname,
        stored_filename: f.filename,
        mime_type: f.mimetype,
        modality: isAudio ? 'audio' : 'visual',
        file_size: f.size,
        file_url: `/uploads/${f.filename}`,
        processing_status: 'pending',
        created_at: new Date().toISOString(),
      };

      db.sourceFiles.push(newSourceFile);
      createdFiles.push(newSourceFile);

      // Create a processing job for each file
      const job: ProcessingJob = {
        id: 'job-' + Date.now() + '-' + Math.round(Math.random() * 1e4),
        lesson_id: id,
        lesson_title: lesson.title,
        source_file_id: fileId,
        filename: f.originalname,
        stage: 'queued',
        status: 'queued',
        progress: 0,
        started_at: new Date().toISOString(),
      };
      db.processingJobs.unshift(job);
    }

    lesson.updated_at = new Date().toISOString();
    writeDb(db);

    res.status(201).json({ files: createdFiles });
  });

  // Get Files for Lesson
  app.get('/api/lessons/:id/files', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const files = db.sourceFiles.filter((f) => f.lesson_id === id);
    res.json(files);
  });

  // Delete Source File
  app.delete('/api/files/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const file = db.sourceFiles.find((f) => f.id === id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Try deleting physical file
    const filePath = path.join(uploadsDir, file.stored_filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.error('File unlink error:', e);
      }
    }

    db.sourceFiles = db.sourceFiles.filter((f) => f.id !== id);
    db.transcriptSegments = db.transcriptSegments.filter((t) => t.source_file_id !== id);
    db.visualEvidence = db.visualEvidence.filter((v) => v.source_file_id !== id);
    writeDb(db);

    res.json({ message: 'File deleted' });
  });

  // Trigger Multimodal Processing Pipeline
  app.post('/api/lessons/:id/process', async (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const lesson = db.lessons.find((l) => l.id === id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const files = db.sourceFiles.filter((f) => f.lesson_id === id);
    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded to process' });
    }

    // Start background processing pipeline
    res.json({ message: 'Multimodal processing pipeline initiated', lesson_id: id });

    // Execute stages sequentially
    (async () => {
      try {
        const audioFiles = files.filter((f) => f.modality === 'audio');
        const visualFiles = files.filter((f) => f.modality === 'visual');

        // Stage 1: Transcribe Audio Files
        for (const af of audioFiles) {
          af.processing_status = 'processing';
          const job = db.processingJobs.find((j) => j.source_file_id === af.id);
          if (job) {
            job.stage = 'transcribing';
            job.status = 'running';
            job.progress = 25;
          }
          writeDb(db);

          const filePath = path.join(uploadsDir, af.stored_filename);
          let fileBuffer = Buffer.from('');
          if (fs.existsSync(filePath)) {
            fileBuffer = fs.readFileSync(filePath);
          }

          const segments = await transcribeAudio(fileBuffer, af.mime_type, af.original_filename);

          // Remove old segments for this file
          db.transcriptSegments = db.transcriptSegments.filter((t) => t.source_file_id !== af.id);

          segments.forEach((seg, idx) => {
            const segId = `seg-${af.id}-${idx + 1}`;
            db.transcriptSegments.push({
              id: segId,
              lesson_id: id,
              source_file_id: af.id,
              start_time: seg.start_time,
              end_time: seg.end_time,
              speaker: seg.speaker,
              text: seg.text,
              extraction_method: isGeminiConfigured() ? 'gemini-3.8-flash' : 'demo-grounded',
              confidence: seg.confidence,
              correction_status: 'original',
            });
          });

          af.processing_status = 'completed';
          if (job) {
            job.stage = 'transcribing';
            job.progress = 50;
          }
          writeDb(db);
        }

        // Stage 2: Visual OCR & Semantic Analysis
        for (const vf of visualFiles) {
          vf.processing_status = 'processing';
          const job = db.processingJobs.find((j) => j.source_file_id === vf.id);
          if (job) {
            job.stage = 'analyzing_visuals';
            job.status = 'running';
            job.progress = 50;
          }
          writeDb(db);

          const filePath = path.join(uploadsDir, vf.stored_filename);
          let fileBuffer = Buffer.from('');
          if (fs.existsSync(filePath)) {
            fileBuffer = fs.readFileSync(filePath);
          }

          const visualData = await analyzeVisual(fileBuffer, vf.mime_type, vf.original_filename);

          // Remove old visual evidence for this file
          db.visualEvidence = db.visualEvidence.filter((v) => v.source_file_id !== vf.id);

          db.visualEvidence.push({
            id: `vis-${vf.id}`,
            lesson_id: id,
            source_file_id: vf.id,
            page_number: 1,
            ocr_text: visualData.ocr_text,
            visual_description: visualData.visual_description,
            detected_elements: visualData.detected_elements,
            extraction_method: isGeminiConfigured() ? 'gemini-3.8-flash-vision' : 'demo-grounded',
            confidence: visualData.confidence,
            processing_status: 'completed',
            image_region: visualData.region,
          });

          vf.processing_status = 'completed';
          writeDb(db);
        }

        // Stage 3: Concept Extraction
        const currentTranscripts = db.transcriptSegments.filter((t) => t.lesson_id === id);
        const currentVisuals = db.visualEvidence.filter((v) => v.lesson_id === id);

        const extractedConcepts = await extractConceptsFromEvidence(currentTranscripts, currentVisuals);

        if (extractedConcepts.length > 0) {
          // Replace or append
          db.concepts = db.concepts.filter((c) => c.lesson_id !== id);
          extractedConcepts.forEach((ec, idx) => {
            db.concepts.push({
              id: `concept-${id}-${idx + 1}`,
              lesson_id: id,
              name: ec.name,
              description: ec.description,
              concept_type: ec.concept_type,
              related_evidence_ids: ec.related_evidence_ids,
              source_modalities: ec.source_modalities as any,
              created_at: new Date().toISOString(),
            });
          });
          writeDb(db);
        }

        // Stage 4: Multimodal Evidence Alignment & Conflict Detection
        const currentConcepts = db.concepts.filter((c) => c.lesson_id === id);
        const alignmentResult = await alignMultimodalEvidence(
          currentTranscripts,
          currentVisuals,
          currentConcepts
        );

        if (alignmentResult.alignments.length > 0) {
          db.evidenceAlignments = db.evidenceAlignments.filter((a) => a.lesson_id !== id);
          alignmentResult.alignments.forEach((al, idx) => {
            db.evidenceAlignments.push({
              id: `align-${id}-${idx + 1}`,
              lesson_id: id,
              source_evidence_id: al.source_evidence_id,
              target_evidence_id: al.target_evidence_id,
              relationship_type: al.relationship_type,
              explanation: al.explanation,
              alignment_method: al.alignment_method,
              confidence: al.confidence,
              review_status: 'pending',
              created_at: new Date().toISOString(),
            });
          });
        }

        if (alignmentResult.conflicts.length > 0) {
          db.conflicts = db.conflicts.filter((c) => c.lesson_id !== id);
          alignmentResult.conflicts.forEach((cf, idx) => {
            db.conflicts.push({
              id: `conflict-${id}-${idx + 1}`,
              lesson_id: id,
              evidence_ids: cf.evidence_ids,
              conflict_description: cf.conflict_description,
              audio_claim: cf.audio_claim,
              visual_claim: cf.visual_claim,
              review_status: 'open',
              created_at: new Date().toISOString(),
            });
          });
        }

        // Mark all jobs for this lesson as completed
        db.processingJobs.forEach((j) => {
          if (j.lesson_id === id) {
            j.stage = 'completed';
            j.status = 'completed';
            j.progress = 100;
            j.completed_at = new Date().toISOString();
          }
        });

        lesson.updated_at = new Date().toISOString();
        writeDb(db);
        console.log(`Pipeline completed successfully for lesson ${id}`);
      } catch (err: any) {
        console.error('Processing pipeline error:', err);
        db.processingJobs.forEach((j) => {
          if (j.lesson_id === id && j.status !== 'completed') {
            j.status = 'failed';
            j.error_message = err.message || 'Unknown processing error';
          }
        });
        writeDb(db);
      }
    })();
  });

  // Transcript Segments
  app.get('/api/lessons/:id/transcript', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const segments = db.transcriptSegments.filter((t) => t.lesson_id === id);
    res.json(segments);
  });

  // Visual Evidence
  app.get('/api/lessons/:id/visual-evidence', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const visuals = db.visualEvidence.filter((v) => v.lesson_id === id);
    res.json(visuals);
  });

  // Concepts
  app.get('/api/lessons/:id/concepts', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const concepts = db.concepts.filter((c) => c.lesson_id === id);
    res.json(concepts);
  });

  // Evidence Alignments
  app.get('/api/lessons/:id/alignments', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const alignments = db.evidenceAlignments.filter((a) => a.lesson_id === id);
    res.json(alignments);
  });

  // Evidence Map Graph Data
  app.get('/api/lessons/:id/evidence-map', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const transcripts = db.transcriptSegments.filter((t) => t.lesson_id === id);
    const visuals = db.visualEvidence.filter((v) => v.lesson_id === id);
    const concepts = db.concepts.filter((c) => c.lesson_id === id);
    const alignments = db.evidenceAlignments.filter((a) => a.lesson_id === id);
    const conflicts = db.conflicts.filter((c) => c.lesson_id === id);

    const nodes: Array<{ id: string; label: string; type: string; details: any }> = [];
    const edges: Array<{ id: string; source: string; target: string; label: string; type: string; confidence: number }> = [];

    transcripts.forEach((t) => {
      const min = Math.floor(t.start_time / 60);
      const sec = Math.floor(t.start_time % 60);
      nodes.push({
        id: t.id,
        label: `Audio [${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}]`,
        type: 'audio',
        details: t,
      });
    });

    visuals.forEach((v, idx) => {
      nodes.push({
        id: v.id,
        label: `Visual Source #${idx + 1}`,
        type: 'visual',
        details: v,
      });
    });

    concepts.forEach((c) => {
      nodes.push({
        id: c.id,
        label: c.name,
        type: 'concept',
        details: c,
      });
    });

    alignments.forEach((a, idx) => {
      edges.push({
        id: a.id || `edge-${idx}`,
        source: a.source_evidence_id,
        target: a.target_evidence_id,
        label: a.relationship_type.replace(/_/g, ' '),
        type: a.relationship_type,
        confidence: a.confidence,
      });
    });

    conflicts.forEach((cf, idx) => {
      if (cf.evidence_ids.length >= 2) {
        edges.push({
          id: `conflict-edge-${idx}`,
          source: cf.evidence_ids[0],
          target: cf.evidence_ids[1],
          label: 'conflict / discrepancy',
          type: 'potential_contradiction',
          confidence: 0.99,
        });
      }
    });

    res.json({ nodes, edges });
  });

  // Conflicts
  app.get('/api/lessons/:id/conflicts', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const conflicts = db.conflicts.filter((c) => c.lesson_id === id);
    res.json(conflicts);
  });

  // Resolve Conflict
  app.post('/api/conflicts/:id/resolve', (req, res) => {
    const { id } = req.params;
    const { resolution_note } = req.body;
    const db = readDb();
    const conflict = db.conflicts.find((c) => c.id === id);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }

    conflict.review_status = 'resolved';
    conflict.resolution_note = resolution_note || 'Resolved by user review.';
    writeDb(db);

    res.json(conflict);
  });

  // Review Alignment
  app.post('/api/alignments/:id/review', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed' | 'rejected'
    const db = readDb();
    const alignment = db.evidenceAlignments.find((a) => a.id === id);
    if (!alignment) {
      return res.status(404).json({ error: 'Alignment not found' });
    }

    alignment.review_status = status || 'confirmed';
    if (status === 'confirmed') {
      alignment.alignment_method = 'human_confirmed';
    }
    writeDb(db);

    res.json(alignment);
  });

  // User Corrections on Evidence
  app.post('/api/evidence/:id/corrections', (req, res) => {
    const { id } = req.params;
    const { evidence_type, corrected_value, explanation, lesson_id } = req.body;
    const db = readDb();

    let original_value = '';

    if (evidence_type === 'transcript') {
      const seg = db.transcriptSegments.find((t) => t.id === id);
      if (seg) {
        original_value = seg.text;
        seg.text = corrected_value;
        seg.corrected_text = corrected_value;
        seg.correction_status = 'edited';
      }
    } else if (evidence_type === 'visual_ocr') {
      const vis = db.visualEvidence.find((v) => v.id === id);
      if (vis) {
        original_value = vis.ocr_text;
        vis.ocr_text = corrected_value;
        vis.user_corrected_ocr = corrected_value;
      }
    }

    const correction: UserCorrection = {
      id: 'corr-' + Date.now(),
      lesson_id: lesson_id || 'unknown',
      evidence_id: id,
      evidence_type: evidence_type || 'transcript',
      original_value,
      corrected_value,
      explanation: explanation || '',
      created_at: new Date().toISOString(),
    };

    db.userCorrections.push(correction);
    writeDb(db);

    res.status(201).json(correction);
  });

  // Get User Corrections for a Lesson
  app.get('/api/lessons/:id/corrections', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const corrections = db.userCorrections.filter((c) => c.lesson_id === id);
    res.json(corrections);
  });

  // Grounded Ask AI
  app.post('/api/lessons/:id/ask', async (req, res) => {
    const { id } = req.params;
    const { question } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question cannot be empty' });
    }

    const db = readDb();
    const lesson = db.lessons.find((l) => l.id === id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const transcripts = db.transcriptSegments.filter((t) => t.lesson_id === id);
    const visuals = db.visualEvidence.filter((v) => v.lesson_id === id);
    const alignments = db.evidenceAlignments.filter((a) => a.lesson_id === id);
    const concepts = db.concepts.filter((c) => c.lesson_id === id);

    try {
      const answer = await answerQuestionGrounded(
        question.trim(),
        lesson.title,
        transcripts,
        visuals,
        alignments,
        concepts
      );

      db.questionAnswers.unshift(answer);
      writeDb(db);

      res.json(answer);
    } catch (err: any) {
      console.warn('Live grounded ask error in route, engaging cached verification fallback:', err?.message || err);
      const fallbackAnswer = generateCachedVerificationAnswer(
        question.trim(),
        lesson.title,
        transcripts,
        visuals,
        alignments,
        concepts
      );

      db.questionAnswers.unshift(fallbackAnswer);
      writeDb(db);

      res.json(fallbackAnswer);
    }
  });

  // Get Answers History for Lesson
  app.get('/api/lessons/:id/answers', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const answers = db.questionAnswers.filter((qa) => qa.lesson_id === id);
    res.json(answers);
  });

  // Multi-Turn Gemini Chatbot with Persona Roles and Google Search Grounding
  app.post('/api/chat', async (req, res) => {
    const { messages, systemRole, modelSpeed, useGoogleSearch, lessonContext } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    try {
      const response = await executeMultiTurnChat({
        messages,
        systemRole,
        modelSpeed,
        useGoogleSearch,
        lessonContext,
      });
      res.json(response);
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      res.status(500).json({ error: err.message || 'Chat generation failed' });
    }
  });

  // Generate Study Artifacts
  app.post('/api/lessons/:id/study-artifacts', async (req, res) => {
    const { id } = req.params;
    const { artifact_type } = req.body;
    const db = readDb();
    const lesson = db.lessons.find((l) => l.id === id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const transcripts = db.transcriptSegments.filter((t) => t.lesson_id === id);
    const visuals = db.visualEvidence.filter((v) => v.lesson_id === id);
    const concepts = db.concepts.filter((c) => c.lesson_id === id);

    try {
      const generated = await generateStudyArtifact(
        artifact_type || 'structured_notes',
        lesson.title,
        transcripts,
        visuals,
        concepts
      );

      const artifact: StudyArtifact = {
        id: 'art-' + Date.now(),
        lesson_id: id,
        artifact_type: artifact_type || 'structured_notes',
        title: generated.title,
        content: generated.content,
        parsed_data: generated.parsed_data,
        source_evidence_ids: generated.source_evidence_ids,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.studyArtifacts.push(artifact);
      writeDb(db);

      res.status(201).json(artifact);
    } catch (err: any) {
      console.error('Study artifact generation error:', err);
      res.status(500).json({ error: 'Failed to generate study artifact' });
    }
  });

  // Get Study Artifacts
  app.get('/api/lessons/:id/study-artifacts', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const artifacts = db.studyArtifacts.filter((s) => s.lesson_id === id);
    res.json(artifacts);
  });

  // Update Study Artifact
  app.patch('/api/study-artifacts/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const db = readDb();
    const artifact = db.studyArtifacts.find((s) => s.id === id);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    if (title) artifact.title = title;
    if (content) artifact.content = content;
    artifact.updated_at = new Date().toISOString();
    writeDb(db);

    res.json(artifact);
  });

  // Delete Study Artifact
  app.delete('/api/study-artifacts/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.studyArtifacts = db.studyArtifacts.filter((s) => s.id !== id);
    writeDb(db);
    res.json({ message: 'Artifact deleted' });
  });

  // Accessibility Studio Data
  app.get('/api/lessons/:id/accessibility', async (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const lesson = db.lessons.find((l) => l.id === id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const visuals = db.visualEvidence.filter((v) => v.lesson_id === id);
    const transcripts = db.transcriptSegments.filter((t) => t.lesson_id === id);

    try {
      const accessibility = await generateAccessibilityData(lesson.title, visuals, transcripts);
      res.json(accessibility);
    } catch (err: any) {
      console.error('Accessibility error:', err);
      res.status(500).json({ error: 'Failed to fetch accessibility descriptions' });
    }
  });

  // Cross-Modal Search
  app.get('/api/search', (req, res) => {
    const q = ((req.query.q as string) || '').toLowerCase().trim();
    if (!q) {
      return res.json([]);
    }

    const db = readDb();
    const results: SearchResult[] = [];

    // Search transcripts
    db.transcriptSegments.forEach((t) => {
      if (t.text.toLowerCase().includes(q)) {
        const lesson = db.lessons.find((l) => l.id === t.lesson_id);
        const min = Math.floor(t.start_time / 60);
        const sec = Math.floor(t.start_time % 60);
        results.push({
          id: t.id,
          lesson_id: t.lesson_id,
          lesson_title: lesson?.title || 'Unknown Lesson',
          modality: 'audio',
          title: `Spoken Segment @ ${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
          snippet: t.text,
          match_type: 'transcript',
          timestamp: `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`,
          created_at: lesson?.created_at || new Date().toISOString(),
        });
      }
    });

    // Search Visuals OCR & Descriptions
    db.visualEvidence.forEach((v) => {
      if (
        v.ocr_text.toLowerCase().includes(q) ||
        v.visual_description.toLowerCase().includes(q) ||
        v.detected_elements.some((el) => el.toLowerCase().includes(q))
      ) {
        const lesson = db.lessons.find((l) => l.id === v.lesson_id);
        results.push({
          id: v.id,
          lesson_id: v.lesson_id,
          lesson_title: lesson?.title || 'Unknown Lesson',
          modality: 'visual',
          title: `Visual Evidence: Slide / Diagram`,
          snippet: v.ocr_text.slice(0, 160) + '...',
          match_type: 'ocr',
          created_at: lesson?.created_at || new Date().toISOString(),
        });
      }
    });

    // Search Concepts
    db.concepts.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) {
        const lesson = db.lessons.find((l) => l.id === c.lesson_id);
        results.push({
          id: c.id,
          lesson_id: c.lesson_id,
          lesson_title: lesson?.title || 'Unknown Lesson',
          modality: 'concept',
          title: `Concept: ${c.name}`,
          snippet: c.description,
          match_type: 'concept',
          created_at: c.created_at,
        });
      }
    });

    // Search Study Artifacts
    db.studyArtifacts.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)) {
        const lesson = db.lessons.find((l) => l.id === s.lesson_id);
        results.push({
          id: s.id,
          lesson_id: s.lesson_id,
          lesson_title: lesson?.title || 'Unknown Lesson',
          modality: 'study_artifact',
          title: `Study Pack: ${s.title}`,
          snippet: s.content.slice(0, 160) + '...',
          match_type: 'study_artifact',
          created_at: s.created_at,
        });
      }
    });

    res.json(results);
  });

  // Processing Jobs
  app.get('/api/jobs', (_req, res) => {
    const db = readDb();
    res.json(db.processingJobs);
  });

  // Retry Job
  app.post('/api/jobs/:id/retry', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const job = db.processingJobs.find((j) => j.id === id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    job.status = 'queued';
    job.progress = 0;
    job.error_message = undefined;
    job.started_at = new Date().toISOString();
    writeDb(db);

    res.json(job);
  });

  // -------------------------------------------------------------
  // Frontend Mounting
  // -------------------------------------------------------------
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`LectureLens AI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
