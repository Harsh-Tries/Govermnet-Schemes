import React from 'react';
import { Scheme } from '../../types/scheme';
import { ShieldCheck, ExternalLink, Bookmark, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface SchemeCardProps {
  scheme: Scheme;
  onBookmarkToggle?: (id: string) => void;
  isBookmarked?: boolean;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  onBookmarkToggle,
  isBookmarked = false,
}) => {
  const statusStyles = {
    FULLY_ELIGIBLE: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle,
      text: 'Fully Eligible'
    },
    PARTIALLY_ELIGIBLE: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertCircle,
      text: 'Partially Eligible'
    },
    CHECK_REQUIRED: {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: HelpCircle,
      text: 'Info Needed'
    }
  };

  const status = scheme.eligibilityStatus ? statusStyles[scheme.eligibilityStatus] : null;
  const StatusIcon = status ? status.icon : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {scheme.level.replace('_', ' ')}
            </span>
            {scheme.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>
          <button
            onClick={() => onBookmarkToggle?.(scheme.id)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isBookmarked
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Save Scheme"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Scheme Title */}
        <h4 className="text-base font-bold text-slate-900 group-hover:text-gov-blue transition-colors line-clamp-2 mb-1.5">
          {scheme.title}
        </h4>

        {/* Ministry Subtitle */}
        <p className="text-xs text-slate-500 font-medium mb-3">
          {scheme.ministry}
        </p>

        {/* Summary */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
          {scheme.summary}
        </p>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {scheme.categories.map((cat) => (
            <span key={cat} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Benefit Ceiling</p>
          <p className="text-xs font-bold text-emerald-700">{scheme.benefitAmount}</p>
        </div>

        <div className="flex items-center gap-2">
          {status && StatusIcon && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${status.bg}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.text}
            </span>
          )}
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gov-lightBlue text-gov-blue hover:bg-gov-blue hover:text-white transition-colors"
            title="Visit Official Portal"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
