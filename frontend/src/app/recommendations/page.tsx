'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Bookmark,
  ArrowRight,
  Filter,
  UserCheck,
  RefreshCw,
  Landmark,
  ShieldCheck,
  GraduationCap,
  Tractor,
  HeartHandshake,
  Store,
  Accessibility,
  ChevronRight
} from 'lucide-react';
import {
  fetchPersonalizedRecommendations,
  RecommendationsResponse,
  RecommendationItem
} from '../../services/profileApi';
import { fetchBookmarkedSchemeIds, toggleSchemeBookmark } from '../../services/schemesApi';
import { authStorage } from '../../services/authApi';

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('TOP');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const recs = await fetchPersonalizedRecommendations();
      setData(recs);

      // Load bookmarks
      const user = authStorage.getUser();
      const userId = user?.id || 'demo-citizen-user';
      try {
        const ids = await fetchBookmarkedSchemeIds(userId);
        setBookmarkedIds(ids);
      } catch {
        // Fallback gracefully
      }
    } catch (err: any) {
      console.error('Failed to load personalized recommendations:', err);
      setError('Unable to load personalized recommendations. Please ensure you have completed your profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookmarkToggle = async (schemeId: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(schemeId);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== schemeId) : [...prev, schemeId]
    );

    const user = authStorage.getUser();
    const userId = user?.id || 'demo-citizen-user';
    await toggleSchemeBookmark(schemeId, isCurrentlyBookmarked, userId);
  };

  // Determine which list to display
  const getActiveList = (): RecommendationItem[] => {
    if (!data) return [];
    switch (activeTab) {
      case 'TOP':
        return data.top_matches;
      case 'SCHOLARSHIPS':
        return data.scholarships;
      case 'FARMERS':
        return data.farmer_schemes;
      case 'WOMEN':
        return data.women_schemes;
      case 'MSME':
        return data.msme_schemes;
      case 'DISABILITY':
        return data.disability_and_social;
      case 'ALL':
      default:
        return data.all_recommendations;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ELIGIBLE':
      case 'FULLY_ELIGIBLE':
        return {
          label: 'Eligible',
          style: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: CheckCircle
        };
      case 'PARTIALLY_ELIGIBLE':
        return {
          label: 'Partially Eligible',
          style: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: AlertCircle
        };
      case 'NOT_ELIGIBLE':
        return {
          label: 'Not Eligible',
          style: 'bg-rose-50 text-rose-800 border-rose-300',
          icon: AlertCircle
        };
      default:
        return {
          label: 'Criteria Review Needed',
          style: 'bg-blue-50 text-blue-800 border-blue-300',
          icon: HelpCircle
        };
    }
  };

  const activeList = getActiveList();

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-gov-lightBlue/50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-blue/10 border border-gov-blue/20 text-gov-blue text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-gov-blue" />
              <span>Deterministic Eligibility &amp; Personalization Engine</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Personalized Schemes for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-blue via-teal-700 to-gov-orange">
                {data?.citizen_summary.name || 'Maharashtra Citizen'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every card shows an exact match score and transparent reasons explaining why your residency, income, and category qualify under Maharashtra government guidelines.
            </p>

            {/* Profile Attributes Strip */}
            {data?.citizen_summary && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-700 shadow-sm">
                  📍 {data.citizen_summary.district}
                </span>
                <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-700 shadow-sm">
                  💼 {data.citizen_summary.occupation}
                </span>
                <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-700 shadow-sm">
                  💰 ₹{Number(data.citizen_summary.income).toLocaleString('en-IN')}/year
                </span>
                <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-medium text-slate-700 shadow-sm">
                  🏷️ {data.citizen_summary.category}
                </span>
              </div>
            )}
          </div>

          {/* Action to Retake / Edit Profile */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-5 py-2.5 bg-gov-blue hover:bg-gov-blue/90 text-white font-semibold rounded-xl text-xs shadow-md shadow-gov-blue/20 flex items-center justify-center gap-2 transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>Update My Profile</span>
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Matches</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('TOP')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'TOP'
              ? 'bg-gov-blue text-white shadow-md shadow-gov-blue/20'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Top Matches</span>
          {data?.top_matches && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'TOP' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {data.top_matches.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SCHOLARSHIPS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'SCHOLARSHIPS'
              ? 'bg-gov-blue text-white shadow-md shadow-gov-blue/20'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Scholarships &amp; Education</span>
          {data?.scholarships && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'SCHOLARSHIPS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {data.scholarships.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('FARMERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'FARMERS'
              ? 'bg-gov-blue text-white shadow-md shadow-gov-blue/20'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Tractor className="w-3.5 h-3.5" />
          <span>Farmer Schemes</span>
          {data?.farmer_schemes && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'FARMERS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {data.farmer_schemes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('WOMEN')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'WOMEN'
              ? 'bg-gov-blue text-white shadow-md shadow-gov-blue/20'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" />
          <span>Women &amp; Family</span>
          {data?.women_schemes && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'WOMEN' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {data.women_schemes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('MSME')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'MSME'
              ? 'bg-gov-blue text-white shadow-md shadow-gov-blue/20'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>MSME &amp; Business</span>
          {data?.msme_schemes && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'MSME' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {data.msme_schemes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DISABILITY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'DISABILITY'
              ? 'bg-gov-blue text-white shadow-md shadow-gov-blue/20'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Accessibility className="w-3.5 h-3.5" />
          <span>Disability &amp; Social</span>
          {data?.disability_and_social && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'DISABILITY' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {data.disability_and_social.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'bg-gov-blue text-white shadow-md shadow-gov-blue/20'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span>All Evaluated ({data?.total_evaluated || 0})</span>
        </button>
      </div>

      {/* 3. Loading State */}
      {loading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gov-blue/20 border-t-gov-blue rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Evaluating your profile parameters...</p>
        </div>
      )}

      {/* 4. Error State */}
      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold text-rose-900">{error}</p>
          <Link
            href="/onboarding"
            className="inline-block px-4 py-2 bg-gov-blue text-white text-xs font-bold rounded-xl shadow-md"
          >
            Complete Onboarding Now
          </Link>
        </div>
      )}

      {/* 5. Recommendations Grid */}
      {!loading && !error && (
        <div>
          {activeList.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white border border-slate-200 rounded-3xl p-8">
              <p className="text-slate-500 text-sm">No specific schemes found for this category.</p>
              <button
                onClick={() => setActiveTab('ALL')}
                className="text-xs font-bold text-gov-blue hover:underline"
              >
                View all evaluated schemes &rarr;
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeList.map((rec) => {
                const lvl = getLevelBadge(rec.government_level);
                const st = getStatusBadge(rec.eligibility_status);
                const StIcon = st.icon;
                const isBookmarked = bookmarkedIds.includes(rec.scheme_id);
                const targetUrl = rec.official_url || 'https://maharashtra.gov.in';

                return (
                  <div
                    key={rec.scheme_id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 hover:shadow-card hover:border-slate-300 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Badges & Bookmark */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${lvl.style}`}>
                            {lvl.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleBookmarkToggle(rec.scheme_id)}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark scheme'}
                          className={`p-1.5 rounded-lg border transition ${
                            isBookmarked
                              ? 'bg-amber-50 border-amber-300 text-amber-600'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Scheme Title */}
                      <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 group-hover:text-gov-blue transition-colors line-clamp-2">
                        {rec.scheme_name}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                        {rec.short_description || 'Direct welfare and financial assistance by the Government.'}
                      </p>

                      {/* Match Score & Status Badge */}
                      <div className="flex items-center justify-between mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700">Match Score:</span>
                          <span className="text-xs font-black text-gov-blue">{rec.match_score}%</span>
                        </div>
                        <div className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${st.style}`}>
                          <StIcon className="w-3 h-3" />
                          <span>{st.label}</span>
                        </div>
                      </div>

                      {/* Transparent Explanation Factors */}
                      {rec.explanation_factors && rec.explanation_factors.length > 0 && (
                        <div className="mb-4 space-y-1 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                            Why this matches you:
                          </p>
                          {rec.explanation_factors.slice(0, 3).map((factor, idx) => (
                            <p key={idx} className="text-[11px] text-emerald-900 flex items-start gap-1.5 leading-tight">
                              <span>✓</span>
                              <span>{factor.replace(/^[✓•\s]+/, '')}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Benefit Ceiling / Highlight */}
                      {rec.benefit_summary && (
                        <div className="mb-4 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                          <span className="text-[10px] font-bold text-gov-blue uppercase block">Benefit Ceiling:</span>
                          <span className="text-xs font-bold text-slate-900">{rec.benefit_summary}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/schemes/${rec.slug || rec.scheme_id}`}
                        className="py-2 px-3 text-xs font-semibold text-slate-700 hover:text-gov-blue hover:bg-slate-100 rounded-xl transition flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3.5 bg-gov-blue hover:bg-gov-blue/90 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                      >
                        <span>Apply Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
