'use client';

import React from 'react';
import { Search, X, RotateCcw, Check, SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  governmentLevel: string;
  onGovernmentLevelChange: (lvl: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export function SchemeFilterPanel({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  governmentLevel,
  onGovernmentLevelChange,
  sortBy,
  onSortByChange,
  onResetFilters,
  totalResultsCount,
}: FilterPanelProps) {
  if (!isOpen) return null;

  const hasActiveFilters = searchQuery.trim() !== '' || governmentLevel !== 'ALL' || sortBy !== 'state_first';

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gov-blue" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Advanced Filters & Sorting
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            ({totalResultsCount} matching schemes)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Close filter panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Keyword Search */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Search Schemes
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Ladki Bahin, DBT, Scholarship..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-blue shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Government Level Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Government Jurisdiction
          </label>
          <select
            value={governmentLevel}
            onChange={(e) => onGovernmentLevelChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-blue shadow-2xs"
          >
            <option value="ALL">All Jurisdictions (State & Central)</option>
            <option value="STATE">Maharashtra State Government</option>
            <option value="CENTRALLY_SPONSORED">Centrally Sponsored Scheme (Joint)</option>
            <option value="CENTRAL">Central Government</option>
          </select>
        </div>

        {/* 3. Sorting Options */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Sort Order
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-blue shadow-2xs"
          >
            <option value="state_first">Maharashtra State Schemes First (Default)</option>
            <option value="name_asc">Scheme Name (A to Z)</option>
            <option value="name_desc">Scheme Name (Z to A)</option>
            <option value="recently_verified">Recently Verified / Published</option>
          </select>
        </div>
      </div>
    </div>
  );
}
