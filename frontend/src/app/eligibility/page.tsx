'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, User, Sliders, ShieldCheck, HelpCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { matchSchemes, MatchingResponseDTO, SchemeEvaluationResultDTO } from '../../services/intelligenceApi';
import { SchemeMatchCard } from '../../components/eligibility/SchemeMatchCard';

export default function EligibilityPage() {
  const [profile, setProfile] = useState<Record<string, any>>({
    age: 20,
    state_code: 'MP',
    annual_income: 220000,
    occupation_type: 'STUDENT',
    caste_category: 'OBC',
    is_pwd: false,
    course_level: 'UNDERGRADUATE'
  });

  const [activeTab, setActiveTab] = useState<'ALL' | 'ELIGIBLE' | 'UNKNOWN' | 'NOT_ELIGIBLE'>('ALL');
  const [matchingResult, setMatchingResult] = useState<MatchingResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState<boolean>(false);

  const executeMatching = async (currentProfile: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await matchSchemes(currentProfile);
      setMatchingResult(res);
    } catch (err: any) {
      console.warn('API call failed, displaying client error state:', err);
      setError(err.message || 'Unable to connect to Deterministic Eligibility Engine.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    executeMatching(profile);
  }, []);

  const handleUpdateProfile = (newValues: Record<string, any>) => {
    const updated = { ...profile, ...newValues };
    setProfile(updated);
    executeMatching(updated);
  };

  const handleProfileFieldChange = (key: string, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveProfileForm = (e: React.FormEvent) => {
    e.preventDefault();
    setShowProfileEditor(false);
    executeMatching(profile);
  };

  const filteredSchemes = (): SchemeEvaluationResultDTO[] => {
    if (!matchingResult) return [];
    if (activeTab === 'ELIGIBLE') return matchingResult.eligible;
    if (activeTab === 'UNKNOWN') return matchingResult.unknown;
    if (activeTab === 'NOT_ELIGIBLE') return matchingResult.not_eligible;
    return [...matchingResult.eligible, ...matchingResult.unknown, ...matchingResult.not_eligible];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            Deterministic Eligibility Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluates multi-attribute boolean rules deterministically over citizen socio-demographic profiles. Zero black-box scoring.
          </p>
        </div>
        <button
          onClick={() => executeMatching(profile)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Re-run Eligibility Engine</span>
        </button>
      </div>

      {/* Active Citizen Profile Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gov-blue text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Active Citizen Socio-Demographic Profile</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  VERIFIED PROFILE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Parameters used by evaluator to match rule conditions
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowProfileEditor(!showProfileEditor)}
            className="flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-xl text-xs font-bold hover:bg-gov-blue/90 transition-all shadow-sm"
          >
            <Sliders className="w-4 h-4" />
            <span>{showProfileEditor ? 'Close Profile Editor' : 'Modify Profile Attributes'}</span>
          </button>
        </div>

        {/* Profile Attribute Pills */}
        {!showProfileEditor && (
          <div className="flex flex-wrap gap-2 text-xs pt-2 border-t border-slate-100">
            {Object.entries(profile).map(([key, val]) => (
              <span key={key} className="bg-slate-100 px-3 py-1 rounded-lg text-slate-700 font-medium border border-slate-200/60">
                <strong className="text-slate-900 capitalize">{key.replace(/_/g, ' ')}:</strong>{' '}
                {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
              </span>
            ))}
          </div>
        )}

        {/* Dynamic Profile Editor Form */}
        {showProfileEditor && (
          <form onSubmit={handleSaveProfileForm} className="pt-4 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Age (Years)</label>
                <input
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => handleProfileFieldChange('age', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">State Code (Domicile)</label>
                <input
                  type="text"
                  value={profile.state_code || ''}
                  onChange={(e) => handleProfileFieldChange('state_code', e.target.value.toUpperCase())}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Annual Family Income (₹)</label>
                <input
                  type="number"
                  value={profile.annual_income || ''}
                  onChange={(e) => handleProfileFieldChange('annual_income', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Occupation / Primary Activity</label>
                <select
                  value={profile.occupation_type || ''}
                  onChange={(e) => handleProfileFieldChange('occupation_type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="FARMER">FARMER</option>
                  <option value="ENTREPRENEUR">ENTREPRENEUR</option>
                  <option value="JOB_SEEKER">JOB_SEEKER</option>
                  <option value="ARTISAN">ARTISAN</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Caste Category</label>
                <select
                  value={profile.caste_category || ''}
                  onChange={(e) => handleProfileFieldChange('caste_category', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Person with Disability (PwD)</label>
                <select
                  value={profile.is_pwd ? 'true' : 'false'}
                  onChange={(e) => handleProfileFieldChange('is_pwd', e.target.value === 'true')}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Course Level</label>
                <input
                  type="text"
                  value={profile.course_level || ''}
                  onChange={(e) => handleProfileFieldChange('course_level', e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-gov-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowProfileEditor(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gov-blue text-white rounded-xl text-xs font-bold hover:bg-gov-blue/90 transition-colors shadow-sm"
              >
                Save & Evaluate Rules
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Summary KPI Cards */}
      {matchingResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Evaluated Schemes</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{matchingResult.total_schemes_evaluated}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              📊
            </div>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-medium">Fully Eligible</p>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">{matchingResult.eligible_count}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 font-medium">Unknown (Needs Info)</p>
              <p className="text-xl font-bold text-amber-900 mt-0.5">{matchingResult.unknown_count}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-700 font-medium">Not Eligible</p>
              <p className="text-xl font-bold text-rose-900 mt-0.5">{matchingResult.not_eligible_count}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 space-x-4">
        {(['ALL', 'ELIGIBLE', 'UNKNOWN', 'NOT_ELIGIBLE'] as const).map((tab) => {
          let label = 'All Schemes';
          let count = matchingResult ? matchingResult.total_schemes_evaluated : 0;
          if (tab === 'ELIGIBLE') {
            label = 'Fully Eligible';
            count = matchingResult ? matchingResult.eligible_count : 0;
          } else if (tab === 'UNKNOWN') {
            label = 'Needs Information';
            count = matchingResult ? matchingResult.unknown_count : 0;
          } else if (tab === 'NOT_ELIGIBLE') {
            label = 'Not Eligible';
            count = matchingResult ? matchingResult.not_eligible_count : 0;
          }

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeTab === tab
                  ? 'text-gov-blue border-b-2 border-gov-blue'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{label}</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="text-xs font-medium">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
          ))}
        </div>
      )}

      {/* Scheme Evaluation Cards List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredSchemes().length > 0 ? (
            filteredSchemes().map((evalResult) => (
              <SchemeMatchCard
                key={evalResult.scheme_id}
                evaluation={evalResult}
                onUpdateProfile={handleUpdateProfile}
              />
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700">No scheme evaluations found in this category.</p>
              <p className="text-xs text-slate-400">Try adjusting active profile attributes or switching filter tabs.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
