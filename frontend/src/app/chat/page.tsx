'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, RefreshCw, AlertCircle, ShieldCheck, Cpu, History, Plus, Trash2, X, MessageSquare } from 'lucide-react';
import { sendAssistantQuery, fetchConversations, fetchAssistantStatus, deleteConversation, ConversationDTO, AssistantStatusDTO } from '../../services/chatApi';
import { ChatMessage, ChatMessageData } from '../../components/chat/ChatMessage';
import { SuggestedQuestions } from '../../components/chat/SuggestedQuestions';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: 'welcome',
      role: 'ASSISTANT',
      content: 'Namaste! I am the AI Maharashtra Government Schemes Assistant. Ask me anything about genuine welfare schemes, scholarships, eligibility requirements, official document checklists, or application procedures.'
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatusDTO | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSuggestionsCollapsed, setIsSuggestionsCollapsed] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversationHistory();
    loadAssistantStatus();
  }, []);

  const loadConversationHistory = async () => {
    const list = await fetchConversations();
    setConversations(list);
  };

  const loadAssistantStatus = async () => {
    const st = await fetchAssistantStatus();
    setAssistantStatus(st);
  };

  const startNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'ASSISTANT',
        content: 'Namaste! How can I help you discover Maharashtra government schemes today?'
      }
    ]);
    setConversationId(undefined);
    setIsSuggestionsCollapsed(false);
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
    setIsSuggestionsCollapsed(true);
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

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = textToSend || inputValue;
    if (!queryText.trim() || isLoading) return;

    // Immediately collapse suggested questions so the answer is clearly readable
    setIsSuggestionsCollapsed(true);

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessageData[] = [
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
          missing_information: resp.missing_information,
          requires_clarification: resp.requires_clarification
        }
      ]);

      // Refresh conversations in sidebar to reflect newly saved session
      loadConversationHistory();
    } catch (err: any) {
      console.warn('AI Assistant query failed:', err);
      setError(err.message || 'Unable to reach the AI Assistant service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleProfileUpdateFromCard = (updatedValues: Record<string, any>) => {
    const paramSummary = Object.entries(updatedValues)
      .map(([k, v]) => `${k.replace(/_/g, ' ')} is ${v}`)
      .join(', ');
    handleSendMessage(`My profile details: ${paramSummary}`);
  };

  return (
    <div className="flex gap-4 max-w-7xl mx-auto h-[calc(100vh-6rem)] relative">
      {/* Left Sidebar: Conversations History */}
      <div
        className={`${
          isSidebarOpen ? 'flex' : 'hidden'
        } flex-col w-72 bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm z-20 shrink-0 transition-all`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gov-blue" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              History ({conversations.length})
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-gov-blue hover:bg-gov-blue/10 px-2 py-1 rounded-lg transition-colors"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No chat history yet</p>
              <p className="text-[10px] text-slate-400 mt-1">Your queries will appear here</p>
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
                      ? 'bg-gov-blue/10 text-gov-blue border-gov-blue/30 shadow-2xs font-semibold'
                      : 'hover:bg-slate-50 text-slate-700 border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="truncate text-xs">{c.title || 'Scheme Inquiry'}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formattedDate}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all shrink-0"
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

      {/* Main Conversational Feed & Input */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-w-0">
        {/* Header with History Toggle & Provider Badge */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isSidebarOpen
                  ? 'bg-gov-blue text-white border-gov-blue'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle Conversation History"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">
                {isSidebarOpen ? 'Hide History' : `History (${conversations.length})`}
              </span>
            </button>

            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Bot className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Maharashtra Schemes AI Assistant
                </h2>
                {assistantStatus && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                      assistantStatus.is_mock
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : assistantStatus.status === 'READY'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {assistantStatus.is_mock ? (
                      <>
                        <Cpu className="w-3 h-3 text-amber-600" />
                        <span>Mock Mode</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Live ({assistantStatus.model})</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Source-Grounded • Deterministic Rules • Official .gov.in Citations
              </p>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              onUpdateProfile={handleProfileUpdateFromCard}
            />
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium animate-pulse py-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-700 flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <span>Searching verified knowledge base & evaluating Phase 3 eligibility rules...</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Chips & Input Form */}
        <div className="p-3.5 border-t border-slate-100 space-y-2.5 bg-slate-50/30">
          <SuggestedQuestions
            onSelectQuestion={(q) => handleSendMessage(q)}
            isCollapsed={isSuggestionsCollapsed}
            onToggleCollapse={(c) => setIsSuggestionsCollapsed(c)}
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              rows={2}
              placeholder="Ask about scholarships, Ladki Bahin, Namo Shetkari, eligibility, documents... (Press Enter to send, Shift+Enter for newline)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none shadow-sm resize-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-4 py-2.5 bg-gov-blue hover:bg-gov-blue/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm h-10 shrink-0"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
