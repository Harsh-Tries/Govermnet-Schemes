import { Scheme, GovernmentLevel } from '../types/scheme';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface SchemeFilterParams {
  search?: string;
  beneficiary?: string;
  governmentLevel?: string;
  sortBy?: string;
  category?: string;
}

export function formatBenefitCeiling(scheme: any): string {
  if (scheme.benefitAmount) return scheme.benefitAmount;
  if (scheme.benefits && scheme.benefits.length > 0) {
    const b = scheme.benefits[0];
    if (b.amount && b.amount_unit) {
      return `₹${Number(b.amount).toLocaleString('en-IN')} ${b.amount_unit}`;
    }
    if (b.amount) {
      return `₹${Number(b.amount).toLocaleString('en-IN')}`;
    }
    if (b.title) {
      return b.title;
    }
  }
  return 'Direct Government Assistance';
}

export function isSafeGovUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:') || trimmed.startsWith('file:')) {
    return false;
  }
  return trimmed.startsWith('https://') || trimmed.startsWith('http://');
}

export function getVerifiedPortalInfo(url: string | null | undefined): {
  portalName: string;
  isDirectApp: boolean;
  actionLabel: string;
} {
  if (!url || !isSafeGovUrl(url)) {
    return {
      portalName: 'Official Portal',
      isDirectApp: false,
      actionLabel: 'Official Portal Unavailable'
    };
  }

  const u = url.toLowerCase();
  if (u.includes('mahadbt2.maharashtra.gov.in')) {
    return { portalName: 'MahaDBT 2.0 (AY 2026-27)', isDirectApp: true, actionLabel: 'Apply on MahaDBT 2.0' };
  }
  if (u.includes('mahadbt.maharashtra.gov.in/farmer')) {
    return { portalName: 'MahaDBT Farmer Portal', isDirectApp: true, actionLabel: 'Apply on MahaDBT Farmer' };
  }
  if (u.includes('mahadbt.maharashtra.gov.in')) {
    return { portalName: 'MahaDBT Portal', isDirectApp: true, actionLabel: 'Apply on MahaDBT' };
  }
  if (u.includes('dte.maharashtra.gov.in')) {
    return { portalName: 'Maharashtra DTE', isDirectApp: false, actionLabel: 'View DTE Guidelines' };
  }
  if (u.includes('pmkisan.gov.in')) {
    return { portalName: 'PM-KISAN Portal', isDirectApp: true, actionLabel: 'Apply on PM-KISAN' };
  }
  if (u.includes('krishi.maharashtra.gov.in')) {
    return { portalName: 'Maharashtra Krishi', isDirectApp: true, actionLabel: 'Apply on Krishi Portal' };
  }
  if (u.includes('maha-cmegp.gov.in')) {
    return { portalName: 'CMEGP Maharashtra', isDirectApp: true, actionLabel: 'Apply on CMEGP Portal' };
  }
  if (u.includes('aaplesarkar.mahaonline.gov.in')) {
    return { portalName: 'Aaple Sarkar', isDirectApp: true, actionLabel: 'Apply on Aaple Sarkar' };
  }
  if (u.includes('pmfby.gov.in')) {
    return { portalName: 'PMFBY Portal', isDirectApp: true, actionLabel: 'Apply on PMFBY' };
  }
  if (u.includes('jeevandayee.gov.in')) {
    return { portalName: 'MJPJAY Portal', isDirectApp: true, actionLabel: 'Apply on MJPJAY' };
  }
  if (u.includes('beneficiary.nha.gov.in') || u.includes('pmjay.gov.in')) {
    return { portalName: 'Ayushman PM-JAY', isDirectApp: true, actionLabel: 'Apply on PM-JAY' };
  }
  if (u.includes('ladakibahin.maharashtra.gov.in')) {
    return { portalName: 'Ladki Bahin Portal', isDirectApp: true, actionLabel: 'Apply on Ladki Bahin' };
  }
  return { portalName: 'Official Government Portal', isDirectApp: true, actionLabel: 'Apply via Official Portal' };
}

export function getOfficialSchemeUrl(scheme: any): string | null {
  let candidate: string | null = null;
  if (scheme.officialUrl) candidate = scheme.officialUrl;
  else if (scheme.application_process?.official_application_url) {
    candidate = scheme.application_process.official_application_url;
  } else if (scheme.sources && scheme.sources.length > 0) {
    const s = scheme.sources.find((src: any) => src.source?.url);
    if (s?.source?.url) candidate = s.source.url;
  }

  if (candidate && isSafeGovUrl(candidate)) {
    return candidate.trim();
  }
  return null;
}

