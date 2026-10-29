'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MOCK_SCHEMES } from '../../data/mockSchemes';
import { SchemeCard } from '../../components/dashboard/SchemeCard';
import { Scheme, GovernmentLevel } from '../../types/scheme';
import { Compass, Search, RefreshCw, Database, Sparkles, Filter } from 'lucide-react';

interface BackendScheme {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string | null;
  government_level: string;
  scheme_type: string;
  administering_ministry: string | null;
  categories: Array<{ id: string; code: string; name: string }>;
  beneficiaries: Array<{ id: string; code: string; name: string }>;
  benefits: Array<{
    title: string;
    amount: number | null;
    amount_unit: string | null;
    frequency: string | null;
  }>;
  application_process: {
    official_application_url: string | null;
  } | null;
  sources: Array<{
    source: {
      url: string;
      title: string;
    };
  }>;
}

export default function ExplorePage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchSchemes = async () => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

    try {
      const res = await fetch(`${apiBase}/schemes`);
      if (!res.ok) throw new Error('API request failed');
      const data: BackendScheme[] = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const mapped: Scheme[] = data.map((s) => {
          // Determine best representative benefit amount string
          let benefitStr = 'Aid as per Govt Norms';
          if (s.benefits && s.benefits.length > 0) {
            const b = s.benefits[0];
            if (b.amount !== null && b.amount > 0) {
              benefitStr = `Up to ₹${b.amount.toLocaleString('en-IN')}${b.frequency ? ` (${b.frequency})` : ''}`;
            } else if (b.title) {
              benefitStr = b.title;
            }
          }

          const officialUrl =
            s.application_process?.official_application_url ||
            (s.sources && s.sources.length > 0 ? s.sources[0].source.url : 'https://mahadbt.maharashtra.gov.in');

          return {
            id: s.slug || s.id,
            code: s.slug,
            title: s.name,
            summary: s.short_description,
            ministry: s.administering_ministry || 'Government of Maharashtra',
            level: s.government_level as GovernmentLevel,
            state: s.government_level === 'STATE' ? 'Maharashtra' : 'All India / Maharashtra',
            categories: s.categories.map((c) => c.name as any),
            beneficiaries: s.beneficiaries.map((b) => b.name as any),
            benefitAmount: benefitStr,
            officialUrl: officialUrl,
            verified: true,
            verificationDate: 'October 2026',
            eligibilityStatus: 'FULLY_ELIGIBLE'
          };
        });

        setSchemes(mapped);
        setIsLiveApi(true);
      } else {
        setSchemes(MOCK_SCHEMES);
        setIsLiveApi(false);
      }
    } catch (err) {
      console.warn('Backend API unavailable, falling back to mock catalog:', err);
      setSchemes(MOCK_SCHEMES);
      setIsLiveApi(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      // Text search
      const q = searchQuery.toLowerCase().trim();
      const schemeTitle = scheme.title || scheme.name || '';
      const schemeSummary = scheme.summary || scheme.short_description || '';
      const schemeMinistry = scheme.ministry || scheme.administering_ministry || '';

      const matchesSearch =
        !q ||
        schemeTitle.toLowerCase().includes(q) ||
        schemeSummary.toLowerCase().includes(q) ||
        schemeMinistry.toLowerCase().includes(q);

      // State filter
      const matchesState =
        !selectedState ||
        (selectedState === 'IN-MH' && (scheme.state?.includes('Maharashtra') || scheme.government_level === 'STATE' || scheme.level === 'STATE' || scheme.level === 'CENTRAL' || scheme.government_level === 'CENTRAL')) ||
        (selectedState === 'IN-MP' && scheme.state?.includes('Madhya Pradesh')) ||
        (selectedState === 'IN-TN' && scheme.state?.includes('Tamil Nadu'));

      // Category filter
      const matchesCategory =
        !selectedCategory ||
        scheme.categories.some((c) => {
          const catName = typeof c === 'string' ? c : (c.name || c.code || '');
          return catName.toLowerCase().includes(selectedCategory.toLowerCase());
        });

      return matchesSearch && matchesState && matchesCategory;
    });
  }, [schemes, searchQuery, selectedState, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-gov-blue" />
            Explore Government Schemes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified scheme taxonomy across Maharashtra and Centrally-sponsored initiatives
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLiveApi ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Live Knowledge Base ({schemes.length} schemes)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
              Offline Catalog Mode
            </span>
          )}
          <button
            onClick={fetchSchemes}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Scheme Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified schemes by name, keyword, or department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-gov-blue transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-gov-blue"
          >
            <option value="">All States / UTs</option>
            <option value="IN-MH">Maharashtra (Verified)</option>
            <option value="IN-MP">Madhya Pradesh</option>
            <option value="IN-TN">Tamil Nadu</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-gov-blue"
          >
            <option value="">All Categories</option>
            <option value="Scholarship">Scholarships & Education</option>
            <option value="Agriculture">Agriculture & Farming</option>
            <option value="Women">Women & Children</option>
            <option value="Health">Healthcare & Insurance</option>
            <option value="Housing">Housing & Shelter</option>
            <option value="MSME">MSME & Employment</option>
            <option value="Social">Social Security & Pensions</option>
          </select>
        </div>
      </div>

      {/* Results Count & Badges */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{filteredSchemes.length}</strong> of{' '}
          <strong className="text-slate-800">{schemes.length}</strong> schemes
        </span>
        {(searchQuery || selectedState || selectedCategory) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedState('');
              setSelectedCategory('');
            }}
            className="text-gov-blue hover:underline font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
          ))}
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Filter className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No schemes match your filter criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, or clear selected state and category filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedState('');
              setSelectedCategory('');
            }}
            className="px-4 py-2 bg-gov-blue text-white rounded-xl text-xs font-semibold hover:bg-gov-navy transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchemes.map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      )}
    </div>
  );
}
