'use client';

import React, { useState } from 'react';
import { Search, Globe, User, Settings, Bell, Landmark } from 'lucide-react';

export const TopNav: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-card">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gov-blue text-white flex items-center justify-center shadow-md shadow-gov-blue/20">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-base tracking-tight leading-none">Government Scheme Assistant</span>
            <span className="text-[10px] font-semibold tracking-wider text-gov-blue bg-gov-lightBlue px-1.5 py-0.5 rounded border border-gov-blue/20">
              PHASE 1
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">National Welfare & Scholarship Eligibility Engine</p>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schemes by keyword, ministry, or state..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-xs text-slate-800 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right Action Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Selector */}
        <div className="relative flex items-center">
          <Globe className="w-4 h-4 text-slate-500 absolute left-2.5 pointer-events-none" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer outline-none focus:border-gov-blue"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="bn">বাংলা (Bengali)</option>
          </select>
        </div>

        {/* Notifications */}
        <button className="p-2 text-slate-600 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gov-orange"></span>
        </button>

        {/* Settings */}
        <button className="p-2 text-slate-600 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-colors hidden sm:block">
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gov-blue to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">Rohan Sharma</p>
            <p className="text-[10px] text-slate-500">Student Profile</p>
          </div>
        </div>
      </div>
    </header>
  );
};
