'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, AlertCircle, Sliders } from 'lucide-react';
import { sendAssistantQuery, fetchConversations, ConversationDTO } from '../../services/chatApi';
import { ChatMessage, ChatMessageData } from '../../components/chat/ChatMessage';
import { SuggestedQuestions } from '../../components/chat/SuggestedQuestions';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: 'welcome',
      role: 'ASSISTANT',
      content: 'Namaste! I am the AI Government Scheme Assistant. Ask me anything about Indian government schemes, scholarships, eligibility requirements, documents, or application procedures.'
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [conversations, setConversations] = useState<ConversationDTO[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    const list = await fetchConversations();
    setConversations(list);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = textToSend || inputValue;
    if (!queryText.trim() || isLoading) return;

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

      const asstMsgId = `asst-${Date.now()}`;
      setMessages(prev => [
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

      loadConversationHistory();
    } catch (err: any) {
      console.warn('AI Assistant query failed:', err);
      setError(err.message || 'Unable to reach the AI Assistant service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdateFromCard = (updatedValues: Record<string, any>) => {
    const paramSummary = Object.entries(updatedValues)
      .map(([k, v]) => `${k.replace(/_/g, ' ')} is ${v}`)
      .join(', ');
    handleSendMessage(`My profile details: ${paramSummary}`);
  };

  return (
    <div className="flex gap-6 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
      {/* Left Sidebar: Recent Conversations */}
      <div className="hidden lg:flex flex-col w-64 bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Conversations</h3>
          <button
            onClick={() => {
              setMessages([{
                id: 'welcome',
                role: 'ASSISTANT',
                content: 'Namaste! How can I help you discover government schemes today?'
              }]);
              setConversationId(undefined);
            }}
            className="text-[11px] font-bold text-gov-blue hover:underline"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setConversationId(c.id);
                setMessages(c.messages.map(m => ({
                  id: m.id,
                  role: m.role as any,
                  content: m.content,
                  intent: m.metadata?.intent,
                  sources: m.metadata?.sources
                })));
              }}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-colors ${
                conversationId === c.id ? 'bg-gov-blue/10 text-gov-blue border border-gov-blue/20' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <p className="truncate font-semibold">{c.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(c.updated_at).toLocaleDateString()}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversational Feed & Input */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">AI Government Scheme Assistant</h2>
              <p className="text-[11px] text-slate-500">Source-Grounded • Deterministic Eligibility • Verified Official Citations</p>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              onUpdateProfile={handleProfileUpdateFromCard}
            />
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium animate-pulse">
              <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-700 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <span>Searching verified knowledge base & evaluating Phase 3 eligibility engine...</span>
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
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/30">
          <SuggestedQuestions onSelectQuestion={(q) => handleSendMessage(q)} />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              placeholder="Ask about scholarships, farmer support, required documents, or eligibility..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none shadow-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-5 py-3 bg-gov-blue hover:bg-gov-blue/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm"
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
