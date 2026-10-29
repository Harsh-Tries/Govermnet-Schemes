'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, Send, ShieldCheck } from 'lucide-react';

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
  const router = useRouter();
  const [inputQuery, setInputQuery] = useState('');

  const handleSubmit = (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;
    if (onPromptSelect) {
      onPromptSelect(q);
    }
    router.push(`/assistant?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(inputQuery);
    }
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
          <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-400/30">
            Live Intelligence
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
          Ask anything about Maharashtra Government Schemes & Scholarships
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          Conversational Q&A grounded strictly in verified policy guidelines. Explains eligibility, document checklists, and application steps without hallucination.
        </p>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(inputQuery);
          }}
          className="relative mb-4"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about government schemes... (e.g., 'Find scholarships', 'Schemes for farmers', 'Ladki Bahin documents')"
            className="w-full pl-5 pr-14 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 focus:border-emerald-400 focus:bg-white/15 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center cursor-pointer"
            title="Ask Government Scheme Assistant"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

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
                type="button"
                onClick={() => handleSubmit(prompt)}
                className="text-xs font-medium px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 hover:text-white transition-all text-left cursor-pointer active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Governance Notice */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>AI answers are strictly grounded in verified <code className="text-emerald-300 font-mono">.gov.in</code> official source documents with zero hallucination.</span>
        </div>
      </div>
    </div>
  );
};
