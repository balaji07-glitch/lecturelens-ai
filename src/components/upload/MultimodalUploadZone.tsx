import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileAudio,
  FileImage,
  FileText,
  Trash2,
  Clipboard,
  Search,
  Link as LinkIcon,
  Check,
  Sparkles,
  AlertCircle,
  Plus,
  Eye,
} from 'lucide-react';

export interface UploadFileItem {
  file: File;
  previewUrl?: string;
  source: 'local' | 'clipboard' | 'library' | 'url';
}

interface MultimodalUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFileSizeMB?: number;
}

// Curated academic library items available for immediate search & import
interface LibraryAsset {
  id: string;
  title: string;
  subject: string;
  modality: 'audio' | 'visual' | 'notes';
  filename: string;
  mimeType: string;
  size: number;
  previewText: string;
  description: string;
  imageUrl?: string;
}

const SAMPLE_LIBRARY: LibraryAsset[] = [
  {
    id: 'lib-01',
    title: 'Token Ring Topology (IEEE 802.5) Schematic',
    subject: 'Computer Networks',
    modality: 'visual',
    filename: 'token_ring_network_diagram.jpg',
    mimeType: 'image/jpeg',
    size: 428000,
    previewText: 'Circular loop with Station A-D, 3-byte token frame, and directional flow.',
    description: 'Crisp textbook vector diagram of 4-workstation token ring architecture.',
    imageUrl: '/src/assets/images/ring_topology_diagram_1790618309172.jpg',
  },
  {
    id: 'lib-02',
    title: 'Prof. Rao Lecture Audio — Ring Networks & MAU',
    subject: 'Computer Networks',
    modality: 'audio',
    filename: 'lecture_04_ring_topology_audio.mp3',
    mimeType: 'audio/mp3',
    size: 14820000,
    previewText: 'Timestamped lecture explanation of token rotation, node failure modes, and MAU bypass.',
    description: 'Clear audio recording explaining IEEE 802.5 determinism and relay switches.',
  },
  {
    id: 'lib-03',
    title: 'Raft Consensus Protocol Leader Election Diagram',
    subject: 'Distributed Systems',
    modality: 'visual',
    filename: 'raft_consensus_state_diagram.png',
    mimeType: 'image/png',
    size: 512000,
    previewText: 'Follower, Candidate, and Leader state transitions with heartbeat timers.',
    description: 'Detailed finite state machine illustration for Raft distributed consensus.',
  },
  {
    id: 'lib-04',
    title: 'B-Tree Database Index Node Splitting Notes',
    subject: 'Databases',
    modality: 'notes',
    filename: 'btree_indexing_lecture_notes.txt',
    mimeType: 'text/plain',
    size: 84000,
    previewText: 'Degree t, root node splitting, leaf pointers, disk block I/O optimization equations.',
    description: 'Academic lecture notes detailing balanced search trees for database storage engines.',
  },
  {
    id: 'lib-05',
    title: 'Neural Network Gradient Descent & Backprop Equations',
    subject: 'Machine Learning',
    modality: 'visual',
    filename: 'gradient_descent_loss_landscape.png',
    mimeType: 'image/png',
    size: 620000,
    previewText: 'Loss surface contours, learning rate vectors, and partial derivative equations.',
    description: 'High-contrast visualization of gradient descent optimization on convex surfaces.',
  },
  {
    id: 'lib-06',
    title: 'Operating System Virtual Memory & Page Fault Handlers',
    subject: 'Operating Systems',
    modality: 'audio',
    filename: 'virtual_memory_paging_lecture.mp3',
    mimeType: 'audio/mp3',
    size: 12400000,
    previewText: 'Spoken breakdown of TLB hit ratios, page tables, swap space, and LRU replacement.',
    description: 'University lecture recording on MMU translation and fault recovery.',
  },
];

