'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Globe, User, Settings, Bell, Landmark, LogOut, Sparkles, UserCheck } from 'lucide-react';
import { authStorage, getCurrentUser, logoutCitizen, UserSession } from '../../services/authApi';

export const TopNav: React.FC = () => {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<UserSession | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Initial check from local storage
    const stored = authStorage.getUser();
    if (stored) {
      setUser(stored);
    }
    // Verify with server if token is present
    getCurrentUser()
      .then((serverUser) => {
        if (serverUser) setUser(serverUser);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = () => {
    setIsMenuOpen(false);
    setUser(null);
    logoutCitizen();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 flex items-center justify-between shadow-card">
      {/* Brand Logo & Name */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-gov-blue text-white flex items-center justify-center shadow-md shadow-gov-blue/20 group-hover:scale-105 transition-transform">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-base tracking-tight leading-none">Government Scheme Assistant</span>
            <span className="text-[10px] font-semibold tracking-wider text-gov-blue bg-gov-lightBlue px-1.5 py-0.5 rounded border border-gov-blue/20">
              MAHARASHTRA
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">Welfare &amp; Scholarship Deterministic Eligibility Engine</p>
        </div>
      </Link>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Maharashtra schemes by keyword, department, or level..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-xs text-slate-800 transition-all outline-none"
          />
        </form>
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
            <option value="mr">मराठी (Marathi)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>

        {/* Notifications */}
        <button 
          aria-label="View notifications"
          className="p-2 text-slate-600 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gov-orange"></span>
        </button>

        {/* User Auth / Profile Badge */}
        {user ? (
          <div className="relative pl-2 border-l border-slate-200">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 text-left focus:outline-none group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gov-blue to-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:ring-2 group-hover:ring-gov-blue/20 transition">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.full_name || user.email || 'Citizen'}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">
                  {user.is_onboarding_completed ? 'Verified Profile' : 'Citizen Account'}
                </p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-800 truncate">{user.full_name || 'Citizen'}</p>
                  <p className="text-slate-500 text-[11px] truncate">{user.email || 'Citizen Account'}</p>
                </div>
                <Link
                  href="/recommendations"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  <Sparkles className="w-4 h-4 text-gov-blue" />
                  <span>My Scheme Matches</span>
                </Link>
                <Link
                  href="/onboarding"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  <UserCheck className="w-4 h-4 text-gov-blue" />
                  <span>Edit Citizen Profile</span>
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium transition text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-gov-blue hover:bg-slate-100 rounded-lg transition"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="px-3.5 py-1.5 text-xs font-bold bg-gov-blue hover:bg-gov-blue/90 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
