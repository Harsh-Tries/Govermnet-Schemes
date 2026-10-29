'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  User,
  Sliders,
  ShieldCheck,
  HelpCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Clock,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Building2,
  DollarSign,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import {
  matchSchemes,
  fetchSchemeReasons,
  MatchingResponseDTO,
  SchemeEvaluationResultDTO,
  SchemeReasonsDTO
} from '../../services/intelligenceApi';
import {
  fetchBookmarkedSchemeIds,
  toggleSchemeBookmark,
  getVerifiedPortalInfo
} from '../../services/schemesApi';
import { authStorage } from '../../services/authApi';

export default function EligibilityPage() {
  // Citizen Profile State
  const [profile, setProfile] = useState<Record<string, any>>({
    age: 21,
    state_code: 'IN-MH',
    annual_income: 220000,
    annual_family_income: 220000,
    occupation_type: 'STUDENT',
    caste_category: 'OBC',
    is_pwd: false,
    course_level: 'UNDERGRADUATE'
  });

  // Evaluation & Data State
  const [matchingResult, setMatchingResult] = useState<MatchingResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [lastEvaluatedTime, setLastEvaluatedTime] = useState<string>('');

  // UI Navigation & Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'ELIGIBLE' | 'UNKNOWN' | 'NOT_ELIGIBLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedEducation, setSelectedEducation] = useState<string>('ALL');
  const [selectedBenefit, setSelectedBenefit] = useState<string>('ALL');

  // Profile Editor State
  const [showProfileEditor, setShowProfileEditor] = useState<boolean>(false);
  const [editProfileForm, setEditProfileForm] = useState<Record<string, any>>(profile);

  // Re-run Feedback & Notification State
  const [isReRunning, setIsReRunning] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // "Why am I eligible?" Modal State
  const [reasonsModalScheme, setReasonsModalScheme] = useState<SchemeEvaluationResultDTO | null>(null);
  const [reasonsData, setReasonsData] = useState<SchemeReasonsDTO | null>(null);
  const [loadingReasons, setLoadingReasons] = useState<boolean>(false);

  // Load Bookmarks
  const loadBookmarks = useCallback(async () => {
    try {
      const user = authStorage.getUser();
      const userId = user?.id || 'demo-citizen-user';
      const ids = await fetchBookmarkedSchemeIds(userId);
      setBookmarkedIds(ids);
    } catch (err) {
      console.warn('Could not load user bookmarks:', err);
    }
  }, []);

  // Execute Deterministic Matching
  const executeMatching = async (currentProfile: Record<string, any>, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsReRunning(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await matchSchemes(currentProfile);
      setMatchingResult(res);
      setLastEvaluatedTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (isManualRefresh) {
        setSuccessToast('Eligibility engine re-evaluated 27 Maharashtra schemes successfully!');
        setTimeout(() => setSuccessToast(null), 4000);
      }
    } catch (err: any) {
      console.error('API call failed, displaying client error state:', err);
      setError(err.message || 'Unable to connect to Deterministic Eligibility Engine.');
    } finally {
      setIsLoading(false);
      setIsReRunning(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
    executeMatching(profile);
  }, []);

  // Handle Profile Update Form
  const handleSaveProfileForm = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editProfileForm);
    setShowProfileEditor(false);
    executeMatching(editProfileForm, true);
  };

  // Handle Bookmark Toggle
  const handleToggleBookmark = async (schemeId: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(schemeId);
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== schemeId) : [...prev, schemeId]
    );

    const user = authStorage.getUser();
    const userId = user?.id || 'demo-citizen-user';
    await toggleSchemeBookmark(schemeId, isCurrentlyBookmarked, userId);
  };

  // Open "Why Am I Eligible?" Reasons Modal
  const handleOpenReasons = async (scheme: SchemeEvaluationResultDTO) => {
    setReasonsModalScheme(scheme);
    setLoadingReasons(true);
    setReasonsData(null);
    try {
      const data = await fetchSchemeReasons(scheme.scheme_id);
      setReasonsData(data);
    } catch (err) {
      console.warn('Could not load reasons breakdown:', err);
    } finally {
      setLoadingReasons(false);
    }
  };

  // Combined Filtering Logic
  const allCurrentSchemes = useMemo((): SchemeEvaluationResultDTO[] => {
    if (!matchingResult) return [];
    if (activeTab === 'ELIGIBLE') return matchingResult.eligible;
    if (activeTab === 'UNKNOWN') return matchingResult.unknown;
    if (activeTab === 'NOT_ELIGIBLE') return matchingResult.not_eligible;
    return [...matchingResult.eligible, ...matchingResult.unknown, ...matchingResult.not_eligible];
  }, [matchingResult, activeTab]);

  const filteredSchemes = useMemo(() => {
    return allCurrentSchemes.filter((scheme) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = scheme.scheme_name.toLowerCase().includes(q);
        const matchesDept = (scheme.department || '').toLowerCase().includes(q);
        const matchesCategory = (scheme.category || '').toLowerCase().includes(q);
        const matchesDesc = (scheme.short_description || '').toLowerCase().includes(q);
        const matchesBenefit = (scheme.benefit_description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDept && !matchesCategory && !matchesDesc && !matchesBenefit) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL') {
        const hasCategory =
          scheme.category === selectedCategory ||
          (scheme.categories && scheme.categories.includes(selectedCategory));
        if (!hasCategory) return false;
      }

      // 3. Department Filter
      if (selectedDepartment !== 'ALL' && scheme.department !== selectedDepartment) {
        return false;
      }

      // 4. Benefit Type Filter
      if (selectedBenefit !== 'ALL' && scheme.benefit_type !== selectedBenefit) {
        return false;
      }

      return true;
    });
  }, [allCurrentSchemes, searchQuery, selectedCategory, selectedDepartment, selectedBenefit]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedDepartment('ALL');
    setSelectedEducation('ALL');
    setSelectedBenefit('ALL');
  };

  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedDepartment !== 'ALL' ||
    selectedBenefit !== 'ALL';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-gov-lightBlue/40 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Deterministic Eligibility Engine • Zero Black-Box Scoring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              My Eligibility
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Discover Maharashtra government welfare schemes and scholarships that match your profile.
              Rules are evaluated deterministically against your recorded residency, income, and category.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
            {lastEvaluatedTime && (
              <span className="text-[11px] text-slate-400 font-medium">
                Evaluated: <strong>{lastEvaluatedTime}</strong>
              </span>
            )}

            <button
              onClick={() => executeMatching(profile, true)}
              disabled={isReRunning || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gov-blue hover:bg-gov-navy disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-gov-blue/20"
            >
              <RefreshCw className={`w-4 h-4 ${isReRunning ? 'animate-spin' : ''}`} />
              <span>{isReRunning ? 'Re-evaluating...' : 'Re-run Eligibility Engine'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Active Citizen Profile Summary Card */}
      <section className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gov-blue text-white flex items-center justify-center font-bold text-base shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Citizen Socio-Demographic Profile
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  VERIFIED PROFILE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated parameters against official Government of Maharashtra guidelines
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditProfileForm(profile);
              setShowProfileEditor(!showProfileEditor);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Sliders className="w-4 h-4 text-gov-blue" />
            <span>{showProfileEditor ? 'Close Profile Editor' : 'Modify Profile Attributes'}</span>
          </button>
        </div>

        {/* Profile Attributes Strip */}
        {!showProfileEditor ? (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
            <span className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium text-slate-700">
              Age: <strong className="text-slate-900">{profile.age || 21} yrs</strong>
            </span>
            <span className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium text-slate-700">
              State: <strong className="text-slate-900">Maharashtra (IN-MH)</strong>
            </span>
            <span className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium text-slate-700">
              Annual Family Income:{' '}
              <strong className="text-emerald-700">
                ₹{Number(profile.annual_family_income || profile.annual_income || 220000).toLocaleString('en-IN')}
              </strong>
            </span>
            <span className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium text-slate-700">
              Occupation: <strong className="text-slate-900">{profile.occupation_type || 'Student'}</strong>
            </span>
            <span className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium text-slate-700">
              Caste Category:{' '}
              <strong className="text-gov-blue font-bold">{profile.caste_category || 'OBC'}</strong>
            </span>
            <span className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium text-slate-700">
              Education Level:{' '}
              <strong className="text-slate-900">{profile.course_level || 'Undergraduate'}</strong>
            </span>
            <span className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl font-medium text-slate-700">
              Person with Disability:{' '}
              <strong className="text-slate-900">{profile.is_pwd ? 'Yes' : 'No'}</strong>
            </span>
          </div>
        ) : (
          /* Profile Inline Editor Form */
          <form
            onSubmit={handleSaveProfileForm}
            className="pt-3 border-t border-slate-100 space-y-4 bg-slate-50/70 p-4 rounded-2xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={editProfileForm.age}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, age: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Annual Family Income (₹)</label>
                <input
                  type="number"
                  value={editProfileForm.annual_family_income || editProfileForm.annual_income}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setEditProfileForm({
                      ...editProfileForm,
                      annual_family_income: val,
                      annual_income: val
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Caste Category</label>
                <select
                  value={editProfileForm.caste_category}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, caste_category: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                >
                  <option value="OPEN">OPEN / General</option>
                  <option value="OBC">OBC (Other Backward Class)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="VJNT">VJNT</option>
                  <option value="SBC">SBC</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Occupation</label>
                <select
                  value={editProfileForm.occupation_type}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, occupation_type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                >
                  <option value="STUDENT">Student</option>
                  <option value="FARMER">Farmer</option>
                  <option value="SELF_EMPLOYED">Self-Employed / MSME</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                  <option value="SALARIED">Salaried</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProfileEditor(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gov-blue hover:bg-gov-navy text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Save & Re-evaluate
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 3. Four Eligibility Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Schemes Evaluated */}
        <button
          onClick={() => setActiveTab('ALL')}
          className={`text-left p-5 rounded-2xl border transition-all ${
            activeTab === 'ALL'
              ? 'bg-white border-gov-blue shadow-md ring-2 ring-gov-blue/10'
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Evaluated</span>
            <BookOpen className="w-4 h-4 text-gov-blue" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {matchingResult ? matchingResult.total_schemes_evaluated : 0}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Click to view all</span>
        </button>

        {/* Fully Eligible */}
        <button
          onClick={() => setActiveTab('ELIGIBLE')}
          className={`text-left p-5 rounded-2xl border transition-all ${
            activeTab === 'ELIGIBLE'
              ? 'bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/10'
              : 'bg-white border-slate-200/90 hover:border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Fully Eligible</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            {matchingResult ? matchingResult.eligible_count : 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">All conditions satisfied</span>
        </button>

        {/* Needs Information */}
        <button
          onClick={() => setActiveTab('UNKNOWN')}
          className={`text-left p-5 rounded-2xl border transition-all ${
            activeTab === 'UNKNOWN'
              ? 'bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/10'
              : 'bg-white border-slate-200/90 hover:border-amber-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Needs Information</span>
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-700">
            {matchingResult ? matchingResult.unknown_count : 0}
          </p>
          <span className="text-[11px] text-amber-600 font-medium">Missing profile details</span>
        </button>

        {/* Not Eligible */}
        <button
          onClick={() => setActiveTab('NOT_ELIGIBLE')}
          className={`text-left p-5 rounded-2xl border transition-all ${
            activeTab === 'NOT_ELIGIBLE'
              ? 'bg-rose-50/40 border-rose-400 shadow-md ring-2 ring-rose-400/10'
              : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Not Eligible</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            {matchingResult ? matchingResult.not_eligible_count : 0}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Condition threshold unmet</span>
        </button>
      </section>

      {/* 4. "Recommended for Your Profile" Section */}
      {matchingResult && matchingResult.recommended_schemes && matchingResult.recommended_schemes.length > 0 && activeTab === 'ALL' && !isFiltered && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900">Recommended for Your Profile</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Ranked by verified eligibility &amp; OBC Student match
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchingResult.recommended_schemes.map((rec) => (
              <div
                key={rec.scheme_id}
                className="bg-white rounded-2xl border-2 border-emerald-500/30 p-5 space-y-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                      Top Match • Eligible
                    </span>
                    <button
                      onClick={() => handleToggleBookmark(rec.scheme_id)}
                      className="text-slate-400 hover:text-gov-blue transition"
                      title="Save Scheme"
                    >
                      {bookmarkedIds.includes(rec.scheme_id) ? (
                        <BookmarkCheck className="w-4 h-4 text-gov-blue fill-gov-blue" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {rec.scheme_name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">{rec.short_description}</p>

                  {rec.match_reasons && rec.match_reasons.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-2.5 text-[11px] text-emerald-900 space-y-1">
                      <strong className="block text-emerald-950 font-bold">Why you qualify:</strong>
                      <p className="line-clamp-2 leading-relaxed">{rec.match_reasons[0]}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleOpenReasons(rec)}
                    className="text-gov-blue font-bold hover:underline"
                  >
                    Why am I eligible?
                  </button>

                  {rec.official_portal_url && (
                    <a
                      href={rec.official_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gov-blue hover:bg-gov-navy text-white font-bold rounded-xl text-xs transition"
                    >
                      <span>Apply Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Search Bar and Advanced Filters */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Search Input Row */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schemes by name, department, or benefit (e.g. OBC, Shikshan, Vasatgruh, Shetkari)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Scheme Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-gov-blue"
            >
              <option value="ALL">All Categories</option>
              {matchingResult?.categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Department Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Government Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-gov-blue"
            >
              <option value="ALL">All Departments</option>
              {matchingResult?.departments?.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Education Level Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Education Level
            </label>
            <select
              value={selectedEducation}
              onChange={(e) => setSelectedEducation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-gov-blue"
            >
              <option value="ALL">All Education Levels</option>
              <option value="School">School Education</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Postgraduate">Postgraduate</option>
              <option value="Diploma">Diploma Courses</option>
              <option value="Vocational/Technical">Vocational / Technical</option>
            </select>
          </div>

          {/* Benefit Type Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Benefit Type
            </label>
            <select
              value={selectedBenefit}
              onChange={(e) => setSelectedBenefit(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-gov-blue"
            >
              <option value="ALL">All Benefit Types</option>
              {matchingResult?.benefit_types?.map((bt) => (
                <option key={bt} value={bt}>
                  {bt.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset & Status Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Filter Status:
            </span>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-gov-blue text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
              }`}
            >
              All Schemes ({matchingResult?.total_schemes_evaluated || 0})
            </button>
            <button
              onClick={() => setActiveTab('ELIGIBLE')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'ELIGIBLE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
              }`}
            >
              Eligible ({matchingResult?.eligible_count || 0})
            </button>
            <button
              onClick={() => setActiveTab('UNKNOWN')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'UNKNOWN'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
              }`}
            >
              Needs Information ({matchingResult?.unknown_count || 0})
            </button>
            <button
              onClick={() => setActiveTab('NOT_ELIGIBLE')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'NOT_ELIGIBLE'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Not Eligible ({matchingResult?.not_eligible_count || 0})
            </button>
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </section>

      {/* 6. Needs Information Next Steps Prompt Banner */}
      {matchingResult && matchingResult.unknown_count > 0 && activeTab === 'UNKNOWN' && (
        <section className="bg-amber-50 border border-amber-200/80 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-amber-900">
                Complete Your Profile to Unlock Eligibility
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                Some schemes require specific fields (such as gender or admission details) before a deterministic qualification decision can be certified.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
            >
              <span>Complete Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 7. Schemes Results List Section */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
              <div className="h-12 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Evaluation Engine Error</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => executeMatching(profile)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Retry Evaluation
          </button>
        </div>
      ) : filteredSchemes.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gov-lightBlue flex items-center justify-center mx-auto text-gov-blue">
            <Filter className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No schemes found matching your criteria</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Try adjusting your search terms, clearing category filters, or selecting All Schemes.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gov-blue hover:bg-gov-navy text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-gov-blue/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        /* Schemes Cards List */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong className="text-slate-800">{filteredSchemes.length}</strong> evaluated schemes
              {selectedCategory !== 'ALL' && ` in ${selectedCategory}`}
            </span>
          </div>

          {filteredSchemes.map((scheme) => {
            const isEligible = scheme.status === 'ELIGIBLE';
            const isUnknown = scheme.status === 'UNKNOWN';
            const isNotEligible = scheme.status === 'NOT_ELIGIBLE';

            let statusBadge = {
              bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
              label: 'Eligible',
              icon: CheckCircle2
            };
            if (isUnknown) {
              statusBadge = {
                bg: 'bg-amber-50 text-amber-800 border-amber-300',
                label: 'Needs Information',
                icon: HelpCircle
              };
            } else if (isNotEligible) {
              statusBadge = {
                bg: 'bg-rose-50 text-rose-800 border-rose-200',
                label: 'Not Eligible',
                icon: XCircle
              };
            }

            const StatusIcon = statusBadge.icon;

            return (
              <div
                key={scheme.scheme_id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-5 sm:p-6 space-y-4 shadow-sm transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {scheme.scheme_name}
                      </h3>
                      {scheme.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {scheme.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>{scheme.department || 'Government of Maharashtra'}</span>
                      {scheme.benefit_type && (
                        <>
                          <span>•</span>
                          <span className="text-gov-blue font-semibold">
                            {scheme.benefit_type.replace(/_/g, ' ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Bookmark */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusBadge.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusBadge.label}</span>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(scheme.scheme_id)}
                      className="p-1.5 text-slate-400 hover:text-gov-blue transition rounded-xl hover:bg-slate-50"
                      title="Save Scheme"
                    >
                      {bookmarkedIds.includes(scheme.scheme_id) ? (
                        <BookmarkCheck className="w-5 h-5 text-gov-blue fill-gov-blue" />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {scheme.short_description && (
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {scheme.short_description}
                  </p>
                )}

                {/* Conditions Evaluation Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{scheme.satisfied_conditions.length} Conditions Satisfied</span>
                  </span>

                  {scheme.failed_conditions.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 font-semibold border border-rose-200/60">
                      <X className="w-3 h-3 text-rose-600" />
                      <span>{scheme.failed_conditions.length} Conditions Unmet</span>
                    </span>
                  )}

                  {scheme.missing_information.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-semibold border border-amber-200/60">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>{scheme.missing_information.length} Need Information</span>
                    </span>
                  )}
                </div>

                {/* Explanations preview */}
                {scheme.explanations && scheme.explanations.length > 0 && (
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                    <strong className="block text-slate-800 font-bold">Evaluation Summary:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                      {scheme.explanations.slice(0, 2).map((exp, idx) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleOpenReasons(scheme)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-gov-blue text-xs font-bold transition shadow-sm"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Why am I eligible?</span>
                    </button>

                    <Link
                      href={`/schemes/${scheme.scheme_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-sm"
                    >
                      <span>View Details</span>
                    </Link>
                  </div>

                  {scheme.official_portal_url && (
                    <a
                      href={scheme.official_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gov-blue hover:bg-gov-navy text-white text-xs font-bold rounded-xl shadow-sm transition"
                    >
                      <span>Apply on Official Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- MODAL: Rule-by-Rule Explanation ("Why Am I Eligible?") ---------------- */}
      {reasonsModalScheme && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-gov-blue uppercase tracking-wider">
                  Deterministic Rule Inspection
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {reasonsModalScheme.scheme_name}
                </h3>
              </div>
              <button
                onClick={() => setReasonsModalScheme(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingReasons ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                Evaluating rules against your citizen profile...
              </div>
            ) : reasonsData ? (
              <div className="space-y-4">
                {/* Rules Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="p-3">Condition</th>
                        <th className="p-3">Citizen Value</th>
                        <th className="p-3">Requirement</th>
                        <th className="p-3">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {reasonsData.rules_table.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-900">{row.condition}</td>
                          <td className="p-3 font-mono text-[11px]">{row.citizen_value}</td>
                          <td className="p-3 font-mono text-[11px]">
                            {row.operator !== 'REQUIRED' && `${row.operator} `}
                            {row.required_value}
                          </td>
                          <td className="p-3">
                            {row.result === 'PASS' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3 text-emerald-600" /> PASS
                              </span>
                            ) : row.result === 'NEEDS_INFO' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                <Clock className="w-3 h-3 text-amber-600" /> NEEDS INFO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                <X className="w-3 h-3 text-rose-600" /> FAIL
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Explanations List */}
                {reasonsData.explanations && reasonsData.explanations.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <strong className="block font-bold text-slate-900">
                      Official Deterministic Explanations:
                    </strong>
                    <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                      {reasonsData.explanations.map((exp, i) => (
                        <li key={i}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4">No detailed rule data available.</p>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setReasonsModalScheme(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
