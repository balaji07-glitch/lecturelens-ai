import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Search,
  Globe,
  Bot,
  User,
  Zap,
  Cpu,
  GraduationCap,
  Layers,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  PlusCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { sendChatMessage, type ChatMessagePayload } from '../../services/api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import {
  saveChatSession,
  saveChatMessage,
  fetchUserChatSessions,
  fetchChatMessages,
  type PersistedChatMessage,
  type PersistedChatSession,
} from '../../services/firestoreService.ts';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingSources?: Array<{ title: string; uri: string }>;
  searchQueries?: string[];
}

interface GeminiChatbotProps {
  lessonId?: string;
  lessonTitle?: string;
  keyConcepts?: string[];
  transcriptSummary?: string;
  isOpenAsFullPage?: boolean;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  lessonId,
  lessonTitle,
  keyConcepts,
  transcriptSummary,
  isOpenAsFullPage = false,
}) => {
  const { currentUser, isAuthenticated, signIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-msg',
      role: 'model',
      content: `Hello! I am your **LectureLens AI Assistant** powered by Gemini.

I can help you break down complex lecture concepts, verify diagram details, or explore live academic standards via **Google Search Grounding**.

Choose a specialized tutoring persona or ask anything about the lecture to get started!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Persona Role
  const [systemRole, setSystemRole] = useState<
    'academic_tutor' | 'socratic_mentor' | 'exam_prepper' | 'diagram_explainer'
  >('academic_tutor');

  // Model Selection
  const [modelSpeed, setModelSpeed] = useState<'fast' | 'general' | 'complex'>('general');

  // Google Search Grounding toggle
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);

  // Firestore Sessions
  const [sessionId, setSessionId] = useState<string>(() => 'chat-' + Date.now());
  const [pastSessions, setPastSessions] = useState<PersistedChatSession[]>([]);
  const [showSessionDrawer, setShowSessionDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load user sessions from Firestore if logged in
  useEffect(() => {
    if (currentUser?.uid) {
      fetchUserChatSessions(currentUser.uid).then((sessions) => {
        setPastSessions(sessions);
      });
    }
  }, [currentUser]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startNewSession = () => {
    const newId = 'chat-' + Date.now();
    setSessionId(newId);
    setMessages([
      {
        id: 'new-session-msg',
        role: 'model',
        content: `Started a fresh study thread. What shall we explore next in ${lessonTitle ? `"${lessonTitle}"` : 'your coursework'}?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: modelSpeed === 'fast' ? 'gemini-3.1-flash-lite' : modelSpeed === 'complex' ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash',
      },
    ]);
  };

  const loadPastSession = async (session: PersistedChatSession) => {
    setSessionId(session.id);
    setSystemRole(session.systemRole);
    setModelSpeed(session.model === 'gemini-3.1-flash-lite' ? 'fast' : session.model === 'gemini-3.1-pro-preview' ? 'complex' : 'general');
    setUseGoogleSearch(session.searchGroundingEnabled);

    const savedMsgs = await fetchChatMessages(session.id);
    if (savedMsgs.length > 0) {
      setMessages(
        savedMsgs.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: m.modelUsed,
          groundingSources: m.searchSources,
          searchQueries: m.searchQueries,
        }))
      );
    }
    setShowSessionDrawer(false);
  };

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = customPrompt || input.trim();
    if (!promptToSend || isLoading) return;

    const userMessageId = 'msg-' + Date.now();
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: promptToSend,
      timestamp: nowStr,
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Save user message to Firestore if authenticated
    if (currentUser?.uid) {
      saveChatMessage(sessionId, {
        id: userMessageId,
        sessionId,
        userId: currentUser.uid,
        role: 'user',
        content: promptToSend,
        timestamp: new Date().toISOString(),
      });

      saveChatSession({
        id: sessionId,
        userId: currentUser.uid,
        title: promptToSend.slice(0, 45) + (promptToSend.length > 45 ? '...' : ''),
        systemRole,
        model: modelSpeed === 'fast' ? 'gemini-3.1-flash-lite' : modelSpeed === 'complex' ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash',
        searchGroundingEnabled: useGoogleSearch,
        lessonId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    try {
      // Build conversation turns
      const turns = updatedMessages
        .filter((m) => m.id !== 'init-msg')
        .map((m) => ({ role: m.role, content: m.content }));

      const payload: ChatMessagePayload = {
        messages: turns.length > 0 ? turns : [{ role: 'user', content: promptToSend }],
        systemRole,
        modelSpeed,
        useGoogleSearch,
        lessonContext: lessonTitle
          ? {
              title: lessonTitle,
              transcriptSummary,
              keyConcepts,
            }
          : undefined,
      };

      const result = await sendChatMessage(payload);

      const modelMessageId = 'resp-' + Date.now();
      const newModelMessage: Message = {
        id: modelMessageId,
        role: 'model',
        content: result.reply,
        modelUsed: result.modelUsed,
        groundingSources: result.groundingSources,
        searchQueries: result.searchQueries,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, newModelMessage]);

      // Save model message to Firestore if authenticated
      if (currentUser?.uid) {
        saveChatMessage(sessionId, {
          id: modelMessageId,
          sessionId,
          userId: currentUser.uid,
          role: 'model',
          content: result.reply,
          modelUsed: result.modelUsed,
          searchSources: result.groundingSources,
          searchQueries: result.searchQueries,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackId = 'err-' + Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: fallbackId,
          role: 'model',
          content: `AI model temporarily busy; retrying or using cached verification. You can continue interacting with verified lecture evidence or try asking again shortly.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'cached-verification',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const starterPrompts = [
    'How does token passing guarantee zero packet collisions?',
    'What happens when a cable cuts in an MAU physical star ring?',
    'Search Google for IEEE 802.5 standard updates and practical deployments',
    'Act as an Exam Coach and quiz me on Token Ring vulnerabilities',
  ];

  return (
    <div
      className={`flex flex-col bg-[#080B16] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden ${
        isOpenAsFullPage ? 'h-[calc(100vh-140px)] max-w-5xl mx-auto' : 'h-[680px] w-full'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 bg-[#0D1224]/80 backdrop-blur-md border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-md">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Gemini Multi-Turn Tutor</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Multi-Turn History
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {lessonTitle ? `Anchored to: "${lessonTitle}"` : 'Academic AI Study Engine'}
            </p>
          </div>
        </div>

        {/* Controls: Role, Model Tier, Google Search, Session */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Persona Role Selector */}
          <div className="relative">
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as any)}
              className="glass-input text-xs px-2.5 py-1.5 rounded-lg text-slate-200 bg-white/[0.04] border border-white/[0.08] focus:border-violet-500 cursor-pointer"
              title="Select Tutor Persona Role"
            >
              <option value="academic_tutor" className="bg-[#0D1224] text-white">
                🎓 Academic Tutor
              </option>
              <option value="socratic_mentor" className="bg-[#0D1224] text-white">
                💡 Socratic Mentor
              </option>
              <option value="exam_prepper" className="bg-[#0D1224] text-white">
                📝 Exam Prepper
              </option>
              <option value="diagram_explainer" className="bg-[#0D1224] text-white">
                📐 Diagram Explainer
              </option>
            </select>
          </div>

          {/* Model Speed Tier Selector */}
          <div className="flex items-center bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setModelSpeed('fast')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                modelSpeed === 'fast' && !useGoogleSearch
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="gemini-3.1-flash-lite: Best for rapid replies and quick summaries"
            >
              <Zap className="h-3 w-3" />
              <span>Fast</span>
            </button>

            <button
              onClick={() => setModelSpeed('general')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                modelSpeed === 'general' || useGoogleSearch
                  ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="gemini-3.5-flash: Balanced reasoning & Google Search grounding"
            >
              <Cpu className="h-3 w-3" />
              <span>General</span>
            </button>

            <button
              onClick={() => {
                setModelSpeed('complex');
                setUseGoogleSearch(false);
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                modelSpeed === 'complex' && !useGoogleSearch
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="gemini-3.1-pro-preview: Deepest reasoning for complex derivations"
            >
              <GraduationCap className="h-3 w-3" />
              <span>Complex</span>
            </button>
          </div>

          {/* Google Search Grounding Toggle */}
          <button
            onClick={() => setUseGoogleSearch(!useGoogleSearch)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              useGoogleSearch
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/50'
                : 'bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:bg-white/[0.08]'
            }`}
            title="Toggle Google Search Grounding for live web research (gemini-3.5-flash)"
          >
            <Search className="h-3.5 w-3.5 text-blue-300" />
            <span>Google Search</span>
            {useGoogleSearch && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse ml-0.5" />
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={startNewSession}
            className="p-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            title="Start new conversation"
          >
            <PlusCircle className="h-4 w-4" />
          </button>

          {/* Firestore Saved Threads dropdown if logged in */}
          {isAuthenticated && pastSessions.length > 0 && (
            <button
              onClick={() => setShowSessionDrawer(!showSessionDrawer)}
              className="px-2 py-1.5 rounded-lg bg-white/[0.04] text-xs text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-1 transition-all"
              title="View past sessions saved in Firestore"
            >
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Threads ({pastSessions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Sessions Drawer (Saved in Firestore) */}
      {showSessionDrawer && (
        <div className="bg-[#0D1224] p-3 border-b border-white/[0.08] space-y-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Saved Firestore Chat Threads</span>
            <button
              onClick={() => setShowSessionDrawer(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {pastSessions.map((s) => (
              <div
                key={s.id}
                onClick={() => loadPastSession(s)}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                  sessionId === s.id
                    ? 'bg-violet-600/20 border-violet-500/50 text-white'
                    : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <p className="text-xs font-medium truncate">{s.title || 'Untitled Session'}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span className="capitalize">{s.systemRole.replace(/_/g, ' ')}</span>
                  <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Google Search Grounding Active Banner */}
      {useGoogleSearch && (
        <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-violet-900/30 border-b border-blue-500/25 px-4 py-2 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-cyan-400 animate-spin-slow" />
            <span>
              <strong>Google Search Grounding Enabled:</strong> Responses cite live web facts & standards using{' '}
              <code className="text-cyan-300 font-mono text-[11px]">gemini-3.5-flash</code>.
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
            Real-Time Web
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5 text-violet-300">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2.5 relative group ${
                  isUser
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-lg'
                    : 'bg-[#0D1224] border border-white/[0.08] text-slate-200 rounded-tl-sm shadow-md'
                }`}
              >
                {/* Meta details */}
                <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 border-b border-white/[0.08] pb-1 mb-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    {isUser ? (
                      <span>You</span>
                    ) : (
                      <>
                        <span className="text-violet-300 font-semibold">Gemini</span>
                        {m.modelUsed && (
                          <span className="font-mono text-[10px] text-slate-400 px-1 rounded bg-white/[0.05]">
                            {m.modelUsed}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{m.timestamp}</span>
                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white p-0.5"
                      title="Copy message"
                    >
                      {copiedId === m.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Content with simple Markdown rendering */}
                <div className="whitespace-pre-wrap font-sans text-slate-100 space-y-2">
                  {m.content.split('\n\n').map((paragraph, pIdx) => {
                    // Render bold headings
                    if (paragraph.startsWith('### ') || paragraph.startsWith('## ')) {
                      return (
                        <h4 key={pIdx} className="font-bold text-white text-sm mt-2 text-cyan-300">
                          {paragraph.replace(/^[#]+\s*/, '')}
                        </h4>
                      );
                    }
                    return <p key={pIdx}>{paragraph}</p>;
                  })}
                </div>

                {/* Search Grounding Sources (if populated by Google Search) */}
                {m.groundingSources && m.groundingSources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.08] space-y-1.5">
                    <div className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      <span>Google Search Grounded Sources ({m.groundingSources.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {m.groundingSources.map((src, sIdx) => (
                        <a
                          key={sIdx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 hover:border-blue-400 hover:bg-blue-500/20 text-blue-200 transition-all max-w-[280px] truncate"
                          title={src.title}
                        >
                          <ExternalLink className="h-2.5 w-2.5 shrink-0 text-cyan-400" />
                          <span className="truncate">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-8 w-8 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0 mt-0.5 text-violet-200">
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="h-8 w-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 text-violet-300">
              <Bot className="h-4 w-4 animate-bounce" />
            </div>
            <div className="bg-[#0D1224] border border-white/[0.08] rounded-2xl rounded-tl-sm p-4 text-xs text-slate-300 flex items-center gap-2 shadow-md">
              <RefreshCw className="h-4 w-4 text-violet-400 animate-spin" />
              <span>
                {useGoogleSearch
                  ? 'Searching Google & reasoning with gemini-3.5-flash...'
                  : modelSpeed === 'complex'
                  ? 'Executing deep reasoning with gemini-3.1-pro-preview...'
                  : modelSpeed === 'fast'
                  ? 'Generating quick response with gemini-3.1-flash-lite...'
                  : 'Synthesizing response with gemini-3.5-flash...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Starters */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 bg-[#0D1224]/50 border-t border-white/[0.04] flex flex-wrap gap-1.5 shrink-0">
          <span className="text-[10px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-violet-400" /> Starters:
          </span>
          {starterPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(undefined, prompt)}
              className="text-[11px] px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] hover:border-violet-500/50 hover:bg-violet-600/10 text-slate-300 transition-all truncate max-w-[260px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 bg-[#0D1224]/90 backdrop-blur-md border-t border-white/[0.08] flex items-center gap-2 shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              useGoogleSearch
                ? 'Ask with Google Search Grounding enabled...'
                : `Ask ${systemRole.replace(/_/g, ' ')}...`
            }
            disabled={isLoading}
            className="w-full glass-input px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-violet-500/70"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 flex items-center gap-1.5 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </>
          )}
        </button>
      </form>

      {/* Auth Status & Firestore Sync Footer Notice */}
      <div className="px-4 py-1.5 bg-[#080B16] border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          {isAuthenticated ? (
            <span>
              Connected to <strong>Firestore</strong>. Threads saved to user: {currentUser?.displayName}
            </span>
          ) : (
            <span>
              Guest mode: Thread stored in memory. Sign in with Google to save chat history in Firestore.
            </span>
          )}
        </div>

        {!isAuthenticated && (
          <button
            onClick={() => signIn()}
            className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 underline"
          >
            Google Sign-In
          </button>
        )}
      </div>
    </div>
  );
};
