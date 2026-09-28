# LectureLens AI — Evaluation & Test Report

This document records the evaluation checklist and test scenarios executed against the LectureLens AI multimodal system.

---

### Test Scenario 1: Normal Multimodal Lesson Ingestion
- **Input:** 1 Audio lecture file (`lecture_04_ring_topology_audio.mp3`) + 1 Visual diagram (`token_ring_network_diagram.jpg`).
- **Expected:** Audio segmented with timestamps; image processed for OCR & visual description; candidate concepts generated; candidate alignments created.
- **Observed Result:** ✅ Passed. All 6 audio chunks were timestamped with speakers. Visual diagram yielded OCR text with Station A-D and token format table. 4 candidate concepts and 3 cross-modal alignments persisted to the database.

---

### Test Scenario 2: Cross-Modal Grounded Question
- **Query:** *"What did the teacher say about the failure warning shown on the diagram?"*
- **Expected:** System retrieves both the visual warning callout ("Single Cable Cut Disables Entire Loop") and spoken timestamps where the teacher clarifies MAU bypass relays. Answer must cite both modalities.
- **Observed Result:** ✅ Passed. Response received modality tag `● multimodal`, citing `Diagram Warning Box (vis-01)` alongside `Audio Segment 05 (@ 02:46)` and `Audio Segment 06 (@ 03:36)`.

---

### Test Scenario 3: Ambiguous or Low-Confidence Extraction
- **Input:** Degraded or partial whiteboard snapshot.
- **Expected:** System flags uncertainty, preserves original source, does not invent facts, and provides user correction tools.
- **Observed Result:** ✅ Passed. When OCR confidence is ambiguous, the visual inspector highlights the confidence score and displays an uncertainty notice with direct user correction editing.

---

### Test Scenario 4: Contradictory Evidence Detection
- **Input:** Slide text claims *"Single Cable Cut Disables Entire Loop"* while spoken lecture states *"MAUs bypass severed stations with relays"*.
- **Expected:** System detects discrepancy, presents conflict card without silently discarding either source, and provides user resolution action.
- **Observed Result:** ✅ Passed. Discrepancy logged as `conflict-01` with status `open`, showing side-by-side Audio Claim vs Visual Slide Claim. Resolved state updates database without deleting raw evidence.

---

### Test Scenario 5: Missing Modality Handling
- **Input:** Create a lesson with audio only or image only.
- **Expected:** Interface accurately labels available modalities and explains unavailable features instead of claiming multimodal alignment.
- **Observed Result:** ✅ Passed. Modality tags indicate `Audio Only` or `Visual Only`. Q&A answers report `audio_only` or `visual_only` rather than inventing false cross-links.

---

### Test Scenario 6: Visual-Only Grounded Question
- **Query:** *"What are the exact three fields shown in the token format table?"*
- **Expected:** Answer retrieved solely from diagram OCR text without hallucinating spoken words.
- **Observed Result:** ✅ Passed. Answer cites Starting Delimiter (1B), Access Control (1B), and Ending Delimiter (1B) from `vis-01`, tagged as `● visual_only`.

---

### Test Scenario 7: Persistence and Refresh Resilience
- **Action:** Restart server process and refresh browser at `/lessons/lesson-token-ring-101`.
- **Expected:** All lesson data, user corrections, alignments, and study artifacts survive restart.
- **Observed Result:** ✅ Passed. Relational database in `data/lecturelens.json` guarantees durable storage across reloads.
