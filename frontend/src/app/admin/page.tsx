'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Archive, 
  ExternalLink,
  Filter,
  Layers,
  Search,
  Check,
  Send,
  Eye
} from 'lucide-react';
import { AdminScheme, SchemeStatus } from '../../types/admin';
import { fetchAdminSchemes, performVerificationAction } from '../../services/adminApi';

// Fallback seed data if backend API is offline during initial render
const FALLBACK_ADMIN_SCHEMES: AdminScheme[] = [
  {
    id: 'demo-1',
    name: 'DEMO SCHOLARSHIP 2026 (FICTIONAL TEST DATA)',
    slug: 'demo-higher-education-scholarship-2026',
    short_description: 'Fictional test scholarship providing tuition fee waiver for eligible students.',
    government_level: 'CENTRAL',
    scheme_type: 'SCHOLARSHIP',
    status: 'PUBLISHED',
    administering_ministry: 'Demo Ministry of Education',
    created_at: '2026-09-18T15:00:00Z',
    updated_at: '2026-09-18T15:00:00Z',
    published_at: '2026-09-18T15:00:00Z',
    categories: [{ id: 'c1', code: 'SCHOLARSHIP', name: 'Scholarships & Higher Education Aid' }],
    beneficiaries: [{ id: 'b1', code: 'STUDENT', name: 'Student Aspirants' }],
    benefits: [],
    sources: [{ id: 's1', source: { id: 'src1', url: 'https://example.gov.in/demo-scholarship-policy', source_type: 'OFFICIAL_PORTAL', authority: 'Demo Board', title: 'Demo Gazette' } }]
  },
  {
    id: 'demo-2',
    name: 'DEMO FARMER DRIP AID 2026 (FICTIONAL TEST DATA)',
    slug: 'demo-farmer-drip-irrigation-2026',
    short_description: 'Fictional subsidy for micro-irrigation equipment for small farmers.',
    government_level: 'STATE',
    scheme_type: 'SUBSIDY',
    status: 'SOURCE_VERIFIED',
    administering_ministry: 'Demo Department of Agriculture',
    created_at: '2026-09-18T15:00:00Z',
    updated_at: '2026-09-18T15:00:00Z',
    categories: [{ id: 'c2', code: 'AGRICULTURE', name: 'Agriculture & Rural Subsidies' }],
    beneficiaries: [{ id: 'b2', code: 'FARMER', name: 'Farmers & Cultivators' }],
    benefits: [],
    sources: []
  },
  {
    id: 'demo-3',
    name: 'DEMO MSME CREDIT GUARANTEE 2026 (FICTIONAL TEST DATA)',
    slug: 'demo-msme-credit-guarantee-2026',
    short_description: 'Fictional credit guarantee scheme for new micro-enterprises.',
    government_level: 'CENTRAL',
    scheme_type: 'GRANT',
    status: 'DRAFT',
    administering_ministry: 'Demo Ministry of MSME',
    created_at: '2026-09-18T15:00:00Z',
    updated_at: '2026-09-18T15:00:00Z',
    categories: [{ id: 'c3', code: 'ENTREPRENEURSHIP', name: 'MSME & Entrepreneurship Credit' }],
    beneficiaries: [{ id: 'b3', code: 'ENTREPRENEUR', name: 'Micro Entrepreneurs' }],
    benefits: [],
    sources: []
  }
];

