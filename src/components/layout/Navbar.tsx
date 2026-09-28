import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Layers,
  Search,
  Cpu,
  Plus,
  Settings,
  Sparkles,
  Menu,
  X,
  Activity,
  Bot,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { fetchProviderStatus } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [providerConfigured, setProviderConfigured] = useState<boolean | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { currentUser, isAuthenticated, signIn, signOut } = useAuth();

  useEffect(() => {
    fetchProviderStatus()
      .then((data) => setProviderConfigured(data.configured))
      .catch(() => setProviderConfigured(false));
  }, []);

  const navLinks = [
    { label: 'Overview', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Gemini Chat', path: '/chat', highlight: true },
    { label: 'Cross-Modal Search', path: '/search' },
    { label: 'Jobs', path: '/jobs' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#080B16]/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#080B16]">
              <Layers className="h-5 w-5 text-violet-400 group-hover:text-cyan-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-violet-200 transition-colors">
              LectureLens <span className="text-violet-400">AI</span>
            </span>
          </div>
        </Link>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors relative py-1 hover:text-white flex items-center gap-1.5 ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400'
                } ${link.highlight ? 'text-violet-300 font-semibold' : ''}`}
              >
                {link.highlight && <Bot className="h-3.5 w-3.5 text-cyan-400" />}
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Google Auth & AI Status */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${
                providerConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{providerConfigured ? 'Gemini Active' : 'Demo Grounded'}</span>
          </div>

          {/* Google Auth with Firebase */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-violet-500/40 text-xs text-white transition-all cursor-pointer"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User Avatar"
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="max-w-[100px] truncate font-medium">
                  {currentUser.displayName?.split(' ')[0] || 'User'}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0D1224] border border-white/[0.1] shadow-2xl p-2 z-50 space-y-1">
                  <div className="p-2 border-b border-white/[0.06] text-xs">
                    <p className="font-semibold text-white truncate">{currentUser.displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                      <ShieldCheck className="h-3 w-3" /> Firestore Linked
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 text-xs text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white/[0.05] border border-white/[0.1] hover:border-violet-500/50 hover:bg-white/[0.08] text-white transition-all cursor-pointer shadow-sm"
              title="Sign in with Google to sync Firestore data"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
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
              <span>Sign In</span>
            </button>
          )}

          <Link
            to="/lessons/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white glass-button-primary rounded-xl whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Create Lesson</span>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          {!isAuthenticated && (
            <button
              onClick={() => signIn()}
              className="p-1.5 text-xs bg-white/[0.08] text-white rounded-lg"
            >
              Sign In
            </button>
          )}
          <Link
            to="/lessons/new"
            className="p-2 text-white bg-violet-600 rounded-lg text-xs"
            title="Create Lesson"
          >
            <Plus className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#080B16]/95 px-4 py-4 space-y-3 backdrop-blur-xl">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AI Status:</span>
            <span className={providerConfigured ? 'text-emerald-400' : 'text-amber-400'}>
              {providerConfigured ? 'Gemini 3.8 Online' : 'Demo Mode Active'}
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
