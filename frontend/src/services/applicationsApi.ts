import { authStorage } from './authApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'DOCUMENTS_VERIFICATION'
  | 'DOCUMENTS_VERIFIED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_PROCESSING'
  | 'BENEFIT_DISBURSED'
  | 'WITHDRAWN'
  | 'COMPLETED';

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  old_status: string | null;
  new_status: string;
  title: string | null;
  source: string;
  notes: string | null;
  remarks: string | null;
  created_by: string | null;
  changed_at: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  user_id: string | null;
  document_name: string;
  document_type: string;
  mime_type: string | null;
  file_size: number | null;
  verification_status: string;
  uploaded_at: string;
  download_url: string | null;
}

export interface CitizenApplication {
  id: string;
  user_id: string | null;
  scheme_id: string;
  application_reference: string;
  application_type: 'FRESH' | 'RENEWAL' | string;
  application_date: string | null;
  status: ApplicationStatus;
  department: string | null;
  portal_url: string | null;
  tracking_method: 'MANUAL' | 'OFFICIAL_SYNC' | string;
  last_synced_at: string | null;
  rejection_reason: string | null;
  action_required_details: string | null;
  disbursement_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  status_history: ApplicationStatusHistory[];
  documents: ApplicationDocument[];
  scheme_name: string | null;
  scheme_category: string | null;
  scheme_portal_url: string | null;
  latest_update: ApplicationStatusHistory | null;
  progress_step: number;
}

export interface ApplicationSummary {
  total_applications: number;
  under_process: number;
  approved: number;
  action_required: number;
  rejected: number;
  withdrawn: number;
}

export interface CreateApplicationPayload {
  scheme_id: string;
  application_reference: string;
  application_type?: 'FRESH' | 'RENEWAL';
  application_date?: string;
  status?: ApplicationStatus;
  department?: string;
  portal_url?: string;
  tracking_method?: string;
  notes?: string;
}

export interface UpdateApplicationPayload {
  application_type?: string;
  department?: string;
  portal_url?: string;
  notes?: string;
  new_status?: ApplicationStatus;
  rejection_reason?: string;
  action_required_details?: string;
  disbursement_details?: string;
  status_update_title?: string;
  status_update_remarks?: string;
  source?: string;
}

export interface SchemeOption {
  id: string;
  name: string;
  administering_ministry?: string;
  scheme_type?: string;
  official_application_url?: string;
}

function getAuthHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchApplications(filters?: {
  search?: string;
  status?: string;
  sortBy?: string;
}): Promise<CitizenApplication[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
  if (filters?.sortBy) params.append('sort_by', filters.sortBy);

  const res = await fetch(`${API_BASE_URL}/applications?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch applications' }));
    throw new Error(err.detail || 'Failed to fetch applications');
  }
  return res.json();
}

export async function fetchApplicationSummary(): Promise<ApplicationSummary> {
  const res = await fetch(`${API_BASE_URL}/applications/summary`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch summary' }));
    throw new Error(err.detail || 'Failed to fetch summary');
  }
  return res.json();
}

export async function fetchApplicationById(id: string): Promise<CitizenApplication> {
  const res = await fetch(`${API_BASE_URL}/applications/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch application' }));
    throw new Error(err.detail || 'Failed to fetch application');
  }
  return res.json();
}

export async function createApplication(payload: CreateApplicationPayload): Promise<CitizenApplication> {
  const res = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create application' }));
    throw new Error(err.detail || 'Failed to create application');
  }
  return res.json();
}

export async function updateApplication(id: string, payload: UpdateApplicationPayload): Promise<CitizenApplication> {
  const res = await fetch(`${API_BASE_URL}/applications/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update application' }));
    throw new Error(err.detail || 'Failed to update application');
  }
  return res.json();
}

export async function fetchApplicationHistory(id: string): Promise<ApplicationStatusHistory[]> {
  const res = await fetch(`${API_BASE_URL}/applications/${id}/history`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch history' }));
    throw new Error(err.detail || 'Failed to fetch history');
  }
  return res.json();
}

export async function uploadApplicationDocument(
  id: string,
  file: File,
  documentType: string,
  documentName?: string
): Promise<ApplicationDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);
  if (documentName) {
    formData.append('document_name', documentName);
  }

  const res = await fetch(`${API_BASE_URL}/applications/${id}/documents`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to upload document' }));
    throw new Error(err.detail || 'Failed to upload document');
  }
  return res.json();
}

export async function deleteApplicationDocument(id: string, docId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/applications/${id}/documents/${docId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete document' }));
    throw new Error(err.detail || 'Failed to delete document');
  }
}

export async function fetchPublishedSchemesOptions(): Promise<SchemeOption[]> {
  const res = await fetch(`${API_BASE_URL}/schemes?status=PUBLISHED&limit=100`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  return (data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    administering_ministry: s.administering_ministry,
    scheme_type: s.scheme_type,
    official_application_url: s.application_process?.official_application_url || 'https://mahadbt.maharashtra.gov.in/',
  }));
}
