import { authStorage } from './authApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ConditionResultDTO {
  parameter: string;
  operator: string;
  required_value: any;
  user_value: any;
  status: 'SATISFIED' | 'FAILED' | 'MISSING' | 'INVALID';
  failure_message?: string;
}

export interface SchemeEvaluationResultDTO {
  scheme_id: string;
  scheme_name: string;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN';
  satisfied_conditions: ConditionResultDTO[];
  failed_conditions: ConditionResultDTO[];
  missing_information: string[];
  explanations: string[];
  official_source?: string;
  last_verified_date?: string;
  short_description?: string;
  department?: string;
  category?: string;
  categories?: string[];
  beneficiary_types?: string[];
  benefits?: Array<{ title: string; amount?: number; unit?: string }>;
  benefit_type?: string;
  benefit_description?: string;
  official_portal_url?: string;
  is_recommended?: boolean;
  match_reasons?: string[];
}

export interface MatchingResponseDTO {
  total_schemes_evaluated: number;
  eligible_count: number;
  not_eligible_count: number;
  unknown_count: number;
  eligible: SchemeEvaluationResultDTO[];
  unknown: SchemeEvaluationResultDTO[];
  not_eligible: SchemeEvaluationResultDTO[];
  recommended_schemes?: SchemeEvaluationResultDTO[];
  categories?: string[];
  departments?: string[];
  benefit_types?: string[];
  education_levels?: string[];
  citizen_summary?: Record<string, any>;
  last_evaluated_at?: string;
}

export interface RuleComparisonRow {
  condition: string;
  parameter: string;
  operator: string;
  required_value: string;
  citizen_value: string;
  result: 'PASS' | 'FAIL' | 'NEEDS_INFO';
  message: string;
}

export interface SchemeReasonsDTO {
  scheme_id: string;
  scheme_name: string;
  status: string;
  rules_table: RuleComparisonRow[];
  explanations: string[];
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function matchSchemes(profileData?: Record<string, any>): Promise<MatchingResponseDTO> {
  const res = await fetch(`${API_BASE_URL}/eligibility/match`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ profile: profileData || {} })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to execute deterministic eligibility matching');
  }

  return await res.json();
}

export async function fetchSchemeReasons(schemeId: string): Promise<SchemeReasonsDTO> {
  const res = await fetch(`${API_BASE_URL}/eligibility/evaluations/${schemeId}/reasons`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to retrieve eligibility reasons');
  }

  return await res.json();
}
