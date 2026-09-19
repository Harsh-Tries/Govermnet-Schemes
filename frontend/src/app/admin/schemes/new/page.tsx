'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus } from 'lucide-react';

export default function CreateSchemePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [desc, setDesc] = useState('');
  const [level, setLevel] = useState('CENTRAL');
  const [schemeType, setSchemeType] = useState('GRANT');
  const [ministry, setMinistry] = useState('');
  const [funding, setFunding] = useState('100% Central');
  const [submitting, setSubmitting] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/schemes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || `scheme-${Date.now()}`,
          short_description: shortDesc,
          description: desc,
          government_level: level,
          scheme_type: schemeType,
          administering_ministry: ministry,
          funding_ratio: funding
        })
      });
      if (res.ok) {
        router.push('/admin');
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail || 'Failed to create scheme'}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-gov-blue">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Dashboard</span>
        </Link>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create New Government Scheme</h1>
          <p className="text-xs text-slate-500 mt-1">
            Initialize a new scheme draft in the knowledge base.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Scheme Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Higher Education Merit Scholarship Scheme 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-gov-blue"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">URL Slug *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. higher-education-merit-scholarship-2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-gov-blue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Government Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-gov-blue"
              >
                <option value="CENTRAL">CENTRAL</option>
                <option value="STATE">STATE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Scheme Type</label>
              <select
                value={schemeType}
                onChange={(e) => setSchemeType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-gov-blue"
              >
                <option value="SCHOLARSHIP">SCHOLARSHIP</option>
                <option value="SUBSIDY">SUBSIDY</option>
                <option value="GRANT">GRANT</option>
                <option value="LOAN">LOAN</option>
                <option value="PENSION">PENSION</option>
                <option value="TRAINING">TRAINING</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Administering Ministry / Department</label>
            <input
              type="text"
              value={ministry}
              onChange={(e) => setMinistry(e.target.value)}
              placeholder="e.g. Ministry of Social Justice and Empowerment"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-gov-blue"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Short Summary *</label>
            <textarea
              required
              rows={3}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Provide a concise 2-3 sentence overview of the scheme objectives..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-gov-blue"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link href="/admin" className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gov-blue text-white rounded-xl font-bold hover:bg-gov-blue/90 shadow-md shadow-gov-blue/20"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Draft...' : 'Save Scheme Draft'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
