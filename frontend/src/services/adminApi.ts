import { AdminScheme, SchemeStatus } from '../types/admin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function fetchAdminSchemes(statusFilter?: SchemeStatus): Promise<AdminScheme[]> {
  try {
    let url = `${API_BASE_URL}/schemes?include_all_statuses=true`;
    if (statusFilter) {
      url += `&status_filter=${statusFilter}`;
    }
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch schemes');
    return await res.json();
  } catch (error) {
    console.warn('Backend API unavailable, using fallback seed data context:', error);
    return [];
  }
}

export async function fetchSchemeById(id: string): Promise<AdminScheme | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/schemes/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error fetching scheme by ID:', error);
    return null;
  }
}

export async function performVerificationAction(
  schemeId: string, 
  action: 'SUBMIT' | 'VERIFY_SOURCE' | 'APPROVE' | 'PUBLISH' | 'REJECT' | 'FLAG_REVERIFICATION' | 'ARCHIVE',
  notes?: string
) {
  const res = await fetch(`${API_BASE_URL}/verification/schemes/${schemeId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Verification action failed');
  }
  return await res.json();
}
