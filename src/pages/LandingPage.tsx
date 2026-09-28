import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  Mic,
  Image as ImageIcon,
  Bot,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithEmailOrGuest, isAuthenticated, currentUser } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [logoRevealed, setLogoRevealed] = useState(false);
  const [showAuthCard, setShowAuthCard] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Timed sequential entrance: Logo appears first, then Sign In / Sign Up prompt reveals
  useEffect(() => {
    const timer1 = setTimeout(() => setLogoRevealed(true), 100);
    const timer2 = setTimeout(() => setShowAuthCard(true), 600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setIsSubmitting(true);
      await signIn();
      navigate('/dashboard');
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err);
      // Fallback guest transition if popup closed
      signInWithEmailOrGuest('Google Scholar', 'scholar@google.com');
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthNotice(authMode === 'signin' ? 'Signing in...' : 'Creating your account...');

    signInWithEmailOrGuest(name || (authMode === 'signin' ? 'Student User' : 'New Scholar'), email || 'student@lecturelens.ai');

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 400);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-ambient-glow overflow-hidden">
      {/* Background Ambient Glow Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Centered Container */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
        {/* Stage 1: Animated Centered Brand Logo */}
        <div
          className={`transition-all duration-700 transform flex flex-col items-center space-y-3 ${
            logoRevealed ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-4'
          }`}
        >
          {/* Logo Emblem Icon with Pulsing Halo */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 opacity-70 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />
            <div className="relative h-16 w-16 flex items-center justify-center rounded-2xl bg-[#080B16] border border-white/20 shadow-2xl">
              <Layers className="h-9 w-9 text-violet-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              LectureLens <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Multimodal Lecture Reconstruction & Grounded Study Engine
            </p>
          </div>
        </div>

        {/* Stage 2: Sign In / Sign Up Prompt Card */}
        <div
          className={`w-full transition-all duration-700 delay-200 transform ${
            showAuthCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
          }`}
        >
          <div className="glass-card-elevated p-6 sm:p-8 border border-white/[0.12] rounded-2xl shadow-2xl space-y-5">
            {/* Header Tab Switcher: Sign In vs Sign Up */}
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthNotice(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Mode Notice Header */}
            <div className="text-left space-y-0.5">
              <h2 className="text-base font-bold text-white">
                {authMode === 'signin' ? 'Welcome Back' : 'Create an Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {authMode === 'signin'
                  ? 'Sign in to access your lecture workspace & study packs.'
                  : 'Join LectureLens AI to upload & reconstruct lecture intelligence.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-left">
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 font-mono">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full glass-input pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full glass-input pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 font-mono">Password</label>
                  {authMode === 'signin' && (
                    <span className="text-[10px] text-violet-300 hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full glass-input pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {authNotice && (
                <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 text-center font-mono">
                  {authNotice}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 glass-button-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-600/30"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'signin' ? 'Sign In to Workspace' : 'Create Account'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-white/[0.08]" />
              <span className="absolute px-3 bg-[#0D1224] text-[10px] font-mono text-slate-500 uppercase">
                Or Continue With
              </span>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{authMode === 'signin' ? 'Sign In with Google' : 'Sign Up with Google'}</span>
            </button>

            {/* Quick Guest Access Link */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-xs text-slate-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
              >
                Skip & Explore Demo Workspace →
              </button>
            </div>
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div
          className={`flex flex-wrap items-center justify-center gap-3 pt-2 transition-all duration-700 delay-500 ${
            showAuthCard ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
            <Mic className="h-3 w-3 text-violet-400" />
            <span>Spoken Audio</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
            <ImageIcon className="h-3 w-3 text-cyan-400" />
            <span>Visual Diagrams & OCR</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
            <Bot className="h-3 w-3 text-emerald-400" />
            <span>Grounded Q&A</span>
          </div>
        </div>
      </div>
    </div>
  );
};

