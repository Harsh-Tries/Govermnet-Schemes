'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  BookOpen,
  Send,
  AlertTriangle
} from 'lucide-react';
import { AdminScheme } from '../../../../types/admin';
import { fetchSchemeById, performVerificationAction } from '../../../../services/adminApi';

export default function SchemeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [scheme, setScheme] = useState<AdminScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Rule Form State
  const [paramName, setParamName] = useState('annual_income');
  const [operator, setOperator] = useState('LESS_THAN_OR_EQUAL');
  const [compValue, setCompValue] = useState('250000');
  const [addingRule, setAddingRule] = useState(false);

  // New Source Form State
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceAuthority, setSourceAuthority] = useState('');
  const [addingSource, setAddingSource] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSchemeById(id);
    setScheme(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAction = async (action: any) => {
    setActionError(null);
    try {
      await performVerificationAction(id, action, `Executed ${action} via Detail Panel`);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingRule(true);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/schemes/${id}/eligibility-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logical_operator: 'AND',
          rules: [
            {
              parameter_name: paramName,
              operator: operator,
              comparison_value: isNaN(Number(compValue)) ? compValue : Number(compValue),
              is_mandatory: true,
              failure_message: `${paramName} constraint failed`
            }
          ]
        })
      });
      if (res.ok) {
        alert('Eligibility rule group added successfully!');
        await loadData();
      }
    } catch (err: any) {
      alert(`Error adding rule: ${err.message}`);
    } finally {
      setAddingRule(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSource(true);
    try {
      // 1. Create source
      const srcRes = await fetch('http://localhost:8000/api/v1/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: sourceUrl,
          source_type: 'OFFICIAL_PORTAL',
          authority: sourceAuthority || 'Ministry Authority',
          title: sourceTitle || 'Official Portal Gazette'
        })
      });
      if (srcRes.ok) {
        const srcData = await srcRes.json();
        // 2. Attach to scheme
        await fetch(`http://localhost:8000/api/v1/schemes/${id}/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source_id: srcData.id, notes: 'Attached via Admin UI' })
        });
        alert('Official source attached successfully!');
        setSourceUrl('');
        setSourceTitle('');
        await loadData();
      }
    } catch (err: any) {
      alert(`Error attaching source: ${err.message}`);
    } finally {
      setAddingSource(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading scheme knowledge base record...</div>;
  }

  if (!scheme) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-xs text-slate-500">Scheme not found in database.</p>
        <Link href="/admin" className="text-xs font-bold text-gov-blue hover:underline">Return to Admin Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-blue">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
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

      {/* Scheme Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
              {scheme.government_level}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {scheme.status}
            </span>
          </div>

          {/* Verification Lifecycle Actions Bar */}
          <div className="flex items-center gap-2 text-xs">
            {scheme.status === 'DRAFT' && (
              <button
                onClick={() => handleAction('SUBMIT')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit for Review
              </button>
            )}

            {scheme.status === 'UNDER_REVIEW' && (
              <button
                onClick={() => handleAction('VERIFY_SOURCE')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg font-bold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Verify Source
              </button>
            )}

            {(scheme.status === 'SOURCE_VERIFIED' || scheme.status === 'APPROVED') && (
              <button
                onClick={() => handleAction('PUBLISH')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Publish Scheme
              </button>
            )}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{scheme.name}</h1>
        <p className="text-xs text-slate-600 leading-relaxed">{scheme.short_description}</p>
      </div>

      {/* Grid: Rules & Sources Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Structured Eligibility Rules Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gov-blue" />
              Structured Eligibility Rules
            </h2>
            <span className="text-[10px] font-bold text-slate-400">Stored Logic</span>
          </div>

          {/* Add Rule Form */}
          <form onSubmit={handleAddRule} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <p className="font-bold text-slate-700 text-[11px]">Add Structured Rule Condition:</p>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={paramName}
                onChange={(e) => setParamName(e.target.value)}
                className="px-2.5 py-1.5 bg-white border rounded-lg outline-none"
              >
                <option value="annual_income">annual_income</option>
                <option value="age">age</option>
                <option value="landholding_acres">landholding_acres</option>
              </select>

              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="px-2.5 py-1.5 bg-white border rounded-lg outline-none"
              >
                <option value="LESS_THAN_OR_EQUAL">&lt;=</option>
                <option value="GREATER_THAN_OR_EQUAL">&gt;=</option>
                <option value="EQUALS">==</option>
              </select>

              <input
                type="text"
                value={compValue}
                onChange={(e) => setCompValue(e.target.value)}
                placeholder="Target value"
                className="px-2.5 py-1.5 bg-white border rounded-lg outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={addingRule}
              className="w-full py-1.5 bg-gov-blue text-white rounded-lg font-bold text-[11px] hover:bg-gov-blue/90"
            >
              {addingRule ? 'Storing Rule...' : '+ Store Structured Rule'}
            </button>
          </form>
        </div>

        {/* 2. Official Sources Verification Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Official Government Sources
            </h2>
            <span className="text-[10px] font-bold text-slate-400">Verifiable Links</span>
          </div>

          {/* Attached Sources List */}
          <div className="space-y-2">
            {scheme.sources && scheme.sources.length > 0 ? (
              scheme.sources.map((s) => (
                <div key={s.id} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{s.source.title}</p>
                    <a href={s.source.url} target="_blank" rel="noreferrer" className="text-[11px] text-gov-blue hover:underline flex items-center gap-1 mt-0.5">
                      <span>{s.source.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-rose-600 font-semibold p-3 bg-rose-50 rounded-xl border border-rose-200">
                ⚠️ No official source attached. Scheme cannot be published until an official .gov.in source is verified.
              </p>
            )}
          </div>

          {/* Attach Source Form */}
          <form onSubmit={handleAddSource} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <p className="font-bold text-slate-700 text-[11px]">Attach Official Source URL:</p>
            <input
              type="url"
              required
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Official URL (e.g. https://scholarships.gov.in/policy)"
              className="w-full px-2.5 py-1.5 bg-white border rounded-lg outline-none"
            />
            <input
              type="text"
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              placeholder="Source Title / Notification Name"
              className="w-full px-2.5 py-1.5 bg-white border rounded-lg outline-none"
            />
            <button
              type="submit"
              disabled={addingSource}
              className="w-full py-1.5 bg-emerald-700 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-800"
            >
              {addingSource ? 'Attaching Source...' : '+ Attach Official Source'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
