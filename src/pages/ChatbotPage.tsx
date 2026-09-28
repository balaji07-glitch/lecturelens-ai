import React from 'react';
import { GeminiChatbot } from '../components/chat/GeminiChatbot.tsx';
import { Sparkles, Bot, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

export const ChatbotPage: React.FC = () => {
  const { currentUser, isAuthenticated, signIn } = useAuth();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400">
              <Bot className="h-6 w-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Gemini AI Chat & Grounded Search
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Multi-turn intelligent study engine. Converse with specialized academic personas, leverage{' '}
            <span className="text-cyan-300 font-semibold">gemini-3.1-pro-preview</span> for complex proofs, and access live web facts with{' '}
            <span className="text-blue-300 font-semibold">Google Search Grounding</span>.
          </p>
        </div>

        {/* Auth / Firestore Sync Status Card */}
        <div className="glass-panel p-3.5 border border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center shrink-0">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
            )}
          </div>
          <div className="text-xs">
            {isAuthenticated ? (
              <>
                <p className="font-semibold text-white">{currentUser?.displayName || 'Student'}</p>
                <p className="text-emerald-400 text-[11px] flex items-center gap-1">
                  ● Firestore Sync Active
                </p>
              </>
            ) : (
              <>
                <p className="text-slate-300 font-medium">Guest Mode</p>
                <button
                  onClick={() => signIn()}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold underline"
                >
                  Sign in with Google
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Chatbot Interface */}
      <GeminiChatbot isOpenAsFullPage={true} />
    </div>
  );
};
