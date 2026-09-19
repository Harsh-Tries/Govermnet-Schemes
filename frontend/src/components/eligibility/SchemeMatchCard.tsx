import React, { useState } from 'react';
import { ExternalLink, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { SchemeEvaluationResultDTO } from '../../services/intelligenceApi';
import { EligibilityStatusBadge } from './EligibilityStatusBadge';
import { EligibilityExplanationList } from './EligibilityExplanationList';
import { MissingInformationPrompt } from './MissingInformationPrompt';

interface Props {
  evaluation: SchemeEvaluationResultDTO;
  onUpdateProfile?: (updatedValues: Record<string, any>) => void;
}

export function SchemeMatchCard({ evaluation, onUpdateProfile }: Props) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="p-5 space-y-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {evaluation.scheme_name}
            </h3>
            {evaluation.short_description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {evaluation.short_description}
              </p>
            )}
          </div>
          <EligibilityStatusBadge status={evaluation.status} size="md" />
        </div>

        {/* Verification and Source Details */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
          {evaluation.official_source && (
            <a
              href={evaluation.official_source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gov-blue hover:underline font-semibold"
            >
              <span>Official Government Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {evaluation.last_verified_date && (
            <div className="flex items-center gap-1 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Verified: {evaluation.last_verified_date}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body: Explanations & Missing Information */}
      <div className="p-5 space-y-4 bg-slate-50/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <span>Deterministic Eligibility Rules ({evaluation.satisfied_conditions.length + evaluation.failed_conditions.length + evaluation.missing_information.length} Evaluated)</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {isExpanded && (
          <div className="space-y-4">
            <EligibilityExplanationList explanations={evaluation.explanations} />

            {evaluation.status === 'UNKNOWN' && evaluation.missing_information.length > 0 && (
              <MissingInformationPrompt
                missingParameters={evaluation.missing_information}
                onUpdateProfile={onUpdateProfile}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
