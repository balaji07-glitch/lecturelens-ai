import React from 'react';
import { Layers, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#080B16] text-slate-400 py-10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center">
              <Layers className="h-4 w-4 text-violet-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">LectureLens AI</p>
              <p className="text-xs text-slate-500">Every Lecture. Every Detail. One Intelligent Study Space.</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span>YUVA MEGATHON 2026 · Domain 03 (Multimodal AI)</span>
            <span>·</span>
            <span>Audio & Visual Evidence Alignment Engine</span>
          </div>

          <div className="text-xs text-slate-600">
            © {new Date().getFullYear()} LectureLens AI. Built for accessible, evidence-grounded education.
          </div>
        </div>
      </div>
    </footer>
  );
};
