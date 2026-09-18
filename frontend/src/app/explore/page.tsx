'use client';

import React from 'react';
import { MOCK_SCHEMES } from '../../data/mockSchemes';
import { SchemeCard } from '../../components/dashboard/SchemeCard';
import { Compass, Filter, Search } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-gov-blue" />
            Explore Government Schemes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified scheme taxonomy across Central, State, and District categories
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, state, or ministry..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-gov-blue"
          />
        </div>
        <div className="flex gap-2">
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none">
            <option value="">All States / UTs</option>
            <option value="IN-MP">Madhya Pradesh</option>
            <option value="IN-MH">Maharashtra</option>
            <option value="IN-TN">Tamil Nadu</option>
          </select>
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none">
            <option value="">All Categories</option>
            <option value="Scholarship">Scholarship</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Entrepreneurship">Entrepreneurship</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MOCK_SCHEMES.map((scheme) => (
          <SchemeCard key={scheme.id} scheme={scheme} />
        ))}
      </div>
    </div>
  );
}
