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
}

export interface MatchingResponseDTO {
  total_schemes_evaluated: number;
  eligible_count: number;
  not_eligible_count: number;
  unknown_count: number;
  eligible: SchemeEvaluationResultDTO[];
  unknown: SchemeEvaluationResultDTO[];
  not_eligible: SchemeEvaluationResultDTO[];
}

export async function matchSchemes(profileData: Record<string, any>): Promise<MatchingResponseDTO> {
  const res = await fetch(`${API_BASE_URL}/eligibility/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: profileData })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to execute scheme matching');
  }

  return await res.json();
}
