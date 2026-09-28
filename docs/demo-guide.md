# LectureLens AI — Judging Demonstration Guide

Follow this step-by-step walkthrough to present **LectureLens AI** during judging sessions.

---

### Step 1: Landing Page & Core Mission (00:00 - 00:30)
- Navigate to `/`
- Highlight the **Glassmorphism design aesthetic**: Deep obsidian canvas (`#080B16`), violet and cyan ambient lighting, frosted glass panels.
- Explain the core problem: Transcripts miss visual diagrams; slide OCR misses spoken verbal clarifications. LectureLens AI bridges both modalities.
- Click **"Open Workspace"**.

### Step 2: Dashboard & Aggregated Evidence (00:30 - 01:00)
- Shows active lessons, total audio segments, visual diagrams, and verified alignments.
- Click on the pre-seeded **"Computer Networks: Ring Topology & Token Passing"** lecture card.

### Step 3: Audio Transcription & Timestamp Scrubbing (01:00 - 01:45)
- Open the **Transcript** tab.
- Click **Play** on the audio player; notice how the current spoken segment highlights in real time.
- Click segment **01:09 - 01:58** (Prof. Rao explaining Station A flipping the busy bit); notice the scrubber automatically seeks to that exact moment.
- Click the pencil icon to demonstrate **Inline User Correction**; save an edit and show that it tags the segment as `User Corrected` with an immutable audit log.

### Step 4: Visual Diagram & Verbatim OCR (01:45 - 02:30)
- Switch to the **Visuals** tab.
- View the Token Ring technical diagram.
- Toggle **"Regions Visible"** to see spatial bounding coordinates.
- Switch between **Extracted OCR Text**, **Objective Visual Description**, and **Detected Components** (Station A-D, Clockwise arrows, Token frame format).

### Step 5: Evidence Map & Discrepancy Detection (02:30 - 03:15)
- Click the **Evidence Map** tab.
- Filter by **All**, **Audio**, **Visual**, or **Concepts**.
- Highlight the red **Discrepancy / Conflict** node:
  * *Slide Claim:* "Single Cable Cut Disables Entire Loop"
  * *Spoken Clarification:* Prof. Rao at 03:36 explains that practical IEEE 802.5 networks use Multistation Access Units (MAUs) with bypass relays to prevent total failure.

### Step 6: Strictly Grounded Q&A (03:15 - 04:00)
- In the right-hand **Grounded Ask AI** panel, click one of the quick inquiry prompts:
  * *"What did the teacher say about the failure warning shown on the diagram?"*
- Observe the synthesized answer:
  * Direct Answer
  * Grounded Synthesis
  * Traceable Evidence References with clickable timestamps (`Audio @ 02:46`, `Audio @ 03:36`, `Diagram Warning Box`)
  * Distinct modality tag: `● multimodal`.

### Step 7: Study Pack Generation (04:00 - 04:45)
- Switch to the **Study Pack** tab.
- Click on **Token Ring Core Revision Flashcards**: Click a card to flip it and reveal the grounded answer and source evidence hint.
- Click on **Practice Quiz**: Select an option, submit, and observe instant validation with supporting lecture evidence.
- Click **Download** to export the structured notes in clean Markdown format.

### Step 8: Accessibility Studio (04:45 - 05:15)
- Switch to the **Accessibility** tab.
- Demonstrate the **Text Size Scaler** (`A`, `A+`, `A++`).
- Click **"Read Aloud"** to hear browser text-to-speech synthesize the plain-language explanation.
- Review the Diagram Accessibility card: notice the clear, explicit distinction between **1. Literal Visible Facts** and **2. Inferred Conceptual Meaning**.

### Step 9: Creating a Fresh Lecture (05:15 - 05:45)
- Click **"+ Create Lesson"** in the top navigation bar.
- Step 1: Input a new course title and subject.
- Step 2: Drag and drop an audio or image file (supports MP3, WAV, PNG, JPG).
- Step 3: Review detected modalities and click **"Start Multimodal Processing"**.
- Watch the live job tracker process the lecture and persist all records to the local database!
