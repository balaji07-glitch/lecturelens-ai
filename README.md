# LectureLens AI

> **"Every Lecture. Every Detail. One Intelligent Study Space."**
>
> *YUVA MEGATHON 2026 — Domain 03: Multimodal AI*

LectureLens AI transforms classroom lectures into searchable, understandable, accessible, and evidence-linked learning experiences by connecting spoken explanations, presentation slides, whiteboard photographs, diagrams, equations, and student notes.

---

## 🌟 Core Differentiator: Evidence-Linked Multimodal Understanding

Traditional AI educational tools either transcribe audio alone (missing visual board diagrams and equations) or run OCR alone (missing the instructor's spoken nuance and corrections).

**LectureLens AI** establishes an explicit, persistent relational link between:
1. **Timestamped Spoken Audio Chunks** (Professors' verbal examples & corrections)
2. **Visual Slide & Diagram Evidence** (Verbatim OCR text & spatial bounding regions)
3. **Core Academic Concepts** (Ontology & relationship mapping)
4. **Discrepancy / Contradiction Detection** (Flags when spoken words correct outdated slide formulas)
5. **Strictly Grounded Q&A** (Answers cite verified timestamps and diagram parts, or report insufficient evidence)

---

## 🎨 Glassmorphism Design System

The application strictly follows a dark Glassmorphism aesthetic:
- **Canvas Neutrals**: Dark Obsidian (`#080B16`), Deep Navy (`#0D1224`), Slate (`#11172B`)
- **Vibrant Accents**: Primary Violet (`#8B5CF6`), Electric Blue (`#6366F1`), Cyan (`#22D3EE`), Lavender (`#C4B5FD`)
- **Frosted Surfaces**: Translucent `backdrop-filter: blur(16px)` panels with hairline borders (`rgba(255, 255, 255, 0.08)`) and ambient radial gradient lighting.

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js $\ge$ 18.0.0
- npm $\ge$ 9.0.0
- Optional: `GEMINI_API_KEY` for live AI generation (interactive demo mode with deterministic provenance is enabled by default if no key is supplied)

### Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional Gemini API key)
cp .env.example .env

# 3. Start development server (Express + Vite on Port 3000)
npm run dev

# 4. Build for production
npm run build
npm start
```

Open your browser to `http://localhost:3000`.

---

## 📁 Architecture Overview

```
├── server.ts                 # Full-stack Express server with Vite middleware & REST endpoints
├── server/
│   ├── ai.ts                 # Google GenAI (gemini-3.8-flash) multimodal extraction & grounding
│   └── db.ts                 # Persistent JSON relational database & pre-seeded demo lesson
├── src/
│   ├── types/index.ts        # Common schemas (Lesson, Evidence, Concept, Alignment, Conflict)
│   ├── services/api.ts       # Frontend REST API client
│   ├── components/
│   │   ├── layout/           # Navbar, Footer
│   │   ├── evidence/         # AudioWaveformPlayer, VisualInspector, EvidenceGraph
│   │   ├── qa/               # GroundedChat with citation links
│   │   ├── study/            # StudyPackView (Flashcards, Quiz, Markdown Notes)
│   │   └── accessibility/    # AccessibilityView (Plain English, TTS Audio, Diagram Alt)
│   └── pages/
│       ├── LandingPage.tsx   # Glassmorphism hero & 3-stage pipeline
│       ├── DashboardPage.tsx # Lesson catalog & stats
│       ├── CreateLessonPage.tsx # 3-step file ingestion wizard
│       ├── LessonWorkspacePage.tsx # 3-column interactive workspace
│       ├── EvidenceViewerPage.tsx # Synchronized audio/visual inspector
│       ├── CrossModalSearchPage.tsx # Global cross-modal search
│       ├── ProcessingJobsPage.tsx # Worker queue & status
│       └── SettingsPage.tsx  # AI provider health & demo re-seed
└── docs/
    ├── architecture.md       # Pipeline data flow & data models
    ├── evaluation.md         # 6 documented test scenarios & results
    └── demo-guide.md         # Step-by-step judge presentation script
```
