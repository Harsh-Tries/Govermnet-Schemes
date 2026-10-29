import React from 'react';
import Link from 'next/link';
import { Scheme } from '../../types/scheme';
import { ShieldCheck, ExternalLink, Bookmark, CheckCircle, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';

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
    const status = scheme.eligibilityStatus;
    if (status === 'FULLY_ELIGIBLE' || status === 'ELIGIBLE') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        icon: CheckCircle,
        text: 'Eligible'
      };
    }
    if (status === 'PARTIALLY_ELIGIBLE') {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        icon: AlertCircle,
        text: 'Partially Eligible'
      };
    }
    if (status === 'NOT_ELIGIBLE') {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-300',
        icon: AlertCircle,
        text: 'Not Eligible'
      };
    }
    if (status === 'CHECK_REQUIRED' || status === 'UNKNOWN') {
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-300',
        icon: HelpCircle,
        text: 'Info Needed'
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
  const schemeMinistry = scheme.ministry || scheme.administering_ministry || 'Government of Maharashtra';
  const schemeTargetUrl = scheme.officialUrl || (scheme.application_process?.official_application_url ?? null);
  const detailUrl = `/schemes/${scheme.slug || scheme.id}`;

  // Normalize category tags
  const categoryNames: string[] = Array.isArray(scheme.categories)
    ? scheme.categories.map((c: any) => (typeof c === 'string' ? c : c?.name || c?.code || '')).filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md transition-all flex flex-col justify-between group hover:border-slate-300">
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
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
          {schemeSummary}
        </p>

        {/* Category Pills */}
        {categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categoryNames.slice(0, 3).map((cat, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md"
              >
                {cat}
              </span>
            ))}
            {categoryNames.length > 3 && (
              <span className="text-[10px] font-medium text-slate-400 px-1 py-0.5">
                +{categoryNames.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="min-w-0 pr-1">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Benefit Ceiling</p>
          <p className="text-xs font-bold text-emerald-700 truncate">
            {scheme.benefitAmount || 'Direct Assistance'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Eligibility Badge */}
          {elBadge.isLink ? (
            <Link
              href="/eligibility"
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors ${elBadge.bg}`}
              title="Evaluate eligibility against your profile"
            >
              <ElIcon className="w-3.5 h-3.5" />
              <span>{elBadge.text}</span>
            </Link>
          ) : (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${elBadge.bg}`}
            >
              <ElIcon className="w-3.5 h-3.5" />
              <span>{elBadge.text}</span>
            </span>
          )}

          {/* Details Button */}
          <Link
            href={detailUrl}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Details
          </Link>

          {/* External Link Button */}
          {schemeTargetUrl ? (
            <a
              href={schemeTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gov-lightBlue text-gov-blue hover:bg-gov-blue hover:text-white transition-colors"
              title="Visit Official Government Portal"
              aria-label="Open official scheme portal"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <span
              className="p-2 rounded-lg bg-slate-100 text-slate-300 cursor-not-allowed"
              title="Official portal URL unavailable"
            >
              <ExternalLink className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
