import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileAudio,
  FileImage,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { createLesson, uploadLessonFiles, triggerProcessing } from '../services/api.ts';
import { MultimodalUploadZone } from '../components/upload/MultimodalUploadZone.tsx';

export const CreateLessonPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [course, setCourse] = useState('');
  const [instructor, setInstructor] = useState('');
  const [lectureDate, setLectureDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Step 2 Files
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    setErrorMsg(null);
    const validFiles: File[] = [];

    newFiles.forEach((file) => {
      const isAudio =
        file.type.startsWith('audio/') ||
        ['.mp3', '.wav', '.m4a', '.webm'].some((ext) => file.name.toLowerCase().endsWith(ext));
      const isImage =
        file.type.startsWith('image/') ||
        file.type === 'application/pdf' ||
        ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].some((ext) => file.name.toLowerCase().endsWith(ext));

      if (isAudio || isImage) {
        if (file.size > 50 * 1024 * 1024) {
          setErrorMsg(`File "${file.name}" exceeds the 50MB limit.`);
        } else {
          validFiles.push(file);
        }
      } else {
        setErrorMsg(`"${file.name}" is not a supported audio or image format.`);
      }
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const hasAudio = files.some(
    (f) =>
      f.type.startsWith('audio/') ||
      ['.mp3', '.wav', '.m4a', '.webm'].some((ext) => f.name.toLowerCase().endsWith(ext))
  );

  const hasVisual = files.some(
    (f) =>
      f.type.startsWith('image/') ||
      f.type === 'application/pdf' ||
      ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].some((ext) => f.name.toLowerCase().endsWith(ext))
  );

  const handleSubmitAndProcess = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // 1. Create Lesson
      const lesson = await createLesson({
        title,
        subject,
        course,
        instructor,
        lecture_date: lectureDate,
        description,
      });

      // 2. Upload Files if present
      if (files.length > 0) {
        await uploadLessonFiles(lesson.id, files);
        // 3. Trigger processing pipeline
        await triggerProcessing(lesson.id);
      }

      // 4. Navigate to workspace
      navigate(`/lessons/${lesson.id}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create and process lesson');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 bg-ambient-glow">
      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Create New Lecture Workspace</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Step {currentStep} of 3: {currentStep === 1 ? 'Details' : currentStep === 2 ? 'Upload Modalities' : 'Review & Ingest'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2.5 w-8 rounded-full transition-all ${
                currentStep >= step ? 'bg-gradient-to-r from-violet-500 to-cyan-400' : 'bg-white/[0.08]'
              }`}
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <div className="glass-card-elevated p-6 border border-white/[0.08] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Lecture Title <span className="text-violet-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus & Raft Protocol"
                className="w-full glass-input px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Subject / Domain <span className="text-violet-400">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science, Organic Chemistry"
                className="w-full glass-input px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Course / Code (Optional)</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. CS 545: Distributed Systems"
                className="w-full glass-input px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Instructor Name (Optional)</label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="e.g. Dr. Maya Patel"
                className="w-full glass-input px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Lecture Date</label>
              <input
                type="date"
                value={lectureDate}
                onChange={(e) => setLectureDate(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Description / Key Focus</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief summary of topics covered in this lecture..."
                className="w-full glass-input px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => {
                if (!title.trim() || !subject.trim()) {
                  setErrorMsg('Please specify both lecture title and subject.');
                  return;
                }
                setErrorMsg(null);
                setCurrentStep(2);
              }}
              className="px-5 py-2.5 glass-button-primary rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5"
            >
              <span>Next: Upload Files</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload Files */}
      {currentStep === 2 && (
        <div className="glass-card-elevated p-6 border border-white/[0.08] space-y-6">
          <MultimodalUploadZone files={files} onFilesChange={setFiles} />

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 glass-button-secondary rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 glass-button-primary rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5"
            >
              <span>Next: Review & Ingest</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {currentStep === 3 && (
        <div className="glass-card-elevated p-6 border border-white/[0.08] space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-violet-300">
              Lecture Configuration Summary
            </h3>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-black/30 border border-white/[0.06] text-xs">
              <div>
                <span className="text-slate-500 block">Title</span>
                <span className="text-white font-semibold">{title}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Subject</span>
                <span className="text-white font-semibold">{subject}</span>
              </div>
              {course && (
                <div>
                  <span className="text-slate-500 block">Course</span>
                  <span className="text-slate-300">{course}</span>
                </div>
              )}
              {instructor && (
                <div>
                  <span className="text-slate-500 block">Instructor</span>
                  <span className="text-slate-300">{instructor}</span>
                </div>
              )}
            </div>

            {/* Modality Status */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Detected Modalities:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    hasAudio
                      ? 'bg-violet-600/10 border-violet-500/30 text-violet-200'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
                  }`}
                >
                  <FileAudio className="h-5 w-5" />
                  <div>
                    <span className="text-xs font-semibold block">Spoken Audio Modality</span>
                    <span className="text-[11px] text-slate-400">
                      {hasAudio ? 'Timestamped transcription will execute' : 'No audio files attached'}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    hasVisual
                      ? 'bg-cyan-600/10 border-cyan-500/30 text-cyan-200'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
                  }`}
                >
                  <FileImage className="h-5 w-5" />
                  <div>
                    <span className="text-xs font-semibold block">Visual Evidence Modality</span>
                    <span className="text-[11px] text-slate-400">
                      {hasVisual ? 'OCR and diagram parsing will execute' : 'No visual files attached'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!hasAudio && !hasVisual && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Notice: Creating an empty lecture container. You can upload audio and visual files inside the
                  workspace later.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={isSubmitting}
              className="px-4 py-2 glass-button-secondary rounded-xl text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSubmitAndProcess}
              disabled={isSubmitting}
              className="px-6 py-2.5 glass-button-primary rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Ingesting Lecture...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Start Multimodal Processing</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
