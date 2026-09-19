import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react';

interface Props {
  explanations: string[];
}

export function EligibilityExplanationList({ explanations }: Props) {
  if (!explanations || explanations.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic">No detailed rule explanations available.</div>
    );
  }

  return (
    <ul className="space-y-2">
      {explanations.map((exp, idx) => {
        let icon = null;
        let textColor = 'text-slate-700';

        if (exp.startsWith('✓')) {
          icon = (
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          );
          textColor = 'text-emerald-900';
        } else if (exp.startsWith('✗')) {
          icon = (
            <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
              <X className="w-3 h-3 stroke-[3]" />
            </div>
          );
          textColor = 'text-rose-900';
        } else if (exp.startsWith('?')) {
          icon = (
            <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle className="w-3 h-3 stroke-[3]" />
            </div>
          );
          textColor = 'text-amber-900';
        } else {
          icon = (
            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold">•</span>
            </div>
          );
        }

        // Clean out leading symbol for clean display if present
        const cleanText = exp.replace(/^[✓✗?]\s*/, '');

        return (
          <li key={idx} className="flex items-start gap-2.5 text-xs">
            {icon}
            <span className={`font-medium leading-relaxed ${textColor}`}>{cleanText}</span>
          </li>
        );
      })}
    </ul>
  );
}
