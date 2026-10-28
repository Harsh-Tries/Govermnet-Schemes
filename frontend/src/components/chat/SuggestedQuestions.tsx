import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  onSelectQuestion: (question: string) => void;
}

const MAHARASHTRA_SUGGESTIONS = [
  "Which scholarships can Maharashtra students apply for?",
  "What schemes are available for farmers in Maharashtra?",
  "What documents are required for Ladki Bahin Yojana?",
  "What is the application process for Namo Shetkari Mahasanman Nidhi Yojana?",
  "Am I eligible for Rajarshi Shahu Maharaj EBC scholarship?",
  "Which government schemes support eligible senior citizens in Maharashtra?",
  "What is the difference between a Maharashtra state scheme and a central scheme?",
  "What health coverage is provided under Mahatma Jyotirao Phule Jan Arogya Yojana?"
];

export function SuggestedQuestions({ onSelectQuestion }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Suggested Maharashtra Citizen Queries</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {MAHARASHTRA_SUGGESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-gov-blue/10 hover:text-gov-blue hover:border-gov-blue/30 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-all text-left shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
