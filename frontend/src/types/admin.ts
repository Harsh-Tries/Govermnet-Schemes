export type SchemeStatus = 
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'SOURCE_VERIFIED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REVERIFICATION_REQUIRED'
  | 'ARCHIVED';

export type GovernmentLevel = 'CENTRAL' | 'STATE' | 'OTHER';
export type SchemeType = 'SCHOLARSHIP' | 'SUBSIDY' | 'GRANT' | 'LOAN' | 'PENSION' | 'INSURANCE' | 'TRAINING' | 'SERVICE' | 'OTHER';

export interface AdminCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface AdminBeneficiary {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface AdminSource {
  id: string;
  url: string;
  source_type: string;
  authority: string;
  title: string;
}

export interface AdminBenefit {
  id: string;
  benefit_type: string;
  title: string;
  description: string;
  amount?: number;
  amount_unit?: string;
}

export interface AdminRule {
  id: string;
  parameter_name: string;
  operator: string;
  comparison_value: any;
  is_mandatory: boolean;
  failure_message?: string;
}

export interface AdminRuleGroup {
  id: string;
  scheme_id: string;
  logical_operator: string;
  rules: AdminRule[];
}

export interface AdminScheme {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description?: string;
  government_level: GovernmentLevel;
  scheme_type: SchemeType;
  status: SchemeStatus;
  administering_ministry?: string;
  funding_ratio?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  categories: AdminCategory[];
  beneficiaries: AdminBeneficiary[];
  benefits: AdminBenefit[];
  sources: { id: string; source: AdminSource }[];
}
