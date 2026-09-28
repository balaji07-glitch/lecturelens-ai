import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Copy,
  Check,
  Edit2,
  Eye,
  FileText,
  Layers,
  AlertCircle,
  HelpCircle,
  ImageIcon,
  FileCode,
  Compass,
} from 'lucide-react';
import type { SourceFile, VisualEvidence } from '../../types/index.ts';
import defaultRingTopologyImg from '../../assets/images/ring_topology_diagram_1790618309172.jpg';

interface VisualInspectorProps {
  evidence: VisualEvidence[];
  imageUrl?: string;
  files?: SourceFile[];
  onSaveOcrCorrection?: (evidenceId: string, newOcr: string, explanation: string) => Promise<void>;
}

export const VisualInspector: React.FC<VisualInspectorProps> = ({
  evidence,
  imageUrl,
  files = [],
  onSaveOcrCorrection,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'ocr' | 'description' | 'components'>('ocr');
  const [copied, setCopied] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [isEditingOcr, setIsEditingOcr] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [ocrExplanation, setOcrExplanation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter visual source files
  const visualFiles = files.filter((f) => f.modality === 'visual');
  const imageFiles = visualFiles.filter(
    (f) =>
      f.mime_type.startsWith('image/') ||
      /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.original_filename)
  );

  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Automatically select the first image file if available on load or when files change
  useEffect(() => {
    if (visualFiles.length > 0) {
      const firstImgIdx = visualFiles.findIndex(
        (f) =>
          f.mime_type.startsWith('image/') ||
          /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.original_filename)
      );
      if (firstImgIdx !== -1) {
        setSelectedFileIdx(firstImgIdx);
      }
    }
  }, [files.length]);

  const activeVisualFile = visualFiles[selectedFileIdx] || imageFiles[0] || visualFiles[0];

  // Determine active visual image/file URL
  let resolvedImageUrl = imageUrl;
  if (activeVisualFile?.file_url) {
    resolvedImageUrl = activeVisualFile.file_url;
  } else if (!resolvedImageUrl || resolvedImageUrl.includes('ring_topology')) {
    resolvedImageUrl = defaultRingTopologyImg;
  }

  // Reset imgError when URL changes
  useEffect(() => {
    setImgError(false);
  }, [resolvedImageUrl, selectedFileIdx]);

  const isPdfFile =
    activeVisualFile?.mime_type === 'application/pdf' ||
    resolvedImageUrl?.toLowerCase().endsWith('.pdf');

  // Match visual evidence item corresponding to the active visual source file
  const matchedEvidenceIdx = activeVisualFile
    ? evidence.findIndex((v) => v.source_file_id === activeVisualFile.id)
    : -1;
  const current =
    (matchedEvidenceIdx !== -1 ? evidence[matchedEvidenceIdx] : null) ||
    evidence[selectedIdx] ||
    evidence[0];

  const handleCopyOcr = () => {
    if (!current) return;
    navigator.clipboard.writeText(current.ocr_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEditOcr = () => {
    if (!current) return;
    setOcrText(current.ocr_text);
    setOcrExplanation('');
    setIsEditingOcr(true);
  };

  const handleSaveOcr = async () => {
    if (!current || !onSaveOcrCorrection) return;
    try {
      setIsSaving(true);
      await onSaveOcrCorrection(current.id, ocrText, ocrExplanation);
      setIsEditingOcr(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!current) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400">
        <FileText className="h-8 w-8 mx-auto mb-2 text-slate-500 opacity-60" />
        <p className="text-sm">No visual evidence processed for this lesson.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Selector Bar (if multiple visual files present) */}
      {visualFiles.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1 shrink-0">
            <ImageIcon className="h-3.5 w-3.5 text-cyan-400" /> Source File:
          </span>
          {visualFiles.map((file, idx) => {
            const isSelected = idx === selectedFileIdx;
            const isImg =
              file.mime_type.startsWith('image/') ||
              /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file.original_filename);
            return (
              <button
                key={file.id}
                onClick={() => setSelectedFileIdx(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-sm'
                    : 'bg-white/[0.03] text-slate-400 hover:text-white border-white/[0.08]'
                }`}
              >
                {isImg ? <ImageIcon className="h-3 w-3 text-cyan-400" /> : <FileCode className="h-3 w-3 text-amber-400" />}
                <span className="truncate max-w-[160px]">{file.original_filename}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Visual Canvas Card */}
      <div className="glass-panel overflow-hidden border border-white/[0.08]">
        {/* Canvas Header */}
        <div className="p-3 border-b border-white/[0.08] flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Visual Source Canvas</span>
            <span className="text-[11px] text-slate-500">·</span>
            <span className="text-xs font-mono text-cyan-300">
              Confidence: {Math.round(current.confidence * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className={`px-2 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                showBoundingBoxes
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
              }`}
            >
              <Eye className="h-3 w-3 inline mr-1" />
              {showBoundingBoxes ? 'Regions Visible' : 'Raw Canvas'}
            </button>
          </div>
        </div>

        {/* Image / PDF / SVG Canvas Display Area */}
        <div className="relative bg-[#05070E] flex items-center justify-center p-2 min-h-[300px] max-h-[420px] overflow-hidden group">
          {isPdfFile ? (
            <div className="w-full h-[360px] flex flex-col items-center justify-center p-4 bg-black/40 rounded-lg border border-white/[0.08]">
              <iframe
                src={resolvedImageUrl}
                title="Visual Document Preview"
                className="w-full h-full rounded-lg border-0 bg-white"
              />
            </div>
          ) : !imgError && resolvedImageUrl ? (
            <img
              src={resolvedImageUrl}
              alt="Lecture Diagram"
              referrerPolicy="no-referrer"
              onError={() => {
                // If custom image path fails, fallback to default ring diagram asset or SVG canvas
                if (resolvedImageUrl !== defaultRingTopologyImg) {
                  setImgError(true);
                }
              }}
              className="w-full h-full object-contain rounded-lg max-h-[380px]"
            />
          ) : (
            /* High-Tech Interactive SVG Vector Canvas (Fallback & Diagram Generator) */
            <div className="w-full h-[320px] relative flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-lg border border-cyan-500/20 overflow-hidden">
              {/* Background Grid Accent */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Interactive Vector Schematic Nodes */}
              <svg className="w-full h-full absolute inset-0 pointer-events-none opacity-40">
                <line x1="20%" y1="50%" x2="50%" y2="25%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="25%" x2="80%" y2="50%" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="80%" y1="50%" x2="50%" y2="75%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="75%" x2="20%" y2="50%" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" />
              </svg>

              <div className="relative z-10 text-center space-y-3 max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono">
                  <Compass className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                  Reconstructed Multimodal Diagram Schematic
                </div>

                <h4 className="text-sm font-bold text-white tracking-wide">
                  {activeVisualFile?.original_filename || 'Lecture Visual Evidence Canvas'}
                </h4>

                {/* Detected Components Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {current.detected_elements.slice(0, 5).map((elem, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-black/60 border border-cyan-400/40 text-[11px] font-mono text-cyan-200 shadow-sm"
                    >
                      ● {elem}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Optional Bounding Box Overlay */}
          {showBoundingBoxes && current.image_region && !isPdfFile && (
            <div
              className="absolute border-2 border-dashed border-cyan-400/80 bg-cyan-400/10 rounded-lg pointer-events-none transition-all flex items-start justify-start p-1"
              style={{
                left: `${current.image_region.x}%`,
                top: `${current.image_region.y}%`,
                width: `${current.image_region.width}%`,
                height: `${current.image_region.height}%`,
              }}
            >
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/80 text-cyan-300 border border-cyan-500/30">
                {current.image_region.label || 'Detected Region'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Evidence Tabs */}
      <div className="glass-panel p-4 border border-white/[0.08]">
        {/* Tab Headers */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ocr')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'ocr'
                  ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5 inline mr-1" />
              Extracted OCR Text
            </button>
            <button
              onClick={() => setActiveTab('description')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'description'
                  ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5 inline mr-1" />
              Visual Breakdown
            </button>
            <button
              onClick={() => setActiveTab('components')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'components'
                  ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5 inline mr-1" />
              Components ({current.detected_elements.length})
            </button>
          </div>

          {activeTab === 'ocr' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyOcr}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/[0.04] transition-colors cursor-pointer"
                title="Copy OCR Text"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={startEditOcr}
                className="p-1.5 text-slate-400 hover:text-violet-300 rounded-lg bg-white/[0.04] transition-colors cursor-pointer"
                title="Correct OCR Text"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'ocr' && (
          <div>
            {isEditingOcr ? (
              <div className="space-y-3">
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  rows={5}
                  className="w-full text-xs font-mono p-2.5 rounded-lg bg-black/40 border border-violet-500/40 text-slate-200 focus:outline-none"
                />
                <input
                  type="text"
                  value={ocrExplanation}
                  onChange={(e) => setOcrExplanation(e.target.value)}
                  placeholder="Correction justification..."
                  className="w-full text-xs p-2 rounded-lg bg-black/40 border border-white/[0.1] text-slate-300"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingOcr(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOcr}
                    disabled={isSaving}
                    className="px-3 py-1 text-xs font-medium text-white bg-violet-600 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3 w-3" />
                    {isSaving ? 'Saving...' : 'Save Correction'}
                  </button>
                </div>
              </div>
            ) : (
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed bg-black/30 p-3 rounded-lg border border-white/[0.04]">
                {current.ocr_text}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'description' && (
          <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-xs font-semibold text-violet-300 block mb-1">
                Objective Visual Description
              </span>
              <p>{current.visual_description}</p>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-indigo-400" />
              <span>
                <strong>Methodology:</strong> Visual elements are parsed into OCR strings and vector
                relationships via multimodal vision models, avoiding hallucinated labels.
              </span>
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="flex flex-wrap gap-2">
            {current.detected_elements.map((el, i) => (
              <div
                key={i}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 flex items-center gap-1.5"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>{el}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

