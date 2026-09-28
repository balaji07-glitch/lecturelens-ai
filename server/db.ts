import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
} from '../src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'lecturelens.json');
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

export interface DatabaseSchema {
  lessons: Lesson[];
  sourceFiles: SourceFile[];
  transcriptSegments: TranscriptSegment[];
  visualEvidence: VisualEvidence[];
  concepts: Concept[];
  evidenceAlignments: EvidenceAlignment[];
  conflicts: Conflict[];
  userCorrections: UserCorrection[];
  questionAnswers: QuestionAnswer[];
  studyArtifacts: StudyArtifact[];
  processingJobs: ProcessingJob[];
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function readDb(): DatabaseSchema {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDemoData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read db, resetting to demo data:', err);
    const initial = getInitialDemoData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

export function writeDb(data: DatabaseSchema): void {
  ensureDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function resetToDemo(): DatabaseSchema {
  ensureDirectories();
  const demoData = getInitialDemoData();
  writeDb(demoData);
  return demoData;
}

export function getInitialDemoData(): DatabaseSchema {
  const lessonId = 'lesson-token-ring-101';
  const audioFileId = 'file-audio-ring-01';
  const visualFileId = 'file-diagram-ring-01';

  const demoLesson: Lesson = {
    id: lessonId,
    title: 'Computer Networks: Ring Topology & Token Passing',
    subject: 'Computer Science',
    course: 'CS 435: Computer Networks & Distributed Systems',
    instructor: 'Prof. Ananya Rao',
    lecture_date: '2026-03-24',
    description:
      'Detailed exploration of Token Ring network architecture (IEEE 802.5), deterministic media access control, token circulation mechanics, station failure modes, MAU bypass relays, and latency calculations.',
    created_at: new Date('2026-03-24T09:00:00Z').toISOString(),
    updated_at: new Date('2026-03-24T11:30:00Z').toISOString(),
  };

  const demoFiles: SourceFile[] = [
    {
      id: audioFileId,
      lesson_id: lessonId,
      original_filename: 'lecture_04_ring_topology_audio.mp3',
      stored_filename: 'lecture_04_ring_topology_audio.mp3',
      mime_type: 'audio/mp3',
      modality: 'audio',
      file_size: 14820000,
      file_url: '/demo-audio/ring_topology.mp3',
      processing_status: 'completed',
      created_at: new Date('2026-03-24T09:02:00Z').toISOString(),
    },
    {
      id: visualFileId,
      lesson_id: lessonId,
      original_filename: 'token_ring_network_diagram.jpg',
      stored_filename: 'ring_topology_diagram_1790618309172.jpg',
      mime_type: 'image/jpeg',
      modality: 'visual',
      file_size: 428000,
      file_url: '/src/assets/images/ring_topology_diagram_1790618309172.jpg',
      processing_status: 'completed',
      created_at: new Date('2026-03-24T09:03:00Z').toISOString(),
    },
  ];

  const demoTranscripts: TranscriptSegment[] = [
    {
      id: 'seg-01',
      lesson_id: lessonId,
      source_file_id: audioFileId,
      start_time: 0,
      end_time: 28,
      speaker: 'Prof. Rao',
      text: 'Good morning everyone. Today we are examining deterministic media access protocols, focusing directly on the Token Ring topology standardized under IEEE 802.5. Look up at the board diagram.',
      extraction_method: 'gemini-3.8-flash',
      confidence: 0.98,
      correction_status: 'original',
    },
    {
      id: 'seg-02',
      lesson_id: lessonId,
      source_file_id: audioFileId,
      start_time: 29,
      end_time: 68,
      speaker: 'Prof. Rao',
      text: 'Notice how all workstations—labeled Station A through Station D on our visual diagram—are wired in a closed, unidirectional loop. Data frames and the control token flow in only one direction, clockwise here.',
      extraction_method: 'gemini-3.8-flash',
      confidence: 0.97,
      correction_status: 'original',
    },
    {
      id: 'seg-03',
      lesson_id: lessonId,
      source_file_id: audioFileId,
      start_time: 69,
      end_time: 118,
      speaker: 'Prof. Rao',
      text: 'A special 3-byte frame called the Token continuously circles the ring. When Station A wants to transmit data to Station C, it must capture the free token, flip the busy bit from zero to one, and append its data packet.',
      extraction_method: 'gemini-3.8-flash',
      confidence: 0.96,
      correction_status: 'original',
    },
    {
      id: 'seg-04',
      lesson_id: lessonId,
      source_file_id: audioFileId,
      start_time: 119,
      end_time: 165,
      speaker: 'Prof. Rao',
      text: 'Station B receives the frame, inspects the destination MAC address, sees it is meant for Station C, regenerates the signal, and forwards it along. No collision can ever occur because only the token holder transmits.',
      extraction_method: 'gemini-3.8-flash',
      confidence: 0.98,
      correction_status: 'original',
    },
    {
      id: 'seg-05',
      lesson_id: lessonId,
      source_file_id: audioFileId,
      start_time: 166,
      end_time: 215,
      speaker: 'Prof. Rao',
      text: 'Now look at the textbook slide where it says: "Station C Disconnected: Entire Ring Down". Historically, a pure physical ring had a fatal single point of failure—if any cable severed, the loop broke.',
      extraction_method: 'gemini-3.8-flash',
      confidence: 0.95,
      correction_status: 'original',
    },
    {
      id: 'seg-06',
      lesson_id: lessonId,
      source_file_id: audioFileId,
      start_time: 216,
      end_time: 270,
      speaker: 'Prof. Rao',
      text: 'However, please correct this limitation in your notes! Real-world deployments use a Multistation Access Unit or MAU. The physical topology is actually a star, with an electromechanical relay that instantly bypasses any powered-down or severed station.',
      extraction_method: 'gemini-3.8-flash',
      confidence: 0.99,
      correction_status: 'original',
    },
  ];

  const demoVisuals: VisualEvidence[] = [
    {
      id: 'vis-01',
      lesson_id: lessonId,
      source_file_id: visualFileId,
      page_number: 1,
      image_region: { x: 12, y: 15, width: 76, height: 70, label: 'Circular Ring Loop' },
      ocr_text:
        'TOKEN RING NETWORK (IEEE 802.5)\nStation A (Transmitter) -> Station B (Repeater) -> Station C (Receiver) -> Station D (Monitor)\nDirection of Token: Clockwise\nToken Format: Starting Delimiter (1B) | Access Control (1B) | Ending Delimiter (1B)\nWarning Note: Single Cable Cut Disables Entire Loop',
      visual_description:
        'A technical diagram illustrating a four-node Token Ring topology. Four desktop workstations (Station A, B, C, D) are arranged symmetrically around a circular pathway with directional arrowheads showing clockwise frame transmission. A highlighted glowing 3-byte token frame is transitioning between Station A and Station B. A red callout box warns of single-cable vulnerability.',
      detected_elements: [
        'Station A (Node 1)',
        'Station B (Node 2)',
        'Station C (Node 3)',
        'Station D (Node 4)',
        'Clockwise Flow Arrows',
        'Token Frame Structure (SD, AC, ED)',
        'Vulnerability Callout Box',
      ],
      extraction_method: 'gemini-3.8-flash-vision',
      confidence: 0.96,
      processing_status: 'completed',
    },
  ];

  const demoConcepts: Concept[] = [
    {
      id: 'concept-01',
      lesson_id: lessonId,
      name: 'Deterministic Access vs Collision',
      description:
        'Unlike CSMA/CD in Ethernet where stations compete and collide, Token Ring uses a circulating authorization token ensuring maximum bounded transmission delay and zero collisions.',
      concept_type: 'protocol',
      related_evidence_ids: ['seg-03', 'seg-04', 'vis-01'],
      source_modalities: ['audio', 'visual'],
      created_at: new Date('2026-03-24T09:05:00Z').toISOString(),
    },
    {
      id: 'concept-02',
      lesson_id: lessonId,
      name: 'Token Circulation & Busy Bit',
      description:
        'A 3-byte control frame with Starting Delimiter, Access Control byte, and Ending Delimiter. The token bit in the Access Control byte indicates whether the token is free (0) or busy carrying data (1).',
      concept_type: 'core_concept',
      related_evidence_ids: ['seg-03', 'vis-01'],
      source_modalities: ['audio', 'visual'],
      created_at: new Date('2026-03-24T09:05:00Z').toISOString(),
    },
    {
      id: 'concept-03',
      lesson_id: lessonId,
      name: 'Physical Star vs Logical Ring (MAU)',
      description:
        'While logically data circulates in a ring, modern physical implementation uses a Multistation Access Unit (MAU) forming a physical star where relays automatically bypass severed nodes.',
      concept_type: 'component',
      related_evidence_ids: ['seg-05', 'seg-06', 'vis-01'],
      source_modalities: ['audio', 'visual'],
      created_at: new Date('2026-03-24T09:05:00Z').toISOString(),
    },
    {
      id: 'concept-04',
      lesson_id: lessonId,
      name: 'Single Point of Failure Vulnerability',
      description:
        'A traditional pure ring topology suffers complete failure if any single link or station cable is broken, requiring active bypass or dual-counter-rotating rings (FDDI).',
      concept_type: 'core_concept',
      related_evidence_ids: ['seg-05', 'vis-01'],
      source_modalities: ['audio', 'visual'],
      created_at: new Date('2026-03-24T09:05:00Z').toISOString(),
    },
  ];

  const demoAlignments: EvidenceAlignment[] = [
    {
      id: 'align-01',
      lesson_id: lessonId,
      source_evidence_id: 'seg-02',
      target_evidence_id: 'vis-01',
      relationship_type: 'diagram_label_matches_spoken_term',
      explanation:
        'The spoken lecture references Station A through Station D and clockwise circulation, directly matching the four labeled workstation nodes and circular clockwise arrows in the visual diagram.',
      alignment_method: 'direct_text_match',
      confidence: 0.98,
      review_status: 'confirmed',
      created_at: new Date('2026-03-24T09:06:00Z').toISOString(),
    },
    {
      id: 'align-02',
      lesson_id: lessonId,
      source_evidence_id: 'seg-03',
      target_evidence_id: 'vis-01',
      relationship_type: 'audio_explains_visual',
      explanation:
        'The instructor verbally explains how Station A captures the 3-byte token and flips the busy bit, explaining the exact token format table shown at the bottom of the diagram.',
      alignment_method: 'semantic_similarity',
      confidence: 0.94,
      review_status: 'confirmed',
      created_at: new Date('2026-03-24T09:06:00Z').toISOString(),
    },
    {
      id: 'align-03',
      lesson_id: lessonId,
      source_evidence_id: 'seg-05',
      target_evidence_id: 'vis-01',
      relationship_type: 'potential_contradiction',
      explanation:
        'The slide text asserts "Single Cable Cut Disables Entire Loop", whereas the professor explicitly clarifies in Seg-06 that practical systems use MAUs with bypass relays so single cuts do NOT bring the whole network down.',
      alignment_method: 'model_inferred',
      confidence: 0.92,
      review_status: 'confirmed',
      created_at: new Date('2026-03-24T09:06:00Z').toISOString(),
    },
  ];

  const demoConflicts: Conflict[] = [
    {
      id: 'conflict-01',
      lesson_id: lessonId,
      evidence_ids: ['seg-05', 'seg-06', 'vis-01'],
      conflict_description:
        'Slide diagram claims single cable cut disables the entire network, while spoken lecture notes that MAUs with bypass relays prevent this failure mode in real deployments.',
      audio_claim:
        'Prof. Rao: Real-world deployments use a Multistation Access Unit (MAU) with electromechanical relays that instantly bypass severed stations (03:36 - 04:30).',
      visual_claim:
        'Diagram Callout: "Warning Note: Single Cable Cut Disables Entire Loop" (Slide 1).',
      review_status: 'acknowledged',
      resolution_note:
        'Pure theoretical ring has single point of failure; practical IEEE 802.5 Token Ring uses physical star with MAU bypass relays.',
      created_at: new Date('2026-03-24T09:07:00Z').toISOString(),
    },
  ];

  const demoUserCorrections: UserCorrection[] = [];

  const demoQA: QuestionAnswer[] = [
    {
      id: 'qa-01',
      lesson_id: lessonId,
      question: 'What did the teacher say about the failure warning shown on the diagram?',
      direct_answer:
        'The teacher acknowledged that while the diagram correctly depicts a pure physical ring failing when a cable cuts, real IEEE 802.5 deployments solve this using a Multistation Access Unit (MAU) whose internal relays automatically bypass severed stations.',
      explanation:
        'During the lecture segment from 02:46 to 04:30, Prof. Rao addressed the red vulnerability callout box on the diagram. She instructed students to annotate their notes: although a theoretical ring is disabled by any cable cut, real-world systems wire stations in a physical star through an MAU, maintaining fault tolerance.',
      answer_mode: 'multimodal',
      evidence_references: [
        {
          evidence_id: 'vis-01',
          modality: 'visual',
          title: 'Diagram Warning Box',
          detail: 'Warning Note: Single Cable Cut Disables Entire Loop',
          source_name: 'token_ring_network_diagram.jpg',
          confidence: 0.96,
        },
        {
          evidence_id: 'seg-05',
          modality: 'audio',
          title: 'Audio Lecture @ 02:46',
          detail: 'Historically, a pure physical ring had a fatal single point of failure...',
          timestamp: '02:46',
          source_name: 'lecture_04_ring_topology_audio.mp3',
          confidence: 0.95,
        },
        {
          evidence_id: 'seg-06',
          modality: 'audio',
          title: 'Audio Lecture @ 03:36',
          detail: 'Real-world deployments use a Multistation Access Unit or MAU with bypass relays...',
          timestamp: '03:36',
          source_name: 'lecture_04_ring_topology_audio.mp3',
          confidence: 0.99,
        },
      ],
      related_concepts: ['Single Point of Failure Vulnerability', 'Physical Star vs Logical Ring (MAU)'],
      uncertainty_note: undefined,
      created_at: new Date('2026-03-24T09:10:00Z').toISOString(),
    },
  ];

  const demoArtifacts: StudyArtifact[] = [
    {
      id: 'art-01',
      lesson_id: lessonId,
      artifact_type: 'structured_notes',
      title: 'Token Ring Network Architecture & Media Access',
      content: `## 1. Executive Summary
Token Ring (IEEE 802.5) is a deterministic local area network protocol where stations pass a 3-byte token frame in a closed unidirectional loop. Unlike Ethernet CSMA/CD, no data packet collisions can occur.

## 2. Key Components & Visual Evidence
- **Logical Topology**: Unidirectional closed ring with clockwise signal propagation (Diagram: Station A → B → C → D).
- **Workstations**: Repeaters with a 1-bit delay that inspect destination MAC addresses.
- **Token Format**:
  - Starting Delimiter (1 Byte)
  - Access Control (1 Byte, containing Priority bits, Reservation bits, and Token/Busy bit)
  - Ending Delimiter (1 Byte)

## 3. Discrepancy & Critical Correction
- **Visual Claim**: Slide warning asserts a single severed cable brings down the entire network.
- **Spoken Clarification (Prof. Rao @ 03:36)**: In practice, networks use a **Multistation Access Unit (MAU)** forming a physical star with automatic electromechanical bypass relays.

## 4. Deterministic Performance Characteristics
- Maximum bounded packet transmission delay.
- Guaranteed bandwidth allocation via priority and reservation bits.`,
      source_evidence_ids: ['seg-01', 'seg-02', 'seg-03', 'vis-01', 'conflict-01'],
      created_at: new Date('2026-03-24T09:12:00Z').toISOString(),
      updated_at: new Date('2026-03-24T09:12:00Z').toISOString(),
    },
    {
      id: 'art-02',
      lesson_id: lessonId,
      artifact_type: 'flashcards',
      title: 'Token Ring Core Revision Flashcards',
      content: 'Interactive flashcards covering Token Ring mechanics, MAU bypass, and IEEE 802.5 standard.',
      parsed_data: {
        flashcards: [
          {
            id: 'fc-1',
            question: 'What is the standard IEEE specification for Token Ring networks?',
            answer: 'IEEE 802.5.',
            related_concept: 'Token Ring Architecture',
            source_evidence_hint: 'Spoken in segment 01 (00:00 - 00:28)',
          },
          {
            id: 'fc-2',
            question: 'How many bytes comprise a free Token frame, and what are its three fields?',
            answer: '3 bytes total: Starting Delimiter (1B), Access Control (1B), and Ending Delimiter (1B).',
            related_concept: 'Token Circulation & Busy Bit',
            source_evidence_hint: 'Visual Diagram lower table + Segment 03',
          },
          {
            id: 'fc-3',
            question: 'How do modern Token Ring networks prevent the single-cable-cut failure mode shown on slides?',
            answer:
              'They deploy Multistation Access Units (MAUs) in a physical star topology with internal relays that automatically bypass broken or inactive stations.',
            related_concept: 'Physical Star vs Logical Ring (MAU)',
            source_evidence_hint: 'Prof. Rao lecture clarification at 03:36',
          },
          {
            id: 'fc-4',
            question: 'Why are collisions impossible in a healthy Token Ring topology?',
            answer:
              'Access is deterministic; only the station currently holding the captured token is permitted to transmit data.',
            related_concept: 'Deterministic Access vs Collision',
            source_evidence_hint: 'Audio Segment 04 (01:59 - 02:45)',
          },
        ],
      },
      source_evidence_ids: ['seg-01', 'seg-03', 'seg-04', 'seg-06', 'vis-01'],
      created_at: new Date('2026-03-24T09:13:00Z').toISOString(),
      updated_at: new Date('2026-03-24T09:13:00Z').toISOString(),
    },
    {
      id: 'art-03',
      lesson_id: lessonId,
      artifact_type: 'practice_quiz',
      title: 'Practice Quiz: Token Ring & Deterministic MAC',
      content: 'Multiple-choice practice questions grounded in lecture audio and slide evidence.',
      parsed_data: {
        quiz: [
          {
            id: 'q-1',
            question: 'What action does a station take upon capturing a free token to transmit data?',
            options: [
              'Broadcasts a beacon frame to all stations',
              'Flips the token busy bit from 0 to 1 and appends its data payload',
              'Sends an RTS/CTS handshake packet to Station D',
              'Halts clockwise circulation for 10 milliseconds',
            ],
            correct_index: 1,
            explanation:
              'As explained in Audio Segment 03, the station flips the token bit in the Access Control byte from 0 (free) to 1 (busy) and appends data and destination address.',
            supporting_source: 'Audio Segment 03 (01:09 - 01:58)',
          },
          {
            id: 'q-2',
            question:
              'According to the lecture clarification, why is the slide warning ("Single Cable Cut Disables Entire Loop") misleading for practical deployments?',
            options: [
              'The cables used in Token Ring are indestructible optical glass',
              'Each station contains a backup radio transceiver',
              'MAUs wire the network as a physical star and bypass severed nodes with relays',
              'Token Ring automatically converts to Ethernet bus mode',
            ],
            correct_index: 2,
            explanation:
              'Prof. Rao explicitly noted that physical star wiring via MAUs uses electromechanical relays to automatically bypass disconnected stations.',
            supporting_source: 'Audio Segment 06 (03:36 - 04:30)',
          },
          {
            id: 'q-3',
            question: 'In the lecture diagram, which station acts as the primary receiver for Station A’s transmission?',
            options: ['Station B', 'Station C', 'Station D', 'All stations simultaneously'],
            correct_index: 1,
            explanation:
              'The diagram and transcript segment 03 explicitly specify Station A transmitting to Station C, with Station B acting as an intermediate repeater.',
            supporting_source: 'Diagram Visual Evidence & Audio Seg 03',
          },
        ],
      },
      source_evidence_ids: ['seg-03', 'seg-06', 'vis-01'],
      created_at: new Date('2026-03-24T09:14:00Z').toISOString(),
      updated_at: new Date('2026-03-24T09:14:00Z').toISOString(),
    },
  ];

  const demoJobs: ProcessingJob[] = [
    {
      id: 'job-init-01',
      lesson_id: lessonId,
      lesson_title: demoLesson.title,
      source_file_id: audioFileId,
      filename: 'lecture_04_ring_topology_audio.mp3',
      stage: 'completed',
      status: 'completed',
      progress: 100,
      started_at: new Date('2026-03-24T09:02:00Z').toISOString(),
      completed_at: new Date('2026-03-24T09:02:45Z').toISOString(),
    },
    {
      id: 'job-init-02',
      lesson_id: lessonId,
      lesson_title: demoLesson.title,
      source_file_id: visualFileId,
      filename: 'token_ring_network_diagram.jpg',
      stage: 'completed',
      status: 'completed',
      progress: 100,
      started_at: new Date('2026-03-24T09:03:00Z').toISOString(),
      completed_at: new Date('2026-03-24T09:03:30Z').toISOString(),
    },
  ];

  return {
    lessons: [demoLesson],
    sourceFiles: demoFiles,
    transcriptSegments: demoTranscripts,
    visualEvidence: demoVisuals,
    concepts: demoConcepts,
    evidenceAlignments: demoAlignments,
    conflicts: demoConflicts,
    userCorrections: demoUserCorrections,
    questionAnswers: demoQA,
    studyArtifacts: demoArtifacts,
    processingJobs: demoJobs,
  };
}