export const MultimodalUploadZone: React.FC<MultimodalUploadZoneProps> = ({
  files,
  onFilesChange,
  maxFileSizeMB = 50,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'search' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [pasteText, setPasteText] = useState('');
  const [pastedTitle, setPastedTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste listener when on upload or paste tab
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      // 1. Check for image files in clipboard
      const items = e.clipboardData.items;
      let handled = false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const timestamp = Date.now();
            const pastedFile = new File([blob], `clipboard_image_${timestamp}.png`, {
              type: blob.type || 'image/png',
            });
            addFiles([pastedFile]);
            setStatusNotice({
              type: 'success',
              message: `Pasted image from clipboard (${(blob.size / 1024).toFixed(1)} KB) added!`,
            });
            handled = true;
            break;
          }
        }
      }

      // 2. Check for text if not already handled and if pasting in dropzone
      if (!handled && activeMode === 'paste') {
        const text = e.clipboardData.getData('text');
        if (text && text.trim().length > 10) {
          setPasteText(text);
          setStatusNotice({
            type: 'success',
            message: 'Pasted text content detected in clipboard.',
          });
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [activeMode, files]);

  const addFiles = (newFiles: File[]) => {
    setStatusNotice(null);
    const valid: File[] = [];

    newFiles.forEach((file) => {
      const isAudio =
        file.type.startsWith('audio/') ||
        ['.mp3', '.wav', '.m4a', '.webm'].some((ext) => file.name.toLowerCase().endsWith(ext));
      const isVisual =
        file.type.startsWith('image/') ||
        file.type === 'application/pdf' ||
        ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].some((ext) => file.name.toLowerCase().endsWith(ext));
      const isNotes =
        file.type.startsWith('text/') ||
        ['.txt', '.md'].some((ext) => file.name.toLowerCase().endsWith(ext));

      if (isAudio || isVisual || isNotes) {
        if (file.size > maxFileSizeMB * 1024 * 1024) {
          setStatusNotice({
            type: 'error',
            message: `"${file.name}" exceeds the ${maxFileSizeMB}MB limit.`,
          });
        } else {
          valid.push(file);
        }
      } else {
        setStatusNotice({
          type: 'error',
          message: `"${file.name}" is not a supported format. Please upload Audio, Image, PDF, or Text notes.`,
        });
      }
    });

    if (valid.length > 0) {
      onFilesChange([...files, ...valid]);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  // Clipboard Paste button handler (using Navigator Clipboard API)
  const handleClipboardPasteButtonClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        let foundImage = false;

        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const timestamp = Date.now();
              const file = new File([blob], `clipboard_diagram_${timestamp}.png`, { type });
              addFiles([file]);
              setStatusNotice({
                type: 'success',
                message: `Successfully pasted clipboard image (${(blob.size / 1024).toFixed(1)} KB)!`,
              });
              foundImage = true;
              break;
            }
          }
          if (foundImage) break;
        }

        if (!foundImage) {
          const text = await navigator.clipboard.readText();
          if (text && text.trim().length > 0) {
            setPasteText(text);
            setActiveMode('paste');
            setStatusNotice({
              type: 'success',
              message: 'Pasted text loaded from clipboard. Review and click "Add as Lecture File".',
            });
          } else {
            setStatusNotice({
              type: 'error',
              message: 'Clipboard is empty or does not contain image/text data.',
            });
          }
        }
      } else {
        // Fallback for browsers without clipboard.read
        const text = await navigator.clipboard.readText();
        if (text) {
          setPasteText(text);
          setActiveMode('paste');
        }
      }
    } catch (err: any) {
      console.warn('Clipboard read error:', err);
      setStatusNotice({
        type: 'error',
        message: 'Could not access clipboard directly. Please use Ctrl+V / Cmd+V to paste.',
      });
    }
  };

  // Add text as a `.txt` lecture note file
  const handleAddPastedTextFile = () => {
    if (!pasteText.trim()) return;
    const name = (pastedTitle.trim() || 'pasted_lecture_notes').replace(/\s+/g, '_') + '.txt';
    const blob = new Blob([pasteText], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], name, { type: 'text/plain' });
    addFiles([file]);
    setPasteText('');
    setPastedTitle('');
    setActiveMode('upload');
    setStatusNotice({
      type: 'success',
      message: `Created and attached "${name}" from pasted text!`,
    });
  };

  // Add from URL input
  const handleImportFromUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      const url = urlInput.trim();
      const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      const filename = `imported_asset_${Date.now()}.${ext}`;

      // Create a lightweight file reference for demonstration
      const dummyBlob = new Blob([`Imported from URL: ${url}`], { type: 'text/plain' });
      const file = new File([dummyBlob], filename, { type: 'text/plain' });
      addFiles([file]);
      setUrlInput('');
      setStatusNotice({
        type: 'success',
        message: `Imported asset from URL: ${filename}`,
      });
    } catch (e: any) {
      setStatusNotice({
        type: 'error',
        message: 'Failed to import from URL.',
      });
    }
  };

  // Attach a sample library item
  const handleAttachLibraryAsset = (asset: LibraryAsset) => {
    let file: File;
    if (asset.imageUrl) {
      // Create a reference file with image type
      const dummyContent = new Blob([asset.description], { type: asset.mimeType });
      file = new File([dummyContent], asset.filename, { type: asset.mimeType });
    } else {
      const dummyContent = new Blob([asset.previewText], { type: asset.mimeType });
      file = new File([dummyContent], asset.filename, { type: asset.mimeType });
    }

    addFiles([file]);
    setStatusNotice({
      type: 'success',
      message: `Attached "${asset.title}" from Academic Library!`,
    });
  };

  // Filtered library results
  const filteredLibrary = SAMPLE_LIBRARY.filter((item) => {
    const matchesQuery =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = filterSubject === 'all' || item.subject === filterSubject;
    return matchesQuery && matchesSubject;
  });

  const subjects = Array.from(new Set(SAMPLE_LIBRARY.map((s) => s.subject)));

  return (
    <div className="space-y-4">
      {/* Tab Switcher: Upload / Drop vs Search Library vs Copy-Paste */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMode === 'upload'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>File Drag & Drop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMode === 'search'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search Library ({SAMPLE_LIBRARY.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeMode === 'paste'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clipboard className="h-3.5 w-3.5" />
            <span>Paste / Clipboard</span>
          </button>
        </div>

        {/* Instant Paste from Clipboard Button */}
        <button
          type="button"
          onClick={handleClipboardPasteButtonClick}
          className="px-3 py-1.5 glass-button-secondary rounded-lg text-xs font-semibold flex items-center gap-1.5 text-violet-300 hover:text-white"
          title="Paste screenshot, image, or text directly from clipboard"
        >
          <Clipboard className="h-3.5 w-3.5" />
          <span>Paste From Clipboard (Ctrl+V)</span>
        </button>
      </div>

      {/* Status Notice Toast */}
      {statusNotice && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            statusNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotice.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{statusNotice.message}</span>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mode 1: Traditional Drag and Drop + Paste Area */}
      {activeMode === 'upload' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              addFiles(Array.from(e.dataTransfer.files));
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group ${
            isDragging
              ? 'border-violet-400 bg-violet-600/10'
              : 'border-white/[0.12] hover:border-violet-500/40 bg-white/[0.02]'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,image/*,.pdf,text/*,.txt,.md"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addFiles(Array.from(e.target.files));
              }
            }}
            className="hidden"
          />

          <UploadCloud className="h-10 w-10 mx-auto text-violet-400 mb-3 group-hover:scale-110 transition-transform" />

          <p className="text-sm font-semibold text-white">
            Drag and drop audio & visual files, or paste clipboard content
          </p>

          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Supports MP3, WAV, M4A, WEBM audio, PNG, JPG, WEBP, PDF diagrams, and TXT/MD notes up to {maxFileSizeMB}MB.
            You can also press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.1] text-violet-300 font-mono text-[10px]">Ctrl+V</kbd> anywhere to paste screenshot images or text directly.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              className="px-4 py-2 glass-button-secondary rounded-lg text-xs font-semibold"
            >
              Browse Local Files
            </button>
            <span className="text-slate-500 text-xs">or</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClipboardPasteButtonClick();
              }}
              className="px-4 py-2 glass-button-secondary rounded-lg text-xs font-semibold text-violet-300"
            >
              Paste From Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Mode 2: Search Academic Lecture Library */}
      {activeMode === 'search' && (
        <div className="space-y-4 glass-panel p-5 border border-white/[0.08]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diagrams, audio excerpts, topics (e.g. 'Network', 'Raft', 'Tree', 'OS')..."
                className="w-full glass-input pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            {/* Subject Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              <button
                type="button"
                onClick={() => setFilterSubject('all')}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                  filterSubject === 'all'
                    ? 'bg-violet-600 text-white font-semibold'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white'
                }`}
              >
                All Subjects
              </button>
              {subjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setFilterSubject(sub)}
                  className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors ${
                    filterSubject === sub
                      ? 'bg-violet-600 text-white font-semibold'
                      : 'bg-white/[0.04] text-slate-400 hover:text-white'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Library Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredLibrary.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-2 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-violet-300 font-semibold">{item.subject}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-slate-400 uppercase">
                      {item.modality}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-violet-200 transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {item.previewText}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">{item.filename}</span>
                  <button
                    type="button"
                    onClick={() => handleAttachLibraryAsset(item)}
                    className="px-2.5 py-1 text-xs rounded-lg glass-button-primary font-medium flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add to Lesson</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 3: Copy-Paste Text Notes / Image URL */}
      {activeMode === 'paste' && (
        <div className="glass-panel p-5 border border-white/[0.08] space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-white">Paste Lecture Notes, Transcript or Diagram</h4>
            <p className="text-[11px] text-slate-400">
              Paste professor's speech transcript, formula equations, or slide notes to generate a text evidence file.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              placeholder="Notes title (e.g. Professor Lecture Notes, Board Equations)..."
              className="w-full glass-input px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={4}
              placeholder="Paste notes, transcripts, or equations here (or press Ctrl+V / Cmd+V)..."
              className="w-full glass-input p-3 text-xs text-white placeholder-slate-500 focus:outline-none font-mono leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasteText('')}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleAddPastedTextFile}
                disabled={!pasteText.trim()}
                className="px-4 py-2 glass-button-primary rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add as Lecture File</span>
              </button>
            </div>
          </div>

          {/* Import from URL subsection */}
          <div className="pt-3 border-t border-white/[0.08] space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-cyan-400" />
              <span>Or Import Slide / Audio via Web URL</span>
            </span>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/lecture_diagram.png"
                className="flex-1 glass-input px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleImportFromUrl}
                disabled={!urlInput.trim()}
                className="px-4 py-2 glass-button-secondary rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                Import URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files Queue */}
      {files.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Attached Lecture Modalities ({files.length}):
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Total Size: {(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {files.map((file, idx) => {
              const isAudio =
                file.type.startsWith('audio/') ||
                ['.mp3', '.wav', '.m4a', '.webm'].some((ext) =>
                  file.name.toLowerCase().endsWith(ext)
                );
              const isVisual =
                file.type.startsWith('image/') ||
                file.type === 'application/pdf' ||
                ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].some((ext) =>
                  file.name.toLowerCase().endsWith(ext)
                );

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isAudio ? (
                      <FileAudio className="h-4 w-4 text-violet-400 shrink-0" />
                    ) : isVisual ? (
                      <FileImage className="h-4 w-4 text-cyan-400 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}

                    <span className="text-white font-medium truncate">{file.name}</span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
