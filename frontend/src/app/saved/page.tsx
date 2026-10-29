'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Scale, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  Compass,
  FileCheck2
} from 'lucide-react';
import { Scheme } from '../../types/scheme';
import { 
  fetchBookmarkedSchemes, 
  fetchBookmarkedSchemeIds, 
  toggleSchemeBookmark, 
  getVerifiedPortalInfo, 
  formatBenefitCeiling,
  getOfficialSchemeUrl
} from '../../services/schemesApi';
import { SchemeCard } from '../../components/dashboard/SchemeCard';
import { authStorage } from '../../services/authApi';

export default function SavedPage() {
  const [savedSchemes, setSavedSchemes] = useState<Scheme[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'schemes' | 'documents' | 'comparison'>('schemes');
  
  // Multi-select for side-by-side comparison (max 3)
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Resolve user id
  const userId = useMemo(() => {
    return authStorage.getUser()?.id || 'demo-citizen-user';
  }, []);

  // Fetch saved schemes
  const loadSavedData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schemes, ids] = await Promise.all([
        fetchBookmarkedSchemes(userId),
        fetchBookmarkedSchemeIds(userId),
      ]);
      setSavedSchemes(schemes);
      setBookmarkedIds(ids.length > 0 ? ids : schemes.map((s) => s.id));
    } catch (err: any) {
      console.error('Failed to load saved schemes:', err);
      setError(err?.message || 'Could not load your saved schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Handle removing a bookmark
  const handleRemoveBookmark = async (schemeId: string) => {
    // Optimistic removal
    setSavedSchemes((prev) => prev.filter((s) => s.id !== schemeId));
    setBookmarkedIds((prev) => prev.filter((id) => id !== schemeId));
    setCompareIds((prev) => prev.filter((id) => id !== schemeId));

    try {
      await toggleSchemeBookmark(schemeId, true, userId);
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
      loadSavedData();
    }
  };

  // Toggle selection for comparison
  const handleToggleCompare = (schemeId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(schemeId)) {
        return prev.filter((id) => id !== schemeId);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 schemes simultaneously.');
        return prev;
      }
      return [...prev, schemeId];
    });
  };

  const getSchemeName = (s: Scheme): string => s.name || s.title || 'Government Scheme';

  // Filtered schemes
  const filteredSchemes = useMemo(() => {
    return savedSchemes.filter((scheme) => {
      const query = searchQuery.trim().toLowerCase();
      const name = getSchemeName(scheme).toLowerCase();
      const desc = (scheme.short_description || scheme.summary || '').toLowerCase();
      const ministry = (scheme.administering_ministry || scheme.ministry || '').toLowerCase();
      const catMatches = scheme.categories?.some((c) => {
        const catName = typeof c === 'string' ? c : c.name;
        return catName.toLowerCase().includes(query);
      });

      const matchesSearch = !query || name.includes(query) || desc.includes(query) || ministry.includes(query) || Boolean(catMatches);
      const matchesLevel = selectedLevel === 'ALL' || (scheme.government_level || scheme.level) === selectedLevel;

      return matchesSearch && matchesLevel;
    });
  }, [savedSchemes, searchQuery, selectedLevel]);

  // Consolidated documents checklist across all saved schemes
  const aggregatedDocuments = useMemo(() => {
    const docMap = new Map<string, { title: string; isMandatory: boolean; schemeNames: string[] }>();

    savedSchemes.forEach((scheme) => {
      const rawDocs = (scheme as any).documents as Array<{ title?: string; is_mandatory?: boolean }> | undefined;
      const sName = getSchemeName(scheme);
      if (rawDocs && Array.isArray(rawDocs)) {
        rawDocs.forEach((doc) => {
          if (!doc.title) return;
          const key = doc.title.trim().toLowerCase();
          if (docMap.has(key)) {
            const existing = docMap.get(key)!;
            if (!existing.schemeNames.includes(sName)) {
              existing.schemeNames.push(sName);
            }
            if (doc.is_mandatory) existing.isMandatory = true;
          } else {
            docMap.set(key, {
              title: doc.title,
              isMandatory: Boolean(doc.is_mandatory),
              schemeNames: [sName],
            });
          }
        });
      }
    });

    return Array.from(docMap.values()).sort((a, b) => {
      if (a.isMandatory === b.isMandatory) return b.schemeNames.length - a.schemeNames.length;
      return a.isMandatory ? -1 : 1;
    });
  }, [savedSchemes]);

  // Schemes chosen for side-by-side comparison
  const comparisonSchemes = useMemo(() => {
    return savedSchemes.filter((s) => compareIds.includes(s.id));
  }, [savedSchemes, compareIds]);

  // Metrics
  const directApplyCount = useMemo(() => {
    return savedSchemes.filter((s) => {
      const url = getOfficialSchemeUrl(s);
      const info = getVerifiedPortalInfo(url);
      return info.isDirectApp;
    }).length;
  }, [savedSchemes]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-gov-lightBlue/40 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-900">
            <Bookmark className="w-4 h-4 text-purple-600" />
            <span>Citizen Workspace & Saved Schemes</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Saved Government Schemes & Document Hub
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Track, compare, and prepare documentation for your bookmarked Maharashtra welfare initiatives and scholarships. 
            All links are verified against official government portals.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              100% Verified Official Sources
            </span>
            <span className="flex items-center gap-1.5 text-gov-blue font-semibold">
              <Scale className="w-4 h-4 text-gov-blue" />
              Side-by-Side Scheme Comparison
            </span>
          </div>
        </div>
      </section>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Saved */}
        <div 
          onClick={() => setActiveTab('schemes')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'schemes' 
              ? 'bg-purple-50/60 border-purple-300 shadow-sm ring-1 ring-purple-400' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Saved Schemes</span>
            <Bookmark className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {savedSchemes.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Bookmarked programs</p>
        </div>

        {/* Direct Apply Ready */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Direct Apply Ready</span>
            <ExternalLink className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-2">
            {directApplyCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Online portals available</p>
        </div>

        {/* Documents Required */}
        <div 
          onClick={() => setActiveTab('documents')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'documents' 
              ? 'bg-blue-50/60 border-blue-300 shadow-sm ring-1 ring-blue-400' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Required Documents</span>
            <FileText className="w-4 h-4 text-gov-blue" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gov-blue mt-2">
            {aggregatedDocuments.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Unique certificates needed</p>
        </div>

        {/* Comparison Selection */}
        <div 
          onClick={() => {
            if (compareIds.length >= 2) {
              setActiveTab('comparison');
            } else {
              alert('Select at least 2 saved schemes using the "Compare" checkbox to view side-by-side comparison.');
            }
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'comparison' 
              ? 'bg-amber-50/60 border-amber-300 shadow-sm ring-1 ring-amber-400' 
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Selected for Compare</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 mt-2">
            {compareIds.length} <span className="text-xs font-normal text-slate-400">/ 3</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {compareIds.length >= 2 ? 'Click to view comparison' : 'Select 2 or 3 to compare'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('schemes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'schemes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saved Schemes ({savedSchemes.length})
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'documents'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Checklist ({aggregatedDocuments.length})
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              disabled={compareIds.length < 2}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'comparison'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : compareIds.length < 2
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side Comparison ({compareIds.length})
            </button>
          </div>

          {/* Quick Refresh & Clear Compare */}
          <div className="flex items-center gap-2">
            {compareIds.length > 0 && (
              <button
                onClick={() => setCompareIds([])}
                className="text-xs text-slate-500 hover:text-rose-600 font-semibold transition"
              >
                Clear Compare ({compareIds.length})
              </button>
            )}
            <button
              onClick={loadSavedData}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search & Filter Row (Only for Schemes tab) */}
        {activeTab === 'schemes' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved schemes by title, ministry, benefit, or category..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-gov-blue transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-gov-blue"
              >
                <option value="ALL">All Government Levels</option>
                <option value="STATE">Maharashtra State</option>
                <option value="CENTRALLY_SPONSORED">Centrally Sponsored</option>
                <option value="CENTRAL">Central Government</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded w-full" />
              <div className="h-10 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load saved schemes</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadSavedData}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : savedSchemes.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-10 sm:p-14 text-center shadow-card space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto text-purple-600">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Saved Schemes Workspace is Empty</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            You haven't bookmarked any government welfare schemes or student scholarships yet. 
            Browse our verified Maharashtra scheme directory or run your personalized eligibility check to save schemes.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gov-blue hover:bg-gov-navy text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-gov-blue/20"
            >
              <Compass className="w-4 h-4" />
              Explore All Schemes
            </Link>
            <Link
              href="/eligibility"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl transition"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              Check My Eligibility
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: Saved Schemes Cards Grid */}
          {activeTab === 'schemes' && (
            <div className="space-y-4">
              {filteredSchemes.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600 text-xs">
                  No saved schemes match your current search or filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSchemes.map((scheme) => {
                    const isSelectedForCompare = compareIds.includes(scheme.id);
                    return (
                      <div key={scheme.id} className="relative group flex flex-col">
                        {/* Compare Selector Bar above card */}
                        <div className="mb-2 flex items-center justify-between px-2">
                          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 select-none">
                            <input
                              type="checkbox"
                              checked={isSelectedForCompare}
                              onChange={() => handleToggleCompare(scheme.id)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                            />
                            <span>{isSelectedForCompare ? 'Selected for Compare' : 'Add to Compare'}</span>
                          </label>

                          <button
                            onClick={() => handleRemoveBookmark(scheme.id)}
                            title="Remove from saved"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Standard Scheme Card */}
                        <div className="flex-1">
                          <SchemeCard
                            scheme={scheme}
                            isBookmarked={true}
                            onBookmarkToggle={() => handleRemoveBookmark(scheme.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Aggregate Required Documents Checklist */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:lg font-bold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-600" />
                    Consolidated Citizen Document Checklist
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gather these {aggregatedDocuments.length} certificates to apply across your {savedSchemes.length} saved schemes.
                  </p>
                </div>
                <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 self-start sm:self-auto">
                  Aggregated across {savedSchemes.length} schemes
                </div>
              </div>

              {aggregatedDocuments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  None of your saved schemes specify mandatory document requirements in the database.
                </div>
              ) : (
                <div className="space-y-3">
                  {aggregatedDocuments.map((doc, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{doc.title}</span>
                          {doc.isMandatory ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              Supporting
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Required for: <strong className="text-slate-800">{doc.schemeNames.join(', ')}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Needed for {doc.schemeNames.length} {doc.schemeNames.length === 1 ? 'scheme' : 'schemes'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Side-by-Side Scheme Comparison */}
          {activeTab === 'comparison' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-600" />
                    Side-by-Side Scheme Comparison
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparing {comparisonSchemes.length} schemes on benefits, ministry, and eligibility criteria
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('schemes')}
                  className="text-xs font-bold text-gov-blue hover:text-gov-navy flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Back to Schemes
                </button>
              </div>

              {comparisonSchemes.length < 2 ? (
                <div className="text-center py-10 space-y-2">
                  <Scale className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Please select at least 2 schemes to compare.</p>
                  <button
                    onClick={() => setActiveTab('schemes')}
                    className="px-4 py-2 bg-gov-blue text-white rounded-xl text-xs font-bold"
                  >
                    Select Schemes
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-40 bg-slate-50">
                          Feature
                        </th>
                        {comparisonSchemes.map((scheme) => (
                          <th key={scheme.id} className="py-3 px-4 text-sm font-bold text-slate-900 w-1/3">
                            <div className="space-y-1">
                              <div>{getSchemeName(scheme)}</div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {scheme.government_level === 'STATE' ? 'Maharashtra State' : 'Central Government'}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {/* Department / Ministry */}
                      <tr>
                        <td className="py-3.5 px-4 font-bold text-slate-800 bg-slate-50/50">
                          Department / Ministry
                        </td>
                        {comparisonSchemes.map((s) => (
                          <td key={s.id} className="py-3.5 px-4">
                            {s.administering_ministry || s.ministry || 'State Government Department'}
                          </td>
                        ))}
                      </tr>

                      {/* Financial Benefit */}
                      <tr>
                        <td className="py-3.5 px-4 font-bold text-slate-800 bg-slate-50/50">
                          Primary Benefit
                        </td>
                        {comparisonSchemes.map((s) => (
                          <td key={s.id} className="py-3.5 px-4 font-bold text-gov-blue">
                            {formatBenefitCeiling(s)}
                          </td>
                        ))}
                      </tr>

                      {/* Categories */}
                      <tr>
                        <td className="py-3.5 px-4 font-bold text-slate-800 bg-slate-50/50">
                          Target Beneficiaries
                        </td>
                        {comparisonSchemes.map((s) => (
                          <td key={s.id} className="py-3.5 px-4">
                            {s.categories && s.categories.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {s.categories.map((c, i) => {
                                  const cName = typeof c === 'string' ? c : c.name;
                                  return (
                                    <span key={i} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-200">
                                      {cName}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              'Eligible Citizens'
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Required Documents */}
                      <tr>
                        <td className="py-3.5 px-4 font-bold text-slate-800 bg-slate-50/50">
                          Mandatory Documents
                        </td>
                        {comparisonSchemes.map((s) => {
                          const sDocs = (s as any).documents as Array<{ title?: string }> | undefined;
                          return (
                            <td key={s.id} className="py-3.5 px-4">
                              {sDocs && sDocs.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                  {sDocs.slice(0, 4).map((d, i) => (
                                    <li key={i}>{d.title}</li>
                                  ))}
                                  {sDocs.length > 4 && (
                                    <li className="text-slate-400 font-semibold">
                                      +{sDocs.length - 4} more
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                'Standard identity verification'
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Official Application Portal */}
                      <tr>
                        <td className="py-3.5 px-4 font-bold text-slate-800 bg-slate-50/50">
                          Application Portal
                        </td>
                        {comparisonSchemes.map((s) => {
                          const url = getOfficialSchemeUrl(s);
                          const portalInfo = getVerifiedPortalInfo(url);
                          return (
                            <td key={s.id} className="py-3.5 px-4">
                              {portalInfo.isDirectApp && url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                                >
                                  <span>Apply on {portalInfo.portalName}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                <Link
                                  href={`/schemes/${s.id}`}
                                  className="inline-flex items-center gap-1 text-gov-blue hover:underline font-bold"
                                >
                                  <span>View Scheme Guidelines</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
