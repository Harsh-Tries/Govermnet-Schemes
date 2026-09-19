import React from 'react';
import { User, Bot, ExternalLink, Calendar, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { EligibilityStatusBadge } from '../eligibility/EligibilityStatusBadge';
import { EligibilityExplanationList } from '../eligibility/EligibilityExplanationList';
import { MissingInformationPrompt } from '../eligibility/MissingInformationPrompt';

export interface ChatMessageData {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  intent?: string;
  schemes?: any[];
  eligibility_results?: any[];
  sources?: Array<{ title: string; url: string; last_verified?: string }>;
  missing_information?: string[];
  requires_clarification?: boolean;
}

interface Props {
  message: ChatMessageData;
  onUpdateProfile?: (updatedValues: Record<string, any>) => void;
}

export function ChatMessage({ message, onUpdateProfile }: Props) {
  const isUser = message.role === 'USER';

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 max-w-3xl ml-auto">
        <div className="bg-gov-blue text-white px-4 py-3 rounded-2xl rounded-tr-sm text-xs font-medium shadow-sm">
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 max-w-4xl mr-auto">
      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
        <Bot className="w-4 h-4" />
      </div>

      <div className="space-y-4 flex-1">
        {/* Main Text Message Bubble */}
        <div className="bg-white border border-slate-200 text-slate-800 px-5 py-4 rounded-2xl rounded-tl-sm text-xs font-normal leading-relaxed shadow-sm space-y-2">
          {message.intent && (
            <div className="inline-block bg-slate-100 text-slate-600 font-extrabold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
              INTENT: {message.intent.replace(/_/g, ' ')}
            </div>
          )}
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Sources and Citations */}
          {message.sources && message.sources.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700">Official Citations:</span>
              {message.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-gov-blue hover:underline font-medium"
                >
                  <span>{s.title}</span>
                  <ExternalLink className="w-3 h-3" />
                  {s.last_verified && (
                    <span className="text-slate-400 text-[10px] ml-1">(Verified: {s.last_verified})</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Embedded Eligibility Result Cards */}
        {message.eligibility_results && message.eligibility_results.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Phase 3 Deterministic Eligibility Results</span>
            </h4>
            {message.eligibility_results.map((res: any, idx: number) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="font-bold text-slate-900 text-xs">{res.scheme_name || 'Government Scheme'}</h5>
                  <EligibilityStatusBadge status={res.status} size="sm" />
                </div>

                {res.explanations && res.explanations.length > 0 && (
                  <EligibilityExplanationList explanations={res.explanations} />
                )}

                {res.status === 'UNKNOWN' && res.missing_information && res.missing_information.length > 0 && (
                  <MissingInformationPrompt
                    missingParameters={res.missing_information}
                    onUpdateProfile={onUpdateProfile}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
