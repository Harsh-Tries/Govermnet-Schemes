'use client';

import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onSelectQuestion: (question: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
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

export function SuggestedQuestions({ onSelectQuestion, isCollapsed, onToggleCollapse }: Props) {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(false);

  // Controlled or uncontrolled collapse state
  const collapsed = isCollapsed !== undefined ? isCollapsed : internalCollapsed;

  const handleToggle = () => {
    const nextState = !collapsed;
    if (onToggleCollapse) {
      onToggleCollapse(nextState);
    } else {
      setInternalCollapsed(nextState);
    }
  };

  const handleSelect = (q: string) => {
    onSelectQuestion(q);
    // Automatically minimize after selecting so user can read the answer
    if (onToggleCollapse) {
      onToggleCollapse(true);
    } else {
      setInternalCollapsed(true);
    }
  };

  if (collapsed) {
    return (
      <div className="flex items-center justify-between py-1 px-3 bg-slate-100/70 hover:bg-slate-200/70 border border-slate-200/80 rounded-xl transition-all">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 text-[11px] font-bold text-slate-600 hover:text-gov-blue transition-colors w-full text-left"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Suggested Maharashtra Citizen Queries ({MAHARASHTRA_SUGGESTIONS.length})</span>
          <span className="text-[10px] text-slate-400 font-normal ml-auto flex items-center gap-1">
            <span>Show suggestions</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Suggested Maharashtra Citizen Queries</span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
        >
          <span>Minimize</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
        {MAHARASHTRA_SUGGESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelect(q)}
            className="px-3 py-1.5 bg-white hover:bg-gov-blue/10 hover:text-gov-blue hover:border-gov-blue/30 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-all text-left shadow-2xs active:scale-[0.98]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
