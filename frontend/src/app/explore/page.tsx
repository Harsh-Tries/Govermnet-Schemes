'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SchemeCard } from '../../components/dashboard/SchemeCard';
import { Scheme } from '../../types/scheme';
import { 
  fetchPublishedSchemes, 
  fetchBookmarkedSchemeIds, 
  toggleSchemeBookmark 
} from '../../services/schemesApi';
import { 
  Compass, 
  Search, 
  RefreshCw, 
  Database, 
  Filter, 
  SlidersHorizontal, 
  RotateCcw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const BENEFICIARY_TABS = [
  { id: 'ALL', label: 'All Schemes' },
  { id: 'STUDENT', label: 'Students' },
  { id: 'FARMER', label: 'Farmers' },
  { id: 'ENTREPRENEUR', label: 'MSME' },
  { id: 'PWD', label: 'PwD' },
];

const GOVERNMENT_LEVELS = [
  { id: 'ALL', label: 'All Government Levels' },
  { id: 'STATE', label: 'Maharashtra State Government' },
  { id: 'CENTRALLY_SPONSORED', label: 'Centrally Sponsored Schemes' },
  { id: 'CENTRAL', label: 'Central Government Initiatives' },
];

const SORT_OPTIONS = [
  { id: 'state_first', label: 'State Schemes First (Default)' },
  { id: 'name_asc', label: 'Scheme Name (A to Z)' },
  { id: 'name_desc', label: 'Scheme Name (Z to A)' },
  { id: 'recently_verified', label: 'Recently Verified' },
];

function ExploreContent() {
  const searchParams = useSearchParams();

  // Search & Filter State
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const initialBeneficiary = searchParams.get('beneficiary') || 'ALL';
  const initialLevel = searchParams.get('level') || 'ALL';

  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string>(initialBeneficiary);
  const [selectedLevel, setSelectedLevel] = useState<string>(initialLevel);
  const [sortBy, setSortBy] = useState<string>('state_first');

  // Scheme Data State
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Load Bookmarks
  const loadBookmarks = useCallback(async () => {
    try {
      const ids = await fetchBookmarkedSchemeIds('demo-citizen-user');
      setBookmarkedIds(ids);
    } catch (err) {
      console.warn('Unable to load user bookmarks:', err);
    }
  }, []);

  // Load Schemes from Backend API
  const loadSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchPublishedSchemes({
        search: searchQuery.trim() || undefined,
        beneficiary: selectedBeneficiary !== 'ALL' ? selectedBeneficiary : undefined,
        governmentLevel: selectedLevel !== 'ALL' ? selectedLevel : undefined,
        sortBy: sortBy
      });
      setSchemes(results);
    } catch (err: any) {
      console.error('Failed to load explore schemes:', err);
      setError('Unable to load schemes from the database. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedBeneficiary, selectedLevel, sortBy]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  // Handle Bookmark Toggle
  const handleBookmarkToggle = async (schemeId: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(schemeId);

    // Optimistic Update
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((id) => id !== schemeId) : [...prev, schemeId]
    );

    const isNowBookmarked = await toggleSchemeBookmark(
      schemeId,
      isCurrentlyBookmarked,
      'demo-citizen-user'
    );

    // Synchronize if response differs
    if (isNowBookmarked !== !isCurrentlyBookmarked) {
      setBookmarkedIds((prev) =>
        isNowBookmarked ? [...prev, schemeId] : prev.filter((id) => id !== schemeId)
      );
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBeneficiary('ALL');
    setSelectedLevel('ALL');
    setSortBy('state_first');
  };

  const isFiltered = searchQuery.trim() !== '' || selectedBeneficiary !== 'ALL' || selectedLevel !== 'ALL' || sortBy !== 'state_first';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-gov-lightBlue/40 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Maharashtra Welfare & Scholarship Directory</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Explore Government Schemes
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Browse verified welfare schemes, student scholarships, agricultural subsidies, and entrepreneurship credit programs. 
            Prioritizing official Maharashtra State Government initiatives alongside Centrally sponsored programs.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Grounded in Official .gov.in Sources
            </span>
            <span className="flex items-center gap-1.5 text-gov-blue font-semibold">
              <Database className="w-4 h-4 text-gov-blue" />
              Official Directory
            </span>
          </div>
        </div>
      </section>

      {/* Main Filter & Search Control Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Search Bar + Sort Row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name, keyword, department, or beneficiary (e.g. Ladki Bahin, Namo Shetkari, EBC, PM-KISAN)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            {/* Government Level Dropdown */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-gov-blue hover:bg-slate-100 transition-colors"
            >
              {GOVERNMENT_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.label}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-gov-blue hover:bg-slate-100 transition-colors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadSchemes}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shrink-0"
              title="Refresh Scheme Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Beneficiary Category Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Beneficiary:
            </span>
            {BENEFICIARY_TABS.map((tab) => {
              const isSelected = selectedBeneficiary === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedBeneficiary(tab.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-gov-blue text-white shadow-sm shadow-gov-blue/20'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Reset Filters action */}
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
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{schemes.length}</strong> verified government schemes
          {selectedBeneficiary !== 'ALL' && ` for ${selectedBeneficiary.toLowerCase()}`}
          {selectedLevel !== 'ALL' && ` (${selectedLevel.replace(/_/g, ' ').toLowerCase()})`}
        </span>
        <span className="text-[11px] text-slate-400">
          Bookmarked: <strong className="text-gov-blue">{bookmarkedIds.length}</strong>
        </span>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-slate-100 animate-pulse border border-slate-200 p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 bg-slate-200 rounded-md"></div>
                <div className="h-5 w-8 bg-slate-200 rounded-md"></div>
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-1/2 bg-slate-200 rounded-md"></div>
              <div className="h-14 w-full bg-slate-200 rounded-md"></div>
              <div className="pt-4 flex justify-between">
                <div className="h-8 w-20 bg-slate-200 rounded-md"></div>
                <div className="h-8 w-20 bg-slate-200 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Failed to Load Government Schemes</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadSchemes}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : schemes.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <Filter className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No schemes found matching your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try broadening your search term, clearing beneficiary filters, or selecting All Government Levels.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gov-blue text-white rounded-xl text-xs font-semibold hover:bg-gov-navy transition-colors shadow-sm"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* Schemes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              isBookmarked={bookmarkedIds.includes(scheme.id)}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-xs animate-pulse">
          Loading Maharashtra Scheme Directory...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
