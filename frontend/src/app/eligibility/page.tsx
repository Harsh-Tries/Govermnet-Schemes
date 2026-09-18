'use client';

import React from 'react';
import { CheckCircle2, User, Sliders, ShieldCheck } from 'lucide-react';
import { MOCK_SCHEMES } from '../../data/mockSchemes';
import { SchemeCard } from '../../components/dashboard/SchemeCard';

export default function EligibilityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Deterministic Eligibility Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluates multi-attribute rules deterministically against citizen socio-demographic profiles
          </p>
        </div>
      </div>

      {/* Active Profile Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gov-blue text-white flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Rohan Sharma (Active Profile)</h3>
              <p className="text-xs text-slate-500">Student Aspirant • MP Domicile</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs pt-2">
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-medium">Age: 20 Years</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-medium">Income: ₹2,20,000 / year</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-medium">Category: OBC</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 font-medium">Course: B.Tech (2nd Year)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
          <button className="flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-xl text-xs font-bold hover:bg-gov-blue/90 transition-all shadow-sm">
            <Sliders className="w-4 h-4" />
            <span>Modify Profile Attributes</span>
          </button>
        </div>
      </div>

      {/* Fully Eligible Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Fully Eligible Schemes (100% Rule Match)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MOCK_SCHEMES.filter(s => s.eligibilityStatus === 'FULLY_ELIGIBLE').map((scheme) => (
            <SchemeCard key={scheme.id} scheme={scheme} />
          ))}
        </div>
      </div>
    </div>
  );
}