export default function AdminDashboardPage() {
  const [schemes, setSchemes] = useState<AdminScheme[]>(FALLBACK_ADMIN_SCHEMES);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadSchemes = async () => {
    setLoading(true);
    const filter = selectedStatus === 'ALL' ? undefined : (selectedStatus as SchemeStatus);
    const data = await fetchAdminSchemes(filter);
    if (data && data.length > 0) {
      setSchemes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSchemes();
  }, [selectedStatus]);

  const handleAction = async (schemeId: string, action: any) => {
    setActionError(null);
    try {
      await performVerificationAction(schemeId, action, `Action ${action} triggered via Admin UI`);
      await loadSchemes();
    } catch (err: any) {
      setActionError(err.message || 'Verification action failed');
    }
  };

  const getStatusBadge = (status: SchemeStatus) => {
    const badgeStyles: Record<SchemeStatus, { bg: string; text: string; icon: any }> = {
      DRAFT: { bg: 'bg-slate-100 text-slate-800 border-slate-300', text: 'Draft', icon: Clock },
      UNDER_REVIEW: { bg: 'bg-amber-50 text-amber-800 border-amber-300', text: 'Under Review', icon: Clock },
      SOURCE_VERIFIED: { bg: 'bg-blue-50 text-blue-800 border-blue-300', text: 'Source Verified', icon: ShieldCheck },
      APPROVED: { bg: 'bg-teal-50 text-teal-800 border-teal-300', text: 'Approved', icon: CheckCircle2 },
      PUBLISHED: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', text: 'Published', icon: CheckCircle2 },
      REVERIFICATION_REQUIRED: { bg: 'bg-rose-50 text-rose-800 border-rose-300', text: 'Re-verification Req', icon: AlertTriangle },
      ARCHIVED: { bg: 'bg-slate-200 text-slate-600 border-slate-400', text: 'Archived', icon: Archive }
    };
    const style = badgeStyles[status] || badgeStyles.DRAFT;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {style.text}
      </span>
    );
  };

  const filteredSchemes = schemes.filter(s => {
    if (searchTerm) {
      return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             s.short_description.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gov-blue bg-gov-lightBlue px-2 py-0.5 rounded">
              Phase 2 Knowledge Base
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Admin Portal
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-gov-blue" />
            Scheme Verification & Knowledge Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage scheme lifecycle, structured eligibility parameters, sources, and verification records.
          </p>
        </div>

        <Link
          href="/admin/schemes/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gov-blue text-white rounded-xl text-xs font-bold hover:bg-gov-blue/90 transition-all shadow-md shadow-gov-blue/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Scheme</span>
        </Link>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span><strong>Validation Error:</strong> {actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Status Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
        {[
          { id: 'ALL', label: 'All Schemes' },
          { id: 'DRAFT', label: 'Draft' },
          { id: 'UNDER_REVIEW', label: 'Under Review' },
          { id: 'SOURCE_VERIFIED', label: 'Source Verified' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'PUBLISHED', label: 'Published' },
          { id: 'ARCHIVED', label: 'Archived' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`p-3 rounded-xl border text-center font-semibold transition-all ${
              selectedStatus === tab.id
                ? 'bg-gov-blue text-white border-gov-blue shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter schemes by name or keywords..."
          className="w-full text-xs text-slate-800 bg-transparent outline-none"
        />
      </div>

      {/* Schemes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Scheme Name & Ministry</th>
                <th className="py-3.5 px-4">Govt Level</th>
                <th className="py-3.5 px-4">Taxonomy</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Sources</th>
                <th className="py-3.5 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchemes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No schemes found for the selected status.
                  </td>
                </tr>
              ) : (
                filteredSchemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 text-xs line-clamp-1">{scheme.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{scheme.administering_ministry || 'N/A'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700">
                        {scheme.government_level}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {scheme.categories.map(c => (
                          <span key={c.id || c.code} className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(scheme.status)}
                    </td>
                    <td className="py-4 px-4">
                      {scheme.sources && scheme.sources.length > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {scheme.sources.length} Official Source(s)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          No Source Attached
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/schemes/${scheme.id}`}
                          className="p-1.5 bg-slate-100 hover:bg-gov-blue hover:text-white rounded-lg transition-colors text-slate-600"
                          title="View Details & Edit Rules"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Lifecycle Buttons */}
                        {scheme.status === 'DRAFT' && (
                          <button
                            onClick={() => handleAction(scheme.id, 'SUBMIT')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Submit Review
                          </button>
                        )}

                        {scheme.status === 'UNDER_REVIEW' && (
                          <button
                            onClick={() => handleAction(scheme.id, 'VERIFY_SOURCE')}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Verify Source
                          </button>
                        )}

                        {(scheme.status === 'SOURCE_VERIFIED' || scheme.status === 'APPROVED') && (
                          <button
                            onClick={() => handleAction(scheme.id, 'PUBLISH')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Publish
                          </button>
                        )}

                        {scheme.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleAction(scheme.id, 'FLAG_REVERIFICATION')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Re-verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
