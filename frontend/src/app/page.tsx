'use client';

import React, { useState } from 'react';
import { QuickActionCard } from '../components/dashboard/QuickActionCard';
import { SchemeCard } from '../components/dashboard/SchemeCard';
import { AiInputPlaceholder } from '../components/ai/AiInputPlaceholder';
import { TrustIndicator } from '../components/ui/TrustIndicator';
import { MOCK_SCHEMES } from '../data/mockSchemes';
import { 
  Search, 
  CheckCircle2, 
  Briefcase, 
  Bookmark, 
  Sparkles,
  ChevronRight,
  Filter,
  UserCheck
} from 'lucide-react';

export default function HomePage() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['1', '2']);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredSchemes = MOCK_SCHEMES.filter((scheme) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'STUDENT') return scheme.beneficiaries.includes('Student');
    if (selectedFilter === 'FARMER') return scheme.beneficiaries.includes('Farmer');
    if (selectedFilter === 'ENTREPRENEUR') return scheme.beneficiaries.includes('Entrepreneur');
    if (selectedFilter === 'PWD') return scheme.beneficiaries.includes('Person with Disability');
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Trust Indicator Header Concept */}
      <TrustIndicator />

      {/* 2. Hero Section */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-gov-lightBlue/40 border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-card relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-blue/10 border border-gov-blue/20 text-gov-blue text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gov-blue" />
            <span>Smart Eligibility Discovery Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Find Government Schemes <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-blue via-teal-700 to-gov-orange">
              You're Eligible For
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            Discover government schemes and scholarships based on your profile, profession, location and eligibility. Evaluated deterministically with zero AI hallucination.
          </p>

          {/* User Profile Quick Match Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-slate-700">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Matching for: <strong>Rohan Sharma</strong> (Student, MP, ₹2.2L Income)</span>
            </div>
            <button className="text-gov-blue font-semibold hover:underline text-xs">
              Edit Profile Parameters →
            </button>
          </div>
        </div>
      </section>

      {/* 3. Quick Action Cards (4 Cards as requested) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <span className="text-xs text-slate-500 font-medium">Select a pathway</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Find Schemes"
            description="Browse all Central and State government welfare schemes with advanced filters."
            icon={Search}
            colorScheme="blue"
          />

          <QuickActionCard
            title="Check Eligibility"
            description="Run the deterministic rules engine against your socio-economic profile."
            icon={CheckCircle2}
            colorScheme="emerald"
            countBadge="Live Engine"
          />

          <QuickActionCard
            title="Explore by Profession"
            description="Discover schemes customized for Farmers, Students, MSMEs, Artisans & PwD."
            icon={Briefcase}
            colorScheme="amber"
          />

          <QuickActionCard
            title="Saved Schemes"
            description="View and track your bookmarked schemes and application document status."
            icon={Bookmark}
            colorScheme="purple"
            countBadge={`${bookmarkedIds.length} Saved`}
          />
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
            <h2 className="text-lg font-bold text-slate-900">Featured Verified Schemes</h2>
            <p className="text-xs text-slate-500">Government schemes evaluated against your active profile</p>
          </div>

          {/* Beneficiary Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {[
              { id: 'ALL', label: 'All Schemes' },
              { id: 'STUDENT', label: 'Students' },
              { id: 'FARMER', label: 'Farmers' },
              { id: 'ENTREPRENEUR', label: 'MSME' },
              { id: 'PWD', label: 'PwD' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  selectedFilter === tab.id
                    ? 'bg-gov-blue text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              isBookmarked={bookmarkedIds.includes(scheme.id)}
              onBookmarkToggle={toggleBookmark}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center pt-4">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:border-gov-blue hover:text-gov-blue text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm">
            <span>Explore All 3,000+ Verified Government Schemes</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
