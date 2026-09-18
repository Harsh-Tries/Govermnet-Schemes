'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, Send, Lock } from 'lucide-react';

interface AiInputPlaceholderProps {
  onPromptSelect?: (prompt: string) => void;
}

const SUGGESTED_PROMPTS = [
  'Find scholarships',
  'Schemes for farmers',
  'Schemes for entrepreneurs',
  'Check my eligibility',
  'What documents do I need?'
];

export const AiInputPlaceholder: React.FC<AiInputPlaceholderProps> = ({ onPromptSelect }) => {
  const [inputQuery, setInputQuery] = useState('');

  const handlePromptClick = (prompt: string) => {
    setInputQuery(prompt);
    onPromptSelect?.(prompt);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-gov-blue to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-3xl">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-emerald-300 mb-4">
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>Conversational Scheme Assistant</span>
          <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
            RAG Phase 3 Concept
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
          Ask anything about Government Schemes & Scholarships
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          Conversational Q&A grounded strictly in verified policy guidelines. Explains eligibility, document checklists, and application steps without hallucination.
        </p>

        {/* Input Box */}
        <div className="relative mb-4">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about government schemes... (e.g., 'What schemes offer scholarships for OBC engineering students in MP?')"
            className="w-full pl-5 pr-14 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 focus:border-emerald-400 focus:bg-white/15 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all shadow-inner"
          />
          <button
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center"
            title="Ask AI Assistant (Concept UI)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested Prompts Pills */}
        <div>
          <p className="text-xs text-slate-400 font-medium mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Suggested questions:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handlePromptClick(prompt)}
                className="text-xs font-medium px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-all text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Governance Notice */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>AI answers will be strictly grounded in verified <code className="text-slate-300">.gov.in</code> source documents in Phase 3.</span>
        </div>
      </div>
    </div>
  );
};
