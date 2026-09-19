'use client';

import React, { useState } from 'react';
import { FileText, Plus, CheckCircle2, Clock, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

interface ApplicationItem {
  id: string;
  scheme_name: string;
  application_reference: string;
  application_date: string;
  status: 'SUBMITTED' | 'DOCUMENTS_VERIFIED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  source: 'CITIZEN_MANUAL' | 'OFFICIAL_INTEGRATION';
  department: string;
  notes: string;
}

const INITIAL_APPLICATIONS: ApplicationItem[] = [
  {
    id: 'app-1',
    scheme_name: 'MP Post Matric Scholarship Scheme for SC/ST/OBC Students',
    application_reference: 'MP-SCH-2026-88412',
    application_date: '2026-08-12',
    status: 'DOCUMENTS_VERIFIED',
    source: 'OFFICIAL_INTEGRATION',
    department: 'Department of Higher Education, MP',
    notes: 'Aadhaar e-KYC and Institute verification completed.'
  },
  {
    id: 'app-2',
    scheme_name: 'PM-KISAN Samman Nidhi',
    application_reference: 'PM-KISAN-992104',
    application_date: '2026-07-28',
    status: 'APPROVED',
    source: 'OFFICIAL_INTEGRATION',
    department: 'Ministry of Agriculture & Farmers Welfare',
    notes: 'Benefit installment disbursed via DBT.'
  }
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>(INITIAL_APPLICATIONS);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newSchemeName, setNewSchemeName] = useState('');
  const [newRef, setNewRef] = useState('');

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeName || !newRef) return;

    const newItem: ApplicationItem = {
      id: `app-${Date.now()}`,
      scheme_name: newSchemeName,
      application_reference: newRef,
      application_date: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED',
      source: 'CITIZEN_MANUAL',
      department: 'State Department',
      notes: 'Manually logged by citizen.'
    };

    setApplications([newItem, ...applications]);
    setShowAddModal(false);
    setNewSchemeName('');
    setNewRef('');
  };

  const renderStatusTimeline = (status: string) => {
    const steps = ['SUBMITTED', 'DOCUMENTS_VERIFIED', 'UNDER_REVIEW', 'APPROVED'];
    const currentIndex = steps.indexOf(status);

    return (
      <div className="flex items-center gap-2 pt-2">
        {steps.map((st, idx) => {
          const isDone = idx <= currentIndex;
          return (
            <React.Fragment key={st}>
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {idx + 1}
                </div>
                <span className={`text-[11px] font-semibold capitalize ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                  {st.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 ${idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-gov-blue" />
            Citizen Application Tracking Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track submission timelines, department updates, and status history for your scheme applications
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gov-blue hover:bg-gov-blue/90 text-white font-bold text-xs rounded-xl transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Track New Application</span>
        </button>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{app.scheme_name}</h3>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    app.source === 'OFFICIAL_INTEGRATION' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {app.source === 'OFFICIAL_INTEGRATION' ? '✓ Official Portal Sync' : 'Citizen Managed'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ref No: <strong className="text-slate-800 font-mono">{app.application_reference}</strong> • Department: {app.department}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Applied: {app.application_date}</span>
              </div>
            </div>

            {/* Status Timeline */}
            {renderStatusTimeline(app.status)}

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600">
              <strong>Latest Update:</strong> {app.notes}
            </div>
          </div>
        ))}
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Track New Application</h3>

            <form onSubmit={handleAddApplication} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Scheme Name</label>
                <input
                  type="text"
                  placeholder="e.g. Post-Matric Scholarship"
                  value={newSchemeName}
                  onChange={(e) => setNewSchemeName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Application Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. SCH-2026-991"
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gov-blue text-white rounded-xl text-xs font-bold"
                >
                  Save & Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
