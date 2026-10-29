import { authStorage } from './authApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface StudentDetails {
  course?: string;
  institution_type?: string;
  academic_year?: string;
  interests?: string[];
}

export interface FarmerDetails {
  landholding_category?: string;
  total_acres?: number;
  ownership_type?: string;
  irrigation_type?: string;
  crops?: string[];
}

export interface EntrepreneurDetails {
  business_stage?: string;
  sector?: string;
  investment_range?: string;
  udyam_status?: string;
}

export interface VulnerableDetails {
  udid_status?: string;
  disability_type?: string;
  is_head_of_household?: boolean;
  is_single_mother?: boolean;
  shg_member?: boolean;
}

export interface UserProfileData {
  id?: string;
  user_id?: string;
  email?: string | null;
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  marital_status?: string | null;
  state_code?: string | null;
  district_name?: string | null;
  taluka?: string | null;
  village_city?: string | null;
  residency_area?: string | null;
  is_maharashtra_resident?: boolean;
  annual_family_income?: number | null;
  caste_category?: string | null;
  occupation_type?: string | null;
  education_level?: string | null;
  is_pwd?: boolean;
  disability_percentage?: number | null;
  landholding_acres?: number | null;
  beneficiary_categories?: string[];
  student_details?: StudentDetails | null;
  farmer_details?: FarmerDetails | null;
  entrepreneur_details?: EntrepreneurDetails | null;
  vulnerable_details?: VulnerableDetails | null;
  onboarding_step?: number;
  is_onboarding_completed?: boolean;
  custom_attributes?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface RecommendationItem {
  scheme_id: string;
  scheme_name: string;
  slug?: string;
  short_description?: string;
  government_level: string;
  eligibility_status: string;
  match_score: number;
  explanation_factors: string[];
  missing_information: string[];
  official_url?: string;
  benefit_summary?: string;
  categories?: string[];
  verified?: boolean;
}

export interface RecommendationsResponse {
  citizen_summary: {
    name: string;
    district: string;
    occupation: string;
    income: number;
    category: string;
    is_onboarding_completed: boolean;
  };
  total_evaluated: number;
  top_matches: RecommendationItem[];
  scholarships: RecommendationItem[];
  farmer_schemes: RecommendationItem[];
  women_schemes: RecommendationItem[];
  msme_schemes: RecommendationItem[];
  disability_and_social: RecommendationItem[];
  all_recommendations: RecommendationItem[];
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchProfile(): Promise<UserProfileData> {
  const res = await fetch(`${API_BASE_URL}/profile/me`, {
    headers: getAuthHeaders(),
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`Failed to load profile (${res.status})`);
  }
  return res.json();
}

export async function updateProfile(data: Partial<UserProfileData>): Promise<UserProfileData> {
  const res = await fetch(`${API_BASE_URL}/profile/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to update profile' }));
    throw new Error(errorData.detail || `Update profile failed (${res.status})`);
  }
  return res.json();
}

export async function saveOnboardingStep(
  step: number,
  data: Record<string, any>
): Promise<UserProfileData> {
  const res = await fetch(`${API_BASE_URL}/profile/onboarding/step`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ step, data })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to save onboarding progress' }));
    throw new Error(errorData.detail || `Onboarding step failed (${res.status})`);
  }
  return res.json();
}

export async function fetchPersonalizedRecommendations(): Promise<RecommendationsResponse> {
  const res = await fetch(`${API_BASE_URL}/profile/recommendations`, {
    headers: getAuthHeaders(),
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`Failed to load recommendations (${res.status})`);
  }
  return res.json();
}
