'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  History, 
  Plus, 
  Trash2, 
  X, 
  MessageSquare,
  CheckCircle2,
  FileText,
  ChevronRight,
  Landmark,
  User
} from 'lucide-react';
import { 
  sendAssistantQuery, 
  fetchConversations, 
  fetchAssistantStatus, 
  deleteConversation, 
  ConversationDTO, 
  AssistantStatusDTO 
} from '../../services/chatApi';

const SUGGESTED_QUESTIONS = [
  'Find scholarships',
  'Schemes for farmers',
  'Schemes for entrepreneurs',
  'Check my eligibility',
  'What documents do I need?'
];

interface ChatMessageItem {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  intent?: string;
  schemes?: any[];
  eligibility_results?: any[];
  sources?: Array<{ title: string; url: string; last_verified?: string }>;
  requires_clarification?: boolean;
}

function AssistantContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('query') || '';

  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome',
      role: 'ASSISTANT',
      content: 'Namaste! I am your AI Maharashtra Government Schemes Assistant. Ask me anything about genuine welfare schemes, scholarships, eligibility requirements, official document checklists, or application procedures.'
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatusDTO | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSubmitted = useRef<boolean>(false);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadConversationHistory = async () => {
    const list = await fetchConversations();
    setConversations(list);
  };

  const loadAssistantStatus = async () => {
    const st = await fetchAssistantStatus();
    setAssistantStatus(st);
  };

  useEffect(() => {
    loadConversationHistory();
    loadAssistantStatus();
  }, []);

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const queryText = (textToSend || inputValue).trim();
    if (!queryText || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessageItem[] = [
      ...messages,
      { id: userMsgId, role: 'USER', content: queryText }
    ];

    setMessages(newMessages);
    if (!textToSend) setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const resp = await sendAssistantQuery(queryText, conversationId);

      if (resp.conversation_id) {
        setConversationId(resp.conversation_id);
      }

      if (resp.provider_info) {
        setAssistantStatus(resp.provider_info);
      }

      const asstMsgId = `asst-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: asstMsgId,
          role: 'ASSISTANT',
          content: resp.message,
          intent: resp.intent,
          schemes: resp.schemes,
          eligibility_results: resp.eligibility_results,
          sources: resp.sources,
          requires_clarification: resp.requires_clarification
        }
      ]);

      loadConversationHistory();
    } catch (err: any) {
      console.warn('AI Assistant query failed:', err);
      setError(err.message || 'Unable to connect to the Government Scheme AI Assistant.');
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, conversationId]);

  // Handle URL pre-query auto-submission
  useEffect(() => {
    if (initialQuery && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, handleSendMessage]);

  const startNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'ASSISTANT',
        content: 'Namaste! How can I help you discover Maharashtra government welfare schemes or scholarships today?'
      }
    ]);
    setConversationId(undefined);
    setError(null);
  };

  const selectConversation = (c: ConversationDTO) => {
    setConversationId(c.id);
    if (c.messages && c.messages.length > 0) {
      setMessages(
        c.messages.map((m) => ({
          id: m.id,
          role: m.role as any,
          content: m.content,
          intent: m.metadata?.intent,
          sources: m.metadata?.sources,
          requires_clarification: m.metadata?.requires_clarification
        }))
      );
    } else {
      setMessages([
        {
          id: `conv-start-${c.id}`,
          role: 'ASSISTANT',
          content: `Loaded conversation: "${c.title}". Ask any follow-up question below.`
        }
      ]);
    }
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await deleteConversation(id);
    if (ok) {
      if (conversationId === id) {
        startNewChat();
      }
      loadConversationHistory();
    }
  };

  return (
    <div className="flex gap-4 max-w-7xl mx-auto h-[calc(100vh-5.5rem)] relative">
      {/* History Sidebar Drawer */}
      <div
        className={`${
          isSidebarOpen ? 'flex' : 'hidden'
        } lg:flex flex-col w-72 bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-2xl shrink-0 z-20 text-white`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Chat History ({conversations.length})
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg"
              title="Close history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p>No chat history yet</p>
              <p className="text-[10px] text-slate-600 mt-1">Your questions will appear here</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = conversationId === c.id;
              const formattedDate = new Date(c.updated_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              });
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  className={`group relative flex items-center justify-between w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-gov-blue/30 text-emerald-300 border-gov-blue/50 shadow-inner'
                      : 'hover:bg-slate-800/80 text-slate-300 border-transparent hover:border-slate-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="truncate text-xs font-medium">{c.title || 'Scheme Inquiry'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formattedDate}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition-all shrink-0 cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Dark-Blue AI Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-gov-navy border border-slate-800 rounded-3xl overflow-hidden shadow-2xl min-w-0 text-white relative">
        {/* Glow ambient background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Toggle History"
            >
              <History className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <Bot className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white tracking-tight truncate">
                  Maharashtra Schemes AI Assistant
                </h2>
                {assistantStatus && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      assistantStatus.is_mock
                        ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                        : assistantStatus.status === 'READY'
                        ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
                        : 'bg-rose-400/10 text-rose-300 border-rose-400/30'
                    }`}
                  >
                    {assistantStatus.is_mock ? (
                      <>
                        <Cpu className="w-3 h-3 text-amber-400" />
                        <span>Deterministic Engine</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Live ({assistantStatus.model})</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                <span>Verified .gov.in Citations</span>
                <span>•</span>
                <span>Deterministic Phase 3 Rules</span>
                <span>•</span>
                <span>Zero Hallucination</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewChat}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Inquiry</span>
            </button>
          </div>
        </div>

        {/* Suggested Questions Strip */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto z-10">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Suggested:</span>
          </span>
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              className="text-xs font-medium px-3 py-1 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/40 text-slate-300 transition-all whitespace-nowrap cursor-pointer active:scale-95 shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 z-10">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'ASSISTANT' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'USER'
                    ? 'bg-gov-blue text-white rounded-tr-none shadow-md'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none shadow-lg'
                }`}
              >
                {/* Intent Tag (for Assistant Messages) */}
                {m.role === 'ASSISTANT' && m.intent && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-emerald-300 mb-2 border border-white/10">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{m.intent.replace(/_/g, ' ')}</span>
                  </div>
                )}

                {/* Main Message Content */}
                <div className="whitespace-pre-wrap space-y-2">
                  {m.content}
                </div>

                {/* Grounded Scheme Cards (if returned) */}
                {m.schemes && m.schemes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/70 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-sky-400" />
                      <span>Retrieved Verified Schemes ({m.schemes.length})</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {m.schemes.map((s, idx) => (
                        <div
                          key={s.id || idx}
                          className="bg-slate-900/90 border border-slate-700 rounded-xl p-3 space-y-1.5 hover:border-slate-500 transition-all text-xs"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-white line-clamp-1">
                              {s.name}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                              Verified
                            </span>
                          </div>
                          {s.short_description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {s.short_description}
                            </p>
                          )}
                          <div className="pt-1 flex items-center justify-between text-[11px]">
                            <Link
                              href={`/schemes/${s.slug || s.id}`}
                              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 hover:underline"
                            >
                              <span>Details</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                            {s.official_source && (
                              <a
                                href={s.official_source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                <span>Portal</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Eligibility Breakdown (if evaluated) */}
                {m.eligibility_results && m.eligibility_results.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/70 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Phase 3 Rules Engine Evaluation</span>
                    </p>
                    <div className="space-y-1.5">
                      {m.eligibility_results.map((el, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-slate-200">
                            {el.scheme_name || 'Scheme Evaluation'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              el.status === 'ELIGIBLE'
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600'
                                : el.status === 'NOT_ELIGIBLE'
                                ? 'bg-rose-900/60 text-rose-300 border border-rose-600'
                                : 'bg-amber-900/60 text-amber-300 border border-amber-600'
                            }`}
                          >
                            {el.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Source Citations */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Official Citations ({m.sources.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-950 border border-slate-700 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {m.role === 'USER' && (
                <div className="w-8 h-8 rounded-xl bg-gov-blue/40 border border-gov-blue text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-emerald-400 font-medium animate-pulse py-2 pl-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>Searching verified knowledge base & evaluating Phase 3 eligibility rules...</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 rounded-lg text-white font-bold text-[11px] transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Controls Bar */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 z-10 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about scholarships, farmers, Ladki Bahin, documents, eligibility... (Press Enter to send)"
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700/80 focus:border-emerald-400 focus:bg-slate-900/90 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs sm:text-sm rounded-2xl flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Deterministic RAG • Grounded in official Maharashtra portals (.gov.in)</span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
          Loading AI Government Scheme Assistant...
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
