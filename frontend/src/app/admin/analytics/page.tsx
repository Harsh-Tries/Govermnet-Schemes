'use client';

import React from 'react';
import { BarChart3, Users, HelpCircle, Search, PieChart, ShieldCheck } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const missingInfoData = [
    { parameter: 'Annual Family Income', percentage: 42, color: 'bg-gov-blue' },
    { parameter: 'Caste Category', percentage: 18, color: 'bg-emerald-500' },
    { parameter: 'Age', percentage: 13, color: 'bg-amber-500' },
    { parameter: 'State Domicile', percentage: 9, color: 'bg-purple-500' },
    { parameter: 'Education Level', percentage: 8, color: 'bg-rose-500' },
    { parameter: 'Other Attributes', percentage: 10, color: 'bg-slate-400' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-gov-blue" />
          Admin Analytics & Intelligence Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Platform-wide search trends, eligibility evaluation metrics, and missing citizen profile attribute distribution
        </p>
      </div>

      {/* Usage KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Daily Active Users</span>
            <Users className="w-4 h-4 text-gov-blue" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">124</p>
          <span className="text-[10px] text-emerald-600 font-bold">↑ 12% vs last week</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Weekly Active Users</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">840</p>
          <span className="text-[10px] text-emerald-600 font-bold">↑ 8% vs last week</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Monthly Active Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">3,120</p>
          <span className="text-[10px] text-emerald-600 font-bold">↑ 15% vs last month</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Evaluations Executed</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">1,450</p>
          <span className="text-[10px] text-slate-400 font-medium">100% Deterministic Engine</span>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Information Distribution Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                <span>Missing Citizen Profile Parameters (UNKNOWN Cause Analysis)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Top parameters missing when Phase 3 returns UNKNOWN status</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {missingInfoData.map((item) => (
              <div key={item.parameter} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.parameter}</span>
                  <span className="font-bold text-slate-900">{item.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Queried Categories & Intent Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-gov-blue" />
              <span>Top Queried Scheme Categories & Intent Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Most searched themes by citizens</p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">1. Scholarships & Higher Education</span>
              <span className="text-xs font-extrabold text-gov-blue">142 Queries (40%)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">2. Agriculture & Farmer Income Support</span>
              <span className="text-xs font-extrabold text-emerald-600">98 Queries (28%)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">3. Micro-Enterprise & Entrepreneurship</span>
              <span className="text-xs font-extrabold text-purple-600">64 Queries (18%)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">4. Women & Child Welfare Grants</span>
              <span className="text-xs font-extrabold text-rose-600">51 Queries (14%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
