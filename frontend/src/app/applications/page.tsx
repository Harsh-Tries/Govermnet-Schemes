'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  History,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  RotateCcw,
  Edit3,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
  Calendar,
  Building2,
  Tag,
  File,
  Info,
  Paperclip,
  ArrowRight,
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';
import {
  fetchApplications,
  fetchApplicationSummary,
  fetchApplicationById,
  createApplication,
  updateApplication,
  fetchApplicationHistory,
  uploadApplicationDocument,
  deleteApplicationDocument,
  fetchPublishedSchemesOptions,
  CitizenApplication,
  ApplicationSummary,
  ApplicationStatus,
  ApplicationStatusHistory,
  ApplicationDocument,
  SchemeOption
} from '../../services/applicationsApi';

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Applications' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'DOCUMENTS_VERIFICATION', label: 'Documents Verification' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'ADDITIONAL_INFO_REQUIRED', label: 'Action Required' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PAYMENT_PROCESSING', label: 'Payment Processing' },
  { id: 'BENEFIT_DISBURSED', label: 'Benefit Disbursed' },
  { id: 'REJECTED', label: 'Rejected' },
];

const SORT_OPTIONS = [
  { id: 'recently_updated', label: 'Recently Updated' },
  { id: 'recently_submitted', label: 'Recently Submitted' },
  { id: 'oldest', label: 'Oldest Applications' },
  { id: 'status', label: 'By Status' },
];

const STATUS_OPTIONS: { id: ApplicationStatus; label: string }[] = [
  { id: 'SUBMITTED', label: 'Application Submitted' },
  { id: 'DOCUMENTS_VERIFICATION', label: 'Documents Verification' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'ADDITIONAL_INFO_REQUIRED', label: 'Additional Information Required' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'PAYMENT_PROCESSING', label: 'Payment Processing' },
  { id: 'BENEFIT_DISBURSED', label: 'Benefit Disbursed' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'WITHDRAWN', label: 'Application Withdrawn' },
];

const DOCUMENT_TYPES = [
  { id: 'ACKNOWLEDGEMENT', label: 'Application Acknowledgement / Receipt' },
  { id: 'INCOME_CERTIFICATE', label: 'Income Certificate (Tahsildar)' },
  { id: 'CASTE_CERTIFICATE', label: 'Caste Certificate' },
  { id: 'DOMICILE_CERTIFICATE', label: 'Maharashtra Domicile Certificate' },
  { id: 'BONAFIDE_CERTIFICATE', label: 'College Bonafide / Admission Receipt' },
  { id: 'MARKSHEET', label: 'Educational Marksheet' },
  { id: 'BANK_PASSBOOK', label: 'Aadhaar-Seeded Bank Passbook' },
  { id: 'OTHER', label: 'Other Supporting Document' },
];

