'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { QuickActionCard } from '../components/dashboard/QuickActionCard';
import { SchemeCard } from '../components/dashboard/SchemeCard';
import { SchemeFilterPanel } from '../components/dashboard/SchemeFilterPanel';
import { AiInputPlaceholder } from '../components/ai/AiInputPlaceholder';
import { TrustIndicator } from '../components/ui/TrustIndicator';
import { 
  fetchPublishedSchemes, 
  fetchBookmarkedSchemeIds, 
  toggleSchemeBookmark 
} from '../services/schemesApi';
import { Scheme } from '../types/scheme';
import { 
  Search, 
  CheckCircle2, 
  Briefcase, 
  Bookmark, 
  Sparkles,
  ChevronRight,
  Filter,
  UserCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function HomePage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('ALL');

  // Filter panel state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [governmentLevel, setGovernmentLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('state_first');

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchPublishedSchemes({
        search: searchQuery,
        beneficiary: selectedTab,
        governmentLevel: governmentLevel,
        sortBy: sortBy
      });
      setSchemes(results);
    } catch (err: any) {
      console.error('Failed to load schemes:', err);
      setError('Unable to load schemes from the database.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTab, governmentLevel, sortBy]);

  const loadBookmarks = async () => {
    try {
      const ids = await fetchBookmarkedSchemeIds('demo-citizen-user');
      setBookmarkedIds(ids);
    } catch (err) {
      console.warn('Unable to load user bookmarks:', err);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  const toggleBookmark = async (id: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.includes(id);

    // Optimistic UI update
    setBookmarkedIds((prev) =>
      isCurrentlyBookmarked ? prev.filter((i) => i !== id) : [...prev, id]
    );

    const isNowBookmarked = await toggleSchemeBookmark(id, isCurrentlyBookmarked, 'demo-citizen-user');
    // Ensure state synchronizes if the API reports different status
    if (isNowBookmarked !== !isCurrentlyBookmarked) {
      setBookmarkedIds((prev) =>
        isNowBookmarked ? [...prev, id] : prev.filter((i) => i !== id)
      );
    }
  };

  const handleResetFilters = () => {
    setSelectedTab('ALL');
    setSearchQuery('');
    setGovernmentLevel('ALL');
    setSortBy('state_first');
  };

  const activeFiltersCount = 
    (selectedTab !== 'ALL' ? 1 : 0) +
    (searchQuery.trim() !== '' ? 1 : 0) +
    (governmentLevel !== 'ALL' ? 1 : 0) +
    (sortBy !== 'state_first' ? 1 : 0);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Trust Indicator Header */}
      <TrustIndicator />

      {/* 2. Hero Section with Maharashtra Persona */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-gov-lightBlue/40 border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-card relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-blue/10 border border-gov-blue/20 text-gov-blue text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gov-blue" />
            <span>Maharashtra Government Scheme & Scholarship Finder</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Find Genuine Government Schemes <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-blue via-teal-700 to-gov-orange">
              You're Eligible For in Maharashtra
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Explore 26+ verified State and Central welfare schemes with official .gov.in application portals. Evaluated deterministically against official Maharashtra government department guidelines.
          </p>

          {/* User Profile Quick Match Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-slate-700">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Matching for: <strong>Rohan Sharma</strong> (Student, Pune, Maharashtra • ₹2.2L Income)</span>
            </div>
            <Link href="/eligibility" className="text-gov-blue font-semibold hover:underline text-xs">
              Check My Eligibility Parameters →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Quick Action Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <span className="text-xs text-slate-500 font-medium">Select a pathway</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/schemes" className="block">
            <QuickActionCard
              title="Find Schemes"
              description="Browse all Central and Maharashtra state welfare schemes with advanced filters."
              icon={Search}
              colorScheme="blue"
            />
          </Link>

          <Link href="/eligibility" className="block">
            <QuickActionCard
              title="Check Eligibility"
              description="Run the deterministic rules engine against your socio-economic profile."
              icon={CheckCircle2}
              colorScheme="emerald"
              countBadge="Live Engine"
            />
          </Link>

          <Link href="/recommendations" className="block">
            <QuickActionCard
              title="Explore by Profession"
              description="Discover schemes customized for Farmers, Students, MSMEs, Artisans & PwD."
              icon={Briefcase}
              colorScheme="amber"
            />
          </Link>

          <Link href="/saved" className="block">
            <QuickActionCard
              title="Saved Schemes"
              description="View and track your bookmarked schemes and official application document checklists."
              icon={Bookmark}
              colorScheme="purple"
              countBadge={`${bookmarkedIds.length} Saved`}
            />
          </Link>
        </div>
      </section>

      {/* 4. AI Assistant Conversational Input Placeholder */}
      <section>
        <AiInputPlaceholder />
      </section>

      {/* 5. Explore Verified Schemes Dashboard Feed */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Featured Verified Schemes</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {schemes.length} Available
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Prioritizing Maharashtra State Government schemes & centrally sponsored programs
            </p>
          </div>

          {/* Beneficiary Filter Tabs & Filter Popover Trigger */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                isFilterPanelOpen || activeFiltersCount > 0
                  ? 'bg-gov-blue text-white border-gov-blue shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Toggle Advanced Search & Filters"
              aria-label="Filter schemes"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-gov-orange text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {[
              { id: 'ALL', label: 'All Schemes' },
              { id: 'STUDENT', label: 'Students' },
              { id: 'FARMER', label: 'Farmers' },
              { id: 'ENTREPRENEUR', label: 'MSME' },
              { id: 'PWD', label: 'PwD' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'bg-gov-blue text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        <SchemeFilterPanel
          isOpen={isFilterPanelOpen}
          onClose={() => setIsFilterPanelOpen(false)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          governmentLevel={governmentLevel}
          onGovernmentLevelChange={setGovernmentLevel}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onResetFilters={handleResetFilters}
          totalResultsCount={schemes.length}
        />

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-gov-blue animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Retrieving verified schemes from Maharashtra government knowledge base...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && schemes.length === 0 && (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Matching Schemes Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find any published schemes matching your current filter criteria. Try resetting filters or searching with different keywords.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gov-blue text-white text-xs font-bold rounded-xl hover:bg-gov-blue/90 shadow-sm transition-all"
            >
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

        {/* Schemes Grid */}
        {!loading && !error && schemes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                isBookmarked={bookmarkedIds.includes(scheme.id)}
                onBookmarkToggle={toggleBookmark}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center pt-4">
          <Link
            href="/schemes"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:border-gov-blue hover:text-gov-blue text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>Explore All 26+ Verified Maharashtra Government Schemes</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
