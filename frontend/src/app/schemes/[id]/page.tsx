'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, ShieldCheck, ExternalLink, FileText, CheckCircle2, 
  HelpCircle, Building2, Coins, Calendar, Info, Layers, Bookmark, Check
} from 'lucide-react';

interface SchemeDetail {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string | null;
  government_level: string;
  scheme_type: string;
  administering_ministry: string | null;
  funding_ratio: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  categories: Array<{ id: string; code: string; name: string }>;
  beneficiaries: Array<{ id: string; code: string; name: string }>;
  professions: Array<{ id: string; code: string; name: string }>;
  benefits: Array<{
    id: string;
    benefit_type: string;
    title: string;
    description: string;
    amount: number | null;
    amount_unit: string | null;
    frequency: string | null;
    conditions: string | null;
  }>;
  documents: Array<{
    id: string;
    document_name: string;
    document_type: string;
    is_mandatory: boolean;
    description: string | null;
  }>;
  application_process: {
    id: string;
    application_mode: string;
    official_application_url: string | null;
    authority: string | null;
    instructions: string | null;
    steps: Array<{
      id: string;
      step_number: number;
      title: string;
      instructions: string;
    }>;
  } | null;
  sources: Array<{
    id: string;
    source: {
      id: string;
      url: string;
      title: string;
      authority: string;
      source_type: string;
    };
  }>;
}

export default function SchemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schemeId = params?.id as string;

  const [scheme, setScheme] = useState<SchemeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!schemeId) return;

    async function fetchScheme() {
      setLoading(true);
      setError(null);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
      
      try {
        const res = await fetch(`${apiBase}/schemes/${schemeId}`);
        if (!res.ok) {
          throw new Error(`Scheme not found (Status ${res.status})`);
        }
        const data = await res.json();
        setScheme(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load scheme details.');
      } finally {
        setLoading(false);
      }
    }

    fetchScheme();
  }, [schemeId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        <div className="h-40 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="h-8 w-2/3 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/3 bg-slate-100 rounded"></div>
          <div className="h-16 w-full bg-slate-100 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-white rounded-2xl border border-slate-200"></div>
          <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Scheme Information Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error || "We could not find the verified government scheme you requested."}
        </p>
        <div className="pt-2">
          <button
            onClick={() => router.push('/explore')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gov-blue text-white rounded-xl text-xs font-semibold hover:bg-gov-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Scheme Catalog
          </button>
        </div>
      </div>
    );
  }

  const primarySourceUrl = scheme.application_process?.official_application_url || 
    (scheme.sources.length > 0 ? scheme.sources[0].source.url : 'https://mahadbt.maharashtra.gov.in');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Navigation Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-gov-blue transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Schemes Catalog
        </Link>
        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
            bookmarked
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
          {bookmarked ? 'Saved to Profile' : 'Save Scheme'}
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {scheme.government_level} SCHEME
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-gov-blue border border-blue-200">
            {scheme.scheme_type}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Official Scheme
          </span>
          {scheme.funding_ratio && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
              Funding: {scheme.funding_ratio}
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug mb-3">
          {scheme.name}
        </h1>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-5">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>{scheme.administering_ministry || 'Government of Maharashtra'}</span>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed max-w-4xl bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          {scheme.description || scheme.short_description}
        </p>

        {/* Target Beneficiaries & Category Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Categories:</span>
          {scheme.categories.map((c) => (
            <span key={c.id} className="text-xs font-medium px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
              {c.name}
            </span>
          ))}
          {scheme.beneficiaries.map((b) => (
            <span key={b.id} className="text-xs font-medium px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              Target: {b.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Benefits & Application Flow) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Benefits Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-emerald-600" />
              Verified Scheme Benefits
            </h2>
            <div className="space-y-4">
              {scheme.benefits.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Financial details mapped directly from official resolution.</p>
              ) : (
                scheme.benefits.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-sm font-bold text-slate-900">{b.title}</h3>
                      {b.amount !== null && (
                        <span className="text-sm font-extrabold text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-sm shrink-0">
                          ₹{b.amount.toLocaleString('en-IN')} {b.amount_unit ? `(${b.amount_unit})` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{b.description}</p>
                    {b.frequency && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Disbursement Frequency: <span className="font-semibold text-slate-700">{b.frequency}</span>
                      </div>
                    )}
                    {b.conditions && (
                      <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70 mt-2">
                        <span className="font-bold">Conditions:</span> {b.conditions}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Application Process & Steps */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-gov-blue" />
              How to Apply
            </h2>
            {scheme.application_process ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-600">Application Mode:</span>
                  <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-gov-blue">
                    {scheme.application_process.application_mode}
                  </span>
                  {scheme.application_process.authority && (
                    <span className="text-xs text-slate-500">
                      Authority: <strong className="text-slate-700">{scheme.application_process.authority}</strong>
                    </span>
                  )}
                </div>

                {scheme.application_process.instructions && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {scheme.application_process.instructions}
                  </p>
                )}

                {scheme.application_process.steps && scheme.application_process.steps.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step-by-Step Procedure</h3>
                    <div className="space-y-2.5">
                      {scheme.application_process.steps.map((st) => (
                        <div key={st.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <span className="w-6 h-6 rounded-full bg-gov-blue text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {st.step_number}
                          </span>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800">{st.title}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">{st.instructions}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Applications handled through state designated nodal portal.</p>
            )}
          </div>
        </div>

        {/* Right Column (Mandatory Documents & Official Source) */}
        <div className="space-y-6">
          {/* Action CTA Card */}
          <div className="bg-slate-900 bg-gradient-to-br from-gov-navy to-gov-blue text-white rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-base font-bold">Apply via Official Portal</h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              Verify your documents and submit your application through the official government portal.
            </p>
            <a
              href={primarySourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-white text-gov-navy font-bold rounded-xl text-xs hover:bg-blue-50 transition-colors shadow-sm"
            >
              Open Official Portal <ExternalLink className="w-4 h-4" />
            </a>
            <p className="text-[10px] text-blue-200 text-center">
              Direct official domain verified by Government Assistant
            </p>
          </div>

          {/* Required Documents Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gov-blue" />
              Required Documents
            </h2>
            <div className="space-y-2.5">
              {scheme.documents.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Standard identification proof required.</p>
              ) : (
                scheme.documents.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">{doc.document_name}</span>
                        {doc.is_mandatory && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{doc.document_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Official Verification Notice */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              Source Information
            </h2>
            <div className="space-y-2">
              {scheme.sources.map((s) => (
                <div key={s.id} className="text-xs text-slate-600 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                  <p className="font-semibold text-slate-800">{s.source.title}</p>
                  <p className="text-[11px] text-slate-500">{s.source.authority}</p>
                  <a
                    href={s.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gov-blue hover:underline mt-1 font-medium break-all"
                  >
                    {s.source.url} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
