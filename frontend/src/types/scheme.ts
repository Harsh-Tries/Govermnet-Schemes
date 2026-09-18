export type GovernmentLevel = 'CENTRAL' | 'STATE' | 'CENTRALLY_SPONSORED' | 'LOCAL';

export type BeneficiaryCategory = 
  | 'Student'
  | 'Farmer'
  | 'Entrepreneur'
  | 'Job Seeker'
  | 'Senior Citizen'
  | 'Woman'
  | 'Person with Disability'
  | 'Worker & Artisan';

export type SchemeCategoryType = 
  | 'Scholarship'
  | 'Education'
  | 'Agriculture'
  | 'Employment'
  | 'Entrepreneurship'
  | 'Housing'
  | 'Healthcare'
  | 'Social Security'
  | 'Financial Assistance';

export interface Scheme {
  id: string;
  code: string;
  title: string;
  summary: string;
  ministry: string;
  level: GovernmentLevel;
  state?: string;
  categories: SchemeCategoryType[];
  beneficiaries: BeneficiaryCategory[];
  benefitAmount: string;
  officialUrl: string;
  verified: boolean;
  verificationDate: string;
  matchScore?: number;
  eligibilityStatus?: 'FULLY_ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'CHECK_REQUIRED';
}

export interface UserProfileSummary {
  name: string;
  age: number;
  gender: string;
  state: string;
  profession: string;
  income: string;
  caste: string;
  isPwd: boolean;
}