export default function ApplicationsPage() {
  // Application Data State
  const [applications, setApplications] = useState<CitizenApplication[]>([]);
  const [summary, setSummary] = useState<ApplicationSummary>({
    total_applications: 0,
    under_process: 0,
    approved: 0,
    action_required: 0,
    rejected: 0,
    withdrawn: 0
  });
  const [schemeOptions, setSchemeOptions] = useState<SchemeOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSort, setSelectedSort] = useState<string>('recently_updated');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDetailsModal, setShowDetailsModal] = useState<CitizenApplication | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<CitizenApplication | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<CitizenApplication | null>(null);
  const [historyTimeline, setHistoryTimeline] = useState<ApplicationStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Form State: Track New Application
  const [formSchemeId, setFormSchemeId] = useState<string>('');
  const [formRef, setFormRef] = useState<string>('');
  const [formType, setFormType] = useState<'FRESH' | 'RENEWAL'>('FRESH');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<ApplicationStatus>('SUBMITTED');
  const [formDepartment, setFormDepartment] = useState<string>('');
  const [formPortalUrl, setFormPortalUrl] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formDocFile, setFormDocFile] = useState<File | null>(null);
  const [formDocType, setFormDocType] = useState<string>('ACKNOWLEDGEMENT');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Form State: Update Status
  const [updateStatusVal, setUpdateStatusVal] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [updateTitle, setUpdateTitle] = useState<string>('');
  const [updateNotes, setUpdateNotes] = useState<string>('');
  const [updateRemarks, setUpdateRemarks] = useState<string>('');
  const [updateRejectionReason, setUpdateRejectionReason] = useState<string>('');
  const [updateActionDetails, setUpdateActionDetails] = useState<string>('');
  const [updateDisbursement, setUpdateDisbursement] = useState<string>('');
  const [updateSubmitting, setUpdateSubmitting] = useState<boolean>(false);

  // Document Upload State in Details Modal
  const [detailUploadFile, setDetailUploadFile] = useState<File | null>(null);
  const [detailUploadType, setDetailUploadType] = useState<string>('ACKNOWLEDGEMENT');
  const [detailUploading, setDetailUploading] = useState<boolean>(false);
  const [detailUploadError, setDetailUploadError] = useState<string | null>(null);

  // Load Schemes for Dropdown
  const loadSchemes = useCallback(async () => {
    try {
      const schemes = await fetchPublishedSchemesOptions();
      setSchemeOptions(schemes);
    } catch (err) {
      console.warn('Could not load scheme options:', err);
    }
  }, []);

  // Load Dashboard Data (Applications + Summary)
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [apps, summ] = await Promise.all([
        fetchApplications({
          search: searchQuery.trim() || undefined,
          status: selectedStatus,
          sortBy: selectedSort
        }),
        fetchApplicationSummary()
      ]);
      setApplications(apps);
      setSummary(summ);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setError(err.message || 'Unable to load citizen application records.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStatus, selectedSort]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-fill scheme department and portal URL when user selects a scheme
  const handleSchemeSelect = (schemeId: string) => {
    setFormSchemeId(schemeId);
    const selected = schemeOptions.find((s) => s.id === schemeId);
    if (selected) {
      if (selected.administering_ministry) {
        setFormDepartment(selected.administering_ministry);
      }
      if (selected.official_application_url) {
        setFormPortalUrl(selected.official_application_url);
      }
    }
  };

  // Handle Create Application
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchemeId) {
      setFormError('Please select a government scheme.');
      return;
    }
    if (!formRef.trim()) {
      setFormError('Please enter an application reference number.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const created = await createApplication({
        scheme_id: formSchemeId,
        application_reference: formRef.trim(),
        application_type: formType,
        application_date: formDate ? new Date(formDate).toISOString() : undefined,
        status: formStatus,
        department: formDepartment.trim() || undefined,
        portal_url: formPortalUrl.trim() || undefined,
        notes: formNotes.trim() || undefined,
        tracking_method: 'MANUAL'
      });

      // If document was attached, upload it
      if (formDocFile && created.id) {
        try {
          await uploadApplicationDocument(created.id, formDocFile, formDocType);
        } catch (uploadErr) {
          console.warn('Document upload warning:', uploadErr);
        }
      }

      setFormSuccessMessage(`Application ${created.application_reference} saved successfully!`);
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccessMessage(null);
        resetAddForm();
        loadData();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create application.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setFormSchemeId('');
    setFormRef('');
    setFormType('FRESH');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('SUBMITTED');
    setFormDepartment('');
    setFormPortalUrl('');
    setFormNotes('');
    setFormDocFile(null);
    setFormDocType('ACKNOWLEDGEMENT');
    setFormError(null);
  };

  // Open Full History Timeline Modal
  const handleOpenHistory = async (app: CitizenApplication) => {
    setShowHistoryModal(app);
    setLoadingHistory(true);
    try {
      const hist = await fetchApplicationHistory(app.id);
      setHistoryTimeline(hist);
    } catch (err) {
      console.warn('Could not load history:', err);
      setHistoryTimeline(app.status_history || []);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Open Update Modal
  const handleOpenUpdate = (app: CitizenApplication) => {
    setShowUpdateModal(app);
    setUpdateStatusVal(app.status);
    setUpdateTitle('');
    setUpdateNotes(app.notes || '');
    setUpdateRemarks('');
    setUpdateRejectionReason(app.rejection_reason || '');
    setUpdateActionDetails(app.action_required_details || '');
    setUpdateDisbursement(app.disbursement_details || '');
  };

  // Handle Update Submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUpdateModal) return;

    setUpdateSubmitting(true);
    try {
      await updateApplication(showUpdateModal.id, {
        new_status: updateStatusVal,
        status_update_title: updateTitle.trim() || undefined,
        notes: updateNotes.trim() || undefined,
        status_update_remarks: updateRemarks.trim() || undefined,
        rejection_reason: updateStatusVal === 'REJECTED' ? updateRejectionReason.trim() : undefined,
        action_required_details: updateStatusVal === 'ADDITIONAL_INFO_REQUIRED' ? updateActionDetails.trim() : undefined,
        disbursement_details: updateStatusVal === 'BENEFIT_DISBURSED' ? updateDisbursement.trim() : undefined,
        source: 'CITIZEN_MANUAL'
      });

      setShowUpdateModal(null);
      loadData();
      if (showDetailsModal && showDetailsModal.id === showUpdateModal.id) {
        const refreshed = await fetchApplicationById(showUpdateModal.id);
        setShowDetailsModal(refreshed);
      }
    } catch (err: any) {
      alert(`Update failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdateSubmitting(false);
    }
  };

  // Handle Document Upload in Details Modal
  const handleDetailUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDetailsModal || !detailUploadFile) return;

    setDetailUploading(true);
    setDetailUploadError(null);
    try {
      await uploadApplicationDocument(
        showDetailsModal.id,
        detailUploadFile,
        detailUploadType,
        detailUploadFile.name
      );
      setDetailUploadFile(null);
      const refreshed = await fetchApplicationById(showDetailsModal.id);
      setShowDetailsModal(refreshed);
      loadData();
    } catch (err: any) {
      setDetailUploadError(err.message || 'Upload failed');
    } finally {
      setDetailUploading(false);
    }
  };

  // Handle Document Delete
  const handleDetailDeleteDoc = async (docId: string) => {
    if (!showDetailsModal) return;
    if (!confirm('Are you sure you want to remove this uploaded document?')) return;

    try {
      await deleteApplicationDocument(showDetailsModal.id, docId);
      const refreshed = await fetchApplicationById(showDetailsModal.id);
      setShowDetailsModal(refreshed);
      loadData();
    } catch (err: any) {
      alert(`Failed to delete document: ${err.message || 'Error'}`);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedSort('recently_updated');
  };

  const isFiltered = searchQuery.trim() !== '' || selectedStatus !== 'ALL' || selectedSort !== 'recently_updated';

  // Helper for Status Badge Styling
  const getStatusBadge = (status: ApplicationStatus | string) => {
    switch (status) {
      case 'APPROVED':
      case 'BENEFIT_DISBURSED':
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: status === 'BENEFIT_DISBURSED' ? 'Benefit Disbursed' : 'Approved'
        };
      case 'ADDITIONAL_INFO_REQUIRED':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          dot: 'bg-amber-500 animate-pulse',
          label: 'Action Required'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Not Approved'
        };
      case 'PAYMENT_PROCESSING':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
          label: 'Payment Processing'
        };
      case 'DOCUMENTS_VERIFICATION':
      case 'DOCUMENTS_VERIFIED':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Documents Verification'
        };
      case 'UNDER_REVIEW':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'Under Review'
        };
      case 'SUBMITTED':
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-500',
          label: 'Submitted'
        };
    }
  };

  // Render 4-step progress tracker
  const renderProgressTracker = (app: CitizenApplication) => {
    const isRejected = app.status === 'REJECTED';
    const isActionRequired = app.status === 'ADDITIONAL_INFO_REQUIRED';
    const step = app.progress_step || 1;

    const stages = [
      { num: 1, label: 'Submitted' },
      { num: 2, label: 'Documents Verification' },
      { num: 3, label: 'Under Review' },
      { num: 4, label: isRejected ? 'Rejected' : 'Approved' }
    ];

    return (
      <div className="w-full pt-2">
        <div className="flex items-center justify-between relative">
          {stages.map((st, idx) => {
            const isCompleted = step > st.num || (step === 4 && !isRejected && st.num === 4);
            const isCurrent = step === st.num;
            const isStageRejected = isRejected && st.num === 4;

            let circleColor = 'bg-slate-100 text-slate-400 border-slate-300';
            if (isStageRejected) {
              circleColor = 'bg-rose-600 text-white border-rose-600 shadow-sm';
            } else if (isCompleted) {
              circleColor = 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
            } else if (isCurrent) {
              if (isActionRequired) {
                circleColor = 'bg-amber-500 text-white border-amber-500 shadow-sm animate-pulse';
              } else {
                circleColor = 'bg-gov-blue text-white border-gov-blue shadow-sm ring-4 ring-gov-blue/10';
              }
            }

            return (
              <div key={st.num} className="flex-1 flex flex-col items-center relative z-10">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${circleColor}`}
                >
                  {isStageRejected ? (
                    <X className="w-4 h-4" />
                  ) : isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    st.num
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-semibold mt-1.5 text-center leading-tight ${
                    isStageRejected
                      ? 'text-rose-700'
                      : isCompleted || isCurrent
                      ? 'text-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  {st.label}
                </span>

                {/* Connecting Line between steps */}
                {idx < stages.length - 1 && (
                  <div
                    className={`absolute top-3.5 left-1/2 w-full h-0.5 -z-10 ${
                      step > st.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Section */}
      <section className="bg-gradient-to-br from-white via-slate-50 to-gov-lightBlue/40 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Maharashtra Welfare Tracking System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-gov-blue" />
              Citizen Application Tracking Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Monitor your active applications across Maharashtra department portals (MahaDBT, Aaple Sarkar, PM-KISAN).
              Every status, reference number, and timeline event is verified against your citizen profile.
            </p>
          </div>

          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gov-blue hover:bg-gov-navy text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-gov-blue/20 self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Track New Application</span>
          </button>
        </div>
      </section>

      {/* 2. Top Summary Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Applications</span>
            <FileText className="w-4 h-4 text-gov-blue" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary.total_applications}</p>
          <span className="text-[11px] text-slate-400 font-medium">Database count</span>
        </div>

        {/* Under Process */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Under Process</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-sky-700">{summary.under_process}</p>
          <span className="text-[11px] text-slate-400 font-medium">Verification & Review</span>
        </div>

        {/* Approved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{summary.approved}</p>
          <span className="text-[11px] text-slate-400 font-medium">Disbursed & Sanctioned</span>
        </div>

        {/* Action Required */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Action Required</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-700">{summary.action_required}</p>
          <span className="text-[11px] text-slate-400 font-medium">Pending documents</span>
        </div>
      </section>

      {/* 3. Search, Filter & Sort Controls */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Search Bar + Sort Row */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scheme name, reference number, or department..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-gov-blue hover:bg-slate-100 transition-colors"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shrink-0"
              title="Refresh Applications"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
              Status:
            </span>
            {STATUS_FILTERS.map((tab) => {
              const isSelected = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-gov-blue text-white shadow-sm shadow-gov-blue/20'
                      : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline transition-colors ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </section>

      {/* 4. Applications List Section */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse">
              <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
              <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
              <div className="h-10 w-full bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Failed to Load Applications</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gov-lightBlue flex items-center justify-center mx-auto text-gov-blue">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No applications tracked yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Start tracking a government scheme application to monitor its progress, documents, and updates in one place.
            </p>
          </div>
          <button
            onClick={() => {
              resetAddForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gov-blue hover:bg-gov-navy text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-gov-blue/20"
          >
            <Plus className="w-4 h-4" />
            <span>Track New Application</span>
          </button>
        </div>
      ) : (
        /* Applications Cards */
        <div className="space-y-4">
          {applications.map((app) => {
            const statusBadge = getStatusBadge(app.status);

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-5 sm:p-6 space-y-5 shadow-sm transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {app.scheme_name || 'Government Welfare Scheme'}
                      </h3>
                      {app.scheme_category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {app.scheme_category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>
                        Ref:{' '}
                        <strong className="text-slate-800 font-mono tracking-wide">
                          {app.application_reference}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>{app.department || 'Government of Maharashtra'}</span>
                      <span>•</span>
                      <span className="text-slate-400 capitalize">
                        Type: {app.application_type.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Status & Mode Badges */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                    {/* Status Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusBadge.bg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                      <span>{statusBadge.label}</span>
                    </div>

                    {/* Tracking Mode Badge */}
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                      <span>Manual Tracking</span>
                    </div>
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="px-2 py-1">{renderProgressTracker(app)}</div>

                {/* Special Action / Alert Banners */}
                {app.status === 'ADDITIONAL_INFO_REQUIRED' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Action Required: </strong>
                      <span>
                        {app.action_required_details ||
                          'Additional documentation or clarification is required by the nodal verification officer.'}
                      </span>
                    </div>
                  </div>
                )}

                {app.status === 'REJECTED' && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-rose-900">
                    <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Rejection Details: </strong>
                      <span>
                        {app.rejection_reason ||
                          'Application was rejected by the department officer. Check rejection criteria in official portal.'}
                      </span>
                    </div>
                  </div>
                )}

                {app.status === 'BENEFIT_DISBURSED' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Benefit Disbursed: </strong>
                      <span>
                        {app.disbursement_details ||
                          'Welfare amount successfully credited to registered Aadhaar-seeded bank account via Direct Benefit Transfer (DBT).'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Latest Update Box */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gov-blue shrink-0" />
                    <span>
                      <strong>Latest Update:</strong>{' '}
                      {app.latest_update?.title || app.notes || 'Application logged in tracking system.'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    {app.application_date
                      ? `Applied: ${new Date(app.application_date).toLocaleDateString('en-IN')}`
                      : 'Recently updated'}
                  </span>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowDetailsModal(app)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenHistory(app)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>View History</span>
                    </button>

                    <button
                      onClick={() => handleOpenUpdate(app)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-gov-blue text-xs font-semibold transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update Status</span>
                    </button>
                  </div>

                  {/* Official Portal Link */}
                  {app.portal_url && (
                    <a
                      href={app.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-gov-blue hover:text-gov-navy hover:underline transition-colors ml-auto"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- MODAL 1: Track New Application ---------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Track New Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save your official government scheme application to track its progress.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{formSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Select Scheme */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Government Scheme <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSchemeId}
                  onChange={(e) => handleSchemeSelect(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                  required
                >
                  <option value="">-- Choose verified Maharashtra Scheme --</option>
                  {schemeOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ref Number + Submission Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Application Reference No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH-SCH-2026-9921"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Submission Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                    required
                  />
                </div>
              </div>

              {/* Application Type + Initial Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                  >
                    <option value="FRESH">Fresh Application</option>
                    <option value="RENEWAL">Renewal Application</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administering Department</label>
                <input
                  type="text"
                  placeholder="e.g. Higher and Technical Education Department"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                />
              </div>

              {/* Portal URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Portal URL</label>
                <input
                  type="url"
                  placeholder="https://mahadbt.maharashtra.gov.in/"
                  value={formPortalUrl}
                  onChange={(e) => setFormPortalUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personal Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Submitted at college helpdesk, scrutiny pending."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                />
              </div>

              {/* Optional Acknowledgement Receipt Upload */}
              <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Paperclip className="w-4 h-4 text-gov-blue" />
                  <span>Attach Acknowledgement Receipt (Optional)</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setFormDocFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-100"
                  />
                  <select
                    value={formDocType}
                    onChange={(e) => setFormDocType(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                  >
                    {DOCUMENT_TYPES.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Accepted formats: PDF, PNG, JPG (Max 5MB). Stored securely.
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-gov-blue hover:bg-gov-navy text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {formSubmitting ? 'Saving Application...' : 'Save & Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 2: View Full History Timeline ---------------- */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Application Timeline & History</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ref: <strong className="font-mono">{showHistoryModal.application_reference}</strong> •{' '}
                  {showHistoryModal.scheme_name}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading timeline history...</div>
            ) : historyTimeline.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No status events recorded yet.</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {historyTimeline.map((item, idx) => (
                  <div key={item.id} className="flex items-start gap-3 relative">
                    {/* Circle marker */}
                    <div className="w-7 h-7 rounded-full bg-gov-lightBlue text-gov-blue flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {historyTimeline.length - idx}
                    </div>

                    <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900">
                          {item.title || item.new_status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.changed_at).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {item.old_status && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span className="line-through">{item.old_status.replace(/_/g, ' ')}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <strong className="text-gov-blue">{item.new_status.replace(/_/g, ' ')}</strong>
                        </div>
                      )}

                      {item.notes && <p className="text-xs text-slate-600 pt-0.5">{item.notes}</p>}
                      {item.remarks && (
                        <p className="text-[11px] text-slate-500 italic">Remark: {item.remarks}</p>
                      )}

                      <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Source: {item.source.replace(/_/g, ' ')}</span>
                        {item.created_by && <span>• by {item.created_by}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowHistoryModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 3: Update Application Status ---------------- */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Update Application Progress</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record new status updates received from the department or official portal.
                </p>
              </div>
              <button
                onClick={() => setShowUpdateModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Application Status</label>
                <select
                  value={updateStatusVal}
                  onChange={(e) => setUpdateStatusVal(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Update Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scrutiny passed by college clerk"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-gov-blue outline-none transition"
                />
              </div>

              {/* Conditional fields based on status */}
              {updateStatusVal === 'ADDITIONAL_INFO_REQUIRED' && (
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">
                    Action Required / Missing Document Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Income certificate from Tahsildar required for FY 2025-26."
                    value={updateActionDetails}
                    onChange={(e) => setUpdateActionDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-amber-900 focus:bg-white outline-none"
                    required
                  />
                </div>
              )}

              {updateStatusVal === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-bold text-rose-800 mb-1">Official Rejection Reason</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Annual family income exceeds ₹8,00,000 threshold."
                    value={updateRejectionReason}
                    onChange={(e) => setUpdateRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-rose-900 focus:bg-white outline-none"
                    required
                  />
                </div>
              )}

              {updateStatusVal === 'BENEFIT_DISBURSED' && (
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">Disbursement Details</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹15,000 credited via DBT to Bank of Maharashtra A/C ending in 4102."
                    value={updateDisbursement}
                    onChange={(e) => setUpdateDisbursement(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs text-emerald-900 focus:bg-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional context about this stage update..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Officer Remarks (if any)</label>
                <input
                  type="text"
                  placeholder="Remarks visible on government portal"
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(null)}
                  disabled={updateSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSubmitting}
                  className="px-5 py-2 bg-gov-blue hover:bg-gov-navy text-white rounded-xl text-xs font-bold"
                >
                  {updateSubmitting ? 'Saving...' : 'Save Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 4: Application Details View ---------------- */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-gov-blue uppercase tracking-wider">Application Dossier</span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{showDetailsModal.scheme_name}</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Reference No.</span>
                <strong className="text-slate-800 font-mono">{showDetailsModal.application_reference}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Submission Date</span>
                <strong className="text-slate-800">
                  {showDetailsModal.application_date
                    ? new Date(showDetailsModal.application_date).toLocaleDateString('en-IN')
                    : 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Application Type</span>
                <strong className="text-slate-800 capitalize">{showDetailsModal.application_type.toLowerCase()}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Current Status</span>
                <strong className="text-gov-blue font-bold">{showDetailsModal.status.replace(/_/g, ' ')}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tracking Method</span>
                <strong className="text-slate-800">{showDetailsModal.tracking_method}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Department</span>
                <strong className="text-slate-800 truncate block">
                  {showDetailsModal.department || 'Government of Maharashtra'}
                </strong>
              </div>
            </div>

            {/* Uploaded Documents Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Uploaded Documents ({showDetailsModal.documents?.length || 0})</span>
                </h4>
              </div>

              {showDetailsModal.documents && showDetailsModal.documents.length > 0 ? (
                <div className="space-y-2">
                  {showDetailsModal.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-gov-blue shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">{doc.document_name}</p>
                          <span className="text-[10px] text-slate-400">
                            {doc.document_type.replace(/_/g, ' ')} • Uploaded{' '}
                            {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.download_url && (
                          <a
                            href={doc.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gov-blue hover:bg-white rounded-lg transition"
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDetailDeleteDoc(doc.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No supporting documents uploaded for this application.</p>
              )}

              {/* Add New Document Form */}
              <form onSubmit={handleDetailUploadSubmit} className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setDetailUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border file:border-slate-200 file:bg-slate-50 file:text-xs"
                />
                <select
                  value={detailUploadType}
                  onChange={(e) => setDetailUploadType(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!detailUploadFile || detailUploading}
                  className="px-3 py-1.5 bg-gov-blue hover:bg-gov-navy disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0"
                >
                  {detailUploading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
              {detailUploadError && <p className="text-[11px] text-rose-600">{detailUploadError}</p>}
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Application Receipt - ${showDetailsModal.application_reference}</title>
                            <style>
                              body { font-family: sans-serif; padding: 30px; line-height: 1.5; color: #1e293b; }
                              h1 { font-size: 20px; color: #0f4c81; border-bottom: 2px solid #0f4c81; padding-bottom: 8px; }
                              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                              td, th { padding: 10px; border: 1px solid #e2e8f0; font-size: 13px; }
                              th { background: #f8fafc; text-align: left; width: 35%; }
                            </style>
                          </head>
                          <body>
                            <h1>Maharashtra Welfare Scheme Application Record</h1>
                            <table>
                              <tr><th>Scheme Name</th><td>${showDetailsModal.scheme_name}</td></tr>
                              <tr><th>Application Reference No.</th><td><strong>${showDetailsModal.application_reference}</strong></td></tr>
                              <tr><th>Application Status</th><td>${showDetailsModal.status}</td></tr>
                              <tr><th>Department</th><td>${showDetailsModal.department || 'N/A'}</td></tr>
                              <tr><th>Submission Date</th><td>${showDetailsModal.application_date || 'N/A'}</td></tr>
                              <tr><th>Tracking Mode</th><td>Manual Citizen Tracking</td></tr>
                              <tr><th>Official Portal</th><td>${showDetailsModal.portal_url || 'https://mahadbt.maharashtra.gov.in/'}</td></tr>
                            </table>
                            <p style="margin-top:30px; font-size: 11px; color: #64748b;">
                              Generated via Government Scheme Assistant — Maharashtra Welfare & Scholarship Directory
                            </p>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Summary</span>
                </button>

                <button
                  onClick={() => {
                    const currentApp = showDetailsModal;
                    setShowDetailsModal(null);
                    handleOpenHistory(currentApp);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </button>
              </div>

              {showDetailsModal.portal_url && (
                <a
                  href={showDetailsModal.portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gov-blue hover:bg-gov-navy text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  <span>Open Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
