import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  onSelectQuestion: (question: string) => void;
}

const SUGGESTIONS = [
  "What scholarships can I apply for?",
  "I am a farmer in Maharashtra. What schemes are available?",
  "I am a student with income of 2 lakh. Which schemes do I qualify for?",
  "What documents do I need to apply?",
  "How do I apply for government schemes?",
  "Why am I not eligible for this scholarship?"
];

export function SuggestedQuestions({ onSelectQuestion }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Suggested Citizen Queries</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-gov-blue/10 hover:text-gov-blue hover:border-gov-blue/30 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-all text-left"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
