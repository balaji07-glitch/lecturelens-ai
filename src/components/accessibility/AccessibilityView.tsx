import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Type,
  Eye,
  BookOpen,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Play,
  Square,
} from 'lucide-react';

interface AccessibilityData {
  plain_language_summary: string;
  diagram_accessibility: Array<{
    visual_id: string;
    title: string;
    visible_facts: string;
    inferred_meaning: string;
    audio_reading_text: string;
  }>;
  glossary: Array<{ term: string; plain_definition: string }>;
}

interface AccessibilityViewProps {
  data: AccessibilityData | null;
  lessonTitle: string;
}

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({
  data,
  lessonTitle,
}) => {
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);

  const getTextClass = () => {
    switch (textSize) {
      case 'large':
        return 'text-base sm:text-lg leading-relaxed';
      case 'xlarge':
        return 'text-lg sm:text-xl leading-loose';
      default:
        return 'text-xs sm:text-sm leading-relaxed';
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setCurrentlySpeakingText(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingText(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentlySpeakingText(null);
      };

      setCurrentlySpeakingText(text);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentlySpeakingText(null);
    }
  };

  if (!data) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400">
        <Sparkles className="h-8 w-8 mx-auto mb-2 text-violet-400 opacity-60" />
        <p className="text-sm">Loading accessibility study models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Accessibility Toolbar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 border border-white/[0.08]">
        <div>
          <h3 className="text-sm font-semibold text-white">Accessibility Studio</h3>
          <p className="text-xs text-slate-400">
            Plain language explanations, screen-reader audio, and objective diagram descriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Text Size Controls */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <button
              onClick={() => setTextSize('normal')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                textSize === 'normal'
                  ? 'bg-violet-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setTextSize('large')}
              className={`px-2.5 py-1 text-sm rounded-lg transition-colors ${
                textSize === 'large'
                  ? 'bg-violet-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setTextSize('xlarge')}
              className={`px-2.5 py-1 text-base rounded-lg transition-colors ${
                textSize === 'xlarge'
                  ? 'bg-violet-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A++
            </button>
          </div>

          {/* Master Speech Toggle */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium"
            >
              <Square className="h-3.5 w-3.5" />
              <span>Stop Audio</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Plain-Language Summary */}
      <div className="glass-card-elevated p-5 sm:p-6 border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-400" />
            <h4 className="text-sm font-semibold text-white">Plain-Language Core Explanation</h4>
          </div>

          <button
            onClick={() => handleSpeak(data.plain_language_summary)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-violet-600/30 hover:bg-violet-600/40 text-violet-200 border border-violet-500/40 transition-colors"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Read Aloud</span>
          </button>
        </div>

        <p className={`text-slate-200 ${getTextClass()}`}>{data.plain_language_summary}</p>
      </div>

      {/* 2. Diagram Descriptions (Separating Visible Facts from Inferred Meaning) */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Eye className="h-4 w-4 text-cyan-400" />
          <span>Diagram Accessibility: Literal Breakdown vs Inferred Meaning</span>
        </h4>

        <div className="space-y-4">
          {data.diagram_accessibility.map((diag, idx) => (
            <div
              key={diag.visual_id || idx}
              className="glass-card-elevated p-5 border border-white/[0.08] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <span className="text-xs font-bold text-cyan-300">{diag.title}</span>

                <button
                  onClick={() => handleSpeak(diag.audio_reading_text || diag.visible_facts)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Listen</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visible Facts */}
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                    1. Literal Visible Facts (Labels & Lines):
                  </span>
                  <p className={`text-slate-300 ${getTextClass()}`}>{diag.visible_facts}</p>
                </div>

                {/* Inferred Meaning */}
                <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-violet-300 block font-semibold">
                    2. Inferred Conceptual Meaning:
                  </span>
                  <p className={`text-violet-200 ${getTextClass()}`}>{diag.inferred_meaning}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Plain Language Terminology Glossary */}
      {data.glossary && data.glossary.length > 0 && (
        <div className="glass-card-elevated p-5 sm:p-6 border border-white/[0.08] space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>Accessible Glossary of Key Terms</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.glossary.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1"
              >
                <span className="text-xs font-bold text-white block">{item.term}</span>
                <p className={`text-slate-400 ${getTextClass()}`}>{item.plain_definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
