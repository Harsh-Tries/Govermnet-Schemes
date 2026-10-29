export type GovernmentLevel = 'CENTRAL' | 'STATE' | 'CENTRALLY_SPONSORED' | 'OTHER' | 'LOCAL';

export type EligibilityStatus = 
  | 'FULLY_ELIGIBLE' 
  | 'ELIGIBLE'
  | 'PARTIALLY_ELIGIBLE' 
  | 'NOT_ELIGIBLE'
  | 'CHECK_REQUIRED' 
  | 'UNKNOWN'
  | 'NOT_ASSESSED';

export interface SchemeTaxonomyItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface SchemeBenefitItem {
  id?: string;
  benefit_type: string;
  title: string;
  description: string;
  amount?: number | null;
  amount_unit?: string | null;
  frequency?: string | null;
  conditions?: string | null;
}

export interface SchemeSourceItem {
  id?: string;
  notes?: string | null;
  source?: {
    id: string;
    url: string;
    title: string;
    authority: string;
    source_type: string;
    last_checked_date?: string | null;
  };
}

export interface SchemeApplicationProcess {
  application_mode: string;
  official_application_url?: string | null;
  authority?: string | null;
  instructions?: string | null;
}

export interface Scheme {
  id: string;
  code?: string;
  slug?: string;
  name?: string;
  title?: string;
  short_description?: string;
  summary?: string;
  description?: string | null;
  government_level?: GovernmentLevel;
  level?: GovernmentLevel;
  state?: string;
  scheme_type?: string;
  administering_ministry?: string | null;
  ministry?: string;
  funding_ratio?: string | null;
  status?: string;
  published_at?: string | null;
  verificationDate?: string;
  verified?: boolean;
  categories: Array<SchemeTaxonomyItem | string>;
  beneficiaries: Array<SchemeTaxonomyItem | string>;
  benefits?: SchemeBenefitItem[];
  benefitAmount?: string;
  application_process?: SchemeApplicationProcess | null;
  officialUrl?: string;
  sources?: SchemeSourceItem[];
  eligibilityStatus?: EligibilityStatus;
  matchScore?: number;
}

export interface UserProfileSummary {
  name: string;
  age: number;
  gender: string;
  state: string;
  district?: string;
  profession: string;
  income: string;
  caste: string;
  isPwd: boolean;
}