export function normalizeScheme(raw: any): Scheme {
  const level: GovernmentLevel = raw.government_level || raw.level || 'STATE';
  const title = raw.name || raw.title || 'Government Scheme';
  const summary = raw.short_description || raw.summary || raw.description || '';
  const ministry = raw.administering_ministry || raw.ministry || 'Government of Maharashtra';
  const benefitAmount = formatBenefitCeiling(raw);
  const officialUrl = getOfficialSchemeUrl(raw) || 'https://maharashtra.gov.in';
  const verified = raw.status === 'PUBLISHED' && Boolean(raw.sources && raw.sources.length > 0);
  const verificationDate = raw.published_at 
    ? new Date(raw.published_at).toISOString().split('T')[0]
    : '2026-10-29';

  return {
    ...raw,
    id: raw.id,
    slug: raw.slug || raw.id,
    name: title,
    title,
    short_description: summary,
    summary,
    administering_ministry: ministry,
    ministry,
    government_level: level,
    level,
    benefitAmount,
    officialUrl,
    verified,
    verificationDate,
    categories: raw.categories || [],
    beneficiaries: raw.beneficiaries || []
  };
}

export async function fetchPublishedSchemes(params?: SchemeFilterParams): Promise<Scheme[]> {
  try {
    const query = new URLSearchParams();
    if (params?.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params?.beneficiary && params.beneficiary !== 'ALL') {
      query.set('beneficiary_id', params.beneficiary);
    }
    if (params?.governmentLevel && params.governmentLevel !== 'ALL') {
      query.set('government_level', params.governmentLevel);
    }
    if (params?.category && params.category !== 'ALL') {
      query.set('category_id', params.category);
    }
    if (params?.sortBy) {
      query.set('sort_by', params.sortBy);
    } else {
      query.set('sort_by', 'state_first');
    }

    const res = await fetch(`${API_BASE_URL}/schemes?${query.toString()}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      console.warn(`Failed to fetch schemes: status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.map(normalizeScheme);
  } catch (err) {
    console.error('Error fetching published schemes:', err);
    return [];
  }
}

export async function fetchSchemeBySlugOrId(idOrSlug: string): Promise<Scheme | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/schemes/${idOrSlug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const raw = await res.json();
    return normalizeScheme(raw);
  } catch (err) {
    console.error('Error fetching scheme detail:', err);
    return null;
  }
}

export async function fetchBookmarkedSchemeIds(userId: string = 'demo-citizen-user'): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/bookmarks/ids?user_id=${encodeURIComponent(userId)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('Error fetching bookmarked scheme ids:', err);
    return [];
  }
}

export async function fetchBookmarkedSchemes(userId: string = 'demo-citizen-user'): Promise<Scheme[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/bookmarks?user_id=${encodeURIComponent(userId)}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(normalizeScheme);
      }
    }
  } catch (err) {
    console.warn('Error fetching bookmarked schemes from /bookmarks:', err);
  }

  // Fallback: fetch IDs and filter from published schemes
  try {
    const ids = await fetchBookmarkedSchemeIds(userId);
    if (ids.length === 0) return [];
    const all = await fetchPublishedSchemes();
    return all.filter((s: Scheme) => ids.includes(s.id));
  } catch (fallbackErr) {
    console.error('Failed to load bookmarked schemes via fallback:', fallbackErr);
    return [];
  }
}

export async function toggleSchemeBookmark(
  schemeId: string,
  isCurrentlyBookmarked: boolean,
  userId: string = 'demo-citizen-user'
): Promise<boolean> {
  try {
    if (isCurrentlyBookmarked) {
      // Remove bookmark
      const res = await fetch(`${API_BASE_URL}/bookmarks/${schemeId}?user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE'
      });
      return !res.ok; // returns false if successfully removed
    } else {
      // Add bookmark
      const res = await fetch(`${API_BASE_URL}/bookmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheme_id: schemeId, user_id: userId })
      });
      return res.ok; // returns true if successfully added
    }
  } catch (err) {
    console.error('Failed to toggle bookmark:', err);
    return isCurrentlyBookmarked; // preserve state on failure
  }
}
