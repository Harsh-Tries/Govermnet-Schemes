import React from 'react';
import Link from 'next/link';
import { Scheme } from '../../types/scheme';
import { getVerifiedPortalInfo, isSafeGovUrl } from '../../services/schemesApi';
import { ShieldCheck, ExternalLink, Bookmark, CheckCircle, AlertCircle, HelpCircle, ChevronRight, Sparkles } from 'lucide-react';

interface SchemeCardProps {
  scheme: Scheme & {
    match_score?: number;
    explanation_factors?: string[];
    review_notes?: string[];
    portal_name?: string;
    action_label?: string;
    is_direct_application?: boolean;
    department?: string;
  };
  onBookmarkToggle?: (id: string) => void;
  isBookmarked?: boolean;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  onBookmarkToggle,
  isBookmarked = false,
}) => {
  const governmentLevel = scheme.government_level || scheme.level || 'STATE';

  const getLevelBadge = () => {
    switch (governmentLevel) {
      case 'STATE':
        return {
          label: 'Maharashtra State',
          style: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
        };
      case 'CENTRALLY_SPONSORED':
        return {
          label: 'Centrally Sponsored',
          style: 'bg-sky-50 text-sky-800 border-sky-300 font-bold'
        };
      case 'CENTRAL':
      default:
        return {
          label: 'Central Government',
          style: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold'
        };
    }
  };

  const levelBadge = getLevelBadge();

  // Status mapping
  const getEligibilityBadge = () => {
    const rawStatus = (scheme as any).eligibility_status || scheme.eligibilityStatus;
    if (rawStatus === 'FULLY_ELIGIBLE' || rawStatus === 'ELIGIBLE') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: CheckCircle,
        text: 'Eligible'
      };
    }
    if (rawStatus === 'CHECK_REQUIRED' || rawStatus === 'CRITERIA_REVIEW_NEEDED') {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: AlertCircle,
        text: 'Criteria Review Needed'
      };
    }
    if (rawStatus === 'PARTIALLY_ELIGIBLE') {
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-300',
        icon: HelpCircle,
        text: 'Partially Eligible'
      };
    }
    if (rawStatus === 'NOT_ELIGIBLE') {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-300',
        icon: AlertCircle,
        text: 'Not Eligible'
      };
    }
    // Default neutral unassessed status
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80',
      icon: HelpCircle,
      text: 'Check Eligibility',
      isLink: true
    };
  };

  const elBadge = getEligibilityBadge();
  const ElIcon = elBadge.icon;

  const schemeTitle = scheme.title || scheme.name || 'Maharashtra Scheme';
  const schemeSummary = scheme.summary || scheme.short_description || scheme.description || '';
  const schemeMinistry = (scheme as any).department || scheme.ministry || scheme.administering_ministry || 'Government of Maharashtra';
  
  // Resolve official application URL safely
  const candidateUrl = scheme.officialUrl || (scheme.application_process?.official_application_url ?? null);
  const safeTargetUrl = isSafeGovUrl(candidateUrl) ? candidateUrl : null;
  const portalInfo = getVerifiedPortalInfo(safeTargetUrl);
  const detailUrl = `/schemes/${scheme.slug || scheme.id}`;

  // Normalize category tags
  const categoryNames: string[] = Array.isArray(scheme.categories)
    ? scheme.categories.map((c: any) => (typeof c === 'string' ? c : c?.name || c?.code || '')).filter(Boolean)
    : [];

  const explanationFactors = scheme.explanation_factors || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-card hover:border-slate-300 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges & Bookmark Action */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${levelBadge.style}`}
            >
              {levelBadge.label}
            </span>
            {scheme.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
            {scheme.match_score !== undefined && scheme.match_score > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gov-blue/10 text-gov-blue border border-gov-blue/20">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{scheme.match_score}% Match</span>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBookmarkToggle?.(scheme.id);
            }}
            className={`p-1.5 rounded-lg border transition-all ${
              isBookmarked
                ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={isBookmarked ? 'Remove from Saved Schemes' : 'Save Scheme'}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark scheme'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Scheme Title */}
        <Link href={detailUrl}>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-gov-blue transition-colors line-clamp-2 mb-1.5 cursor-pointer leading-snug">
            {schemeTitle}
          </h4>
        </Link>

        {/* Ministry Subtitle */}
        <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-1">
          {schemeMinistry}
        </p>

        {/* Summary */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
          {schemeSummary}
        </p>

        {/* Transparent Match Explanations */}
        {explanationFactors.length > 0 && (
          <div className="mb-3 space-y-1 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-[11px]">
            {explanationFactors.slice(0, 2).map((factor, idx) => (
              <p
                key={idx}
                className={`flex items-start gap-1 leading-tight ${
                  factor.startsWith('✓')
                    ? 'text-emerald-800'
                    : factor.startsWith('⚠')
                    ? 'text-amber-800 font-medium'
                    : 'text-slate-700'
                }`}
              >
                <span>{factor}</span>
              </p>
            ))}
          </div>
        )}

        {/* Category Pills */}
        {categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categoryNames.slice(0, 3).map((cat, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Working Action Buttons */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 pr-1">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Benefit Ceiling</p>
            <p className="text-xs font-bold text-emerald-700 truncate">
              {scheme.benefitAmount || 'Direct Assistance'}
            </p>
          </div>

          {/* Eligibility Badge */}
          {elBadge.isLink ? (
            <Link
              href="/eligibility"
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors ${elBadge.bg}`}
              title="Evaluate eligibility against your profile"
            >
              <ElIcon className="w-3.5 h-3.5" />
              <span>{elBadge.text}</span>
            </Link>
          ) : (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${elBadge.bg}`}
            >
              <ElIcon className="w-3.5 h-3.5" />
              <span>{elBadge.text}</span>
            </span>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
          {/* Details Button */}
          <Link
            href={detailUrl}
            className="flex-1 py-1.5 px-3 text-center text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1"
          >
            <span>Details</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Working Verified Apply Portal Button */}
          {safeTargetUrl ? (
            <a
              href={safeTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-3 text-center text-xs font-bold rounded-xl bg-gov-blue hover:bg-gov-blue/90 text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
              title={`Open ${portalInfo.portalName} in a new tab`}
              aria-label={`Open ${portalInfo.portalName} in a new tab`}
            >
              <span className="truncate">{portalInfo.actionLabel || 'Apply Portal'}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          ) : (
            <span
              className="flex-1 py-1.5 px-3 text-center text-xs font-medium rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center gap-1"
              title="Official portal URL under verification"
            >
              <span>Official Info</span>
              <ExternalLink className="w-3 h-3 opacity-40" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
