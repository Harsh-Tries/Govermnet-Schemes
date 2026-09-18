# Data Dictionary
## Indian Government Scheme & Scholarship Assistant

This document defines the canonical conceptual data model for Phase 2 implementation. It specifies the 16 core domain entities, fields, relationships, conceptual data types, and integrity constraints.

---

### 1. Entity Overview & ER Relationships

```
┌───────────────┐        1:1        ┌──────────────────┐
│     User      ├──────────────────►│   UserProfile    │
└───────┬───────┘                   └──────────────────┘
        │
        │ 1:N                       ┌──────────────────┐
        ├──────────────────────────►│   SavedScheme    │
        │                           └────────┬─────────┘
        │ 1:N                                │ N:1
        └──────────────────────────┐         ▼
                                   │  ┌──────────────┐
┌──────────────────┐        N:M    └──►     Scheme   │
│ SchemeCategory   │◄─────────────────┤              │
└──────────────────┘                  └──────┬───────┘
                                             │ 1:N
┌──────────────────┐        N:M              ├──────────────►┌──────────────────┐
│ BeneficiaryType  │◄────────────────────────┤               │ EligibilityRule  │
└──────────────────┘                         │               └──────────────────┘
                                             ├──────────────►┌──────────────────┐
┌──────────────────┐        1:N              │               │  SchemeBenefit   │
│ OfficialSource   ├─────────────────────────┤               └──────────────────┘
└──────────────────┘                         ├──────────────►┌──────────────────┐
                                             │               │ RequiredDocument │
┌──────────────────┐        1:N              │               └──────────────────┘
│VerificationRecord├─────────────────────────┘
└──────────────────┘
```

---

### 2. Core Entities & Field Specifications

#### 2.1 `User`
- **Purpose**: Represents an authenticated system user account.
- **Fields**:
  - `id`: UUID (Primary Key, Required, Unique)
  - `phone_number`: String(15) (Unique, Nullable)
  - `email`: String(255) (Unique, Nullable)
  - `password_hash`: String(255) (Nullable)
  - `role`: Enum (`CITIZEN`, `VERIFIER`, `ADMIN`) (Default: `CITIZEN`)
  - `is_active`: Boolean (Default: `true`)
  - `created_at`: Timestamp (Auto)
  - `updated_at`: Timestamp (Auto)
- **Relationships**: 1:1 with `UserProfile`, 1:N with `SavedScheme`, 1:N with `Feedback`.

#### 2.2 `UserProfile`
- **Purpose**: Holds citizen socio-demographic parameters used by the deterministic engine.
- **Fields**:
  - `id`: UUID (PK)
  - `user_id`: UUID (FK -> `User.id`, Unique, Cascade Delete)
  - `age`: Integer (Check: `>= 0 AND <= 120`)
  - `gender`: Enum (`MALE`, `FEMALE`, `TRANSGENDER`, `OTHER`)
  - `marital_status`: Enum (`SINGLE`, `MARRIED`, `WIDOWED`, `DIVORCED`)
  - `state_code`: String(10) (FK -> `SchemeState.code`)
  - `district_name`: String(100)
  - `residency_area`: Enum (`URBAN`, `RURAL`)
  - `annual_family_income`: Numeric(12, 2) (Check: `>= 0.0`)
  - `caste_category`: Enum (`GENERAL`, `OBC`, `SC`, `ST`, `EWS`)
  - `occupation_type`: Enum (`STUDENT`, `FARMER`, `ENTREPRENEUR`, `JOB_SEEKER`, `SENIOR_CITIZEN`, `WORKER`, `ARTISAN`, `OTHER`)
  - `education_level`: Enum (`BELOW_10TH`, `10TH_PASS`, `12TH_PASS`, `DIPLOMA`, `UNDERGRADUATE`, `POSTGRADUATE`)
  - `is_pwd`: Boolean (Default: `false`)
  - `disability_percentage`: Numeric(5, 2) (Nullable)
  - `landholding_acres`: Numeric(8, 2) (Nullable)
  - `custom_attributes`: JSONB (For dynamic parameters)
  - `updated_at`: Timestamp
- **Relationships**: 1:1 with `User`.

#### 2.3 `Scheme`
- **Purpose**: Authoritative master record of a government scheme or scholarship.
- **Fields**:
  - `id`: UUID (PK)
  - `code`: String(50) (Unique, Index) (e.g., `PM-KISAN-2026`)
  - `title`: String(255) (Required)
  - `slug`: String(255) (Unique, Index)
  - `summary`: Text (Required)
  - `detailed_description`: Text
  - `government_level`: Enum (`CENTRAL`, `STATE`, `CENTRALLY_SPONSORED`, `LOCAL`)
  - `administering_ministry`: String(255) (Required)
  - `funding_ratio`: String(50) (e.g., "100% Central", "60:40")
  - `verification_status`: Enum (`DRAFT`, `PENDING_VERIFICATION`, `VERIFIED`, `ARCHIVED`)
  - `last_verified_at`: Timestamp (Nullable)
  - `is_active`: Boolean (Default: `true`)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp
- **Relationships**: N:M with `SchemeCategory`, N:M with `BeneficiaryType`, 1:N with `EligibilityRule`, 1:N with `SchemeBenefit`, 1:N with `RequiredDocument`, 1:N with `ApplicationProcess`, 1:1 with `OfficialSource`, 1:N with `VerificationRecord`.

#### 2.4 `SchemeCategory`
- **Purpose**: Extensible functional taxonomy lookup entity.
- **Fields**:
  - `id`: UUID (PK)
  - `code`: String(50) (Unique) (e.g., `SCHOLARSHIP`, `AGRICULTURE`)
  - `name`: String(100) (Required)
  - `description`: Text
- **Relationships**: N:M with `Scheme`.

#### 2.5 `BeneficiaryType`
- **Purpose**: Target group taxonomy entity.
- **Fields**:
  - `id`: UUID (PK)
  - `code`: String(50) (Unique) (e.g., `STUDENT`, `FARMER`, `WOMAN`)
  - `name`: String(100)
- **Relationships**: N:M with `Scheme`.

#### 2.6 `EligibilityRule`
- **Purpose**: Structured rule logic evaluated by the deterministic engine.
- **Fields**:
  - `id`: UUID (PK)
  - `scheme_id`: UUID (FK -> `Scheme.id`, Cascade Delete)
  - `rule_group`: Integer (Default: 1 - for AND/OR logic branching)
  - `parameter_name`: String(100) (Required) (e.g., `annual_family_income`)
  - `operator`: Enum (`EQ`, `NEQ`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `CONTAINS`)
  - `target_value`: JSONB (Required) (e.g., `250000`, `["OBC", "SC"]`)
  - `is_mandatory`: Boolean (Default: `true`)
  - `failure_message`: Text (Explanation if rule fails)
- **Relationships**: N:1 with `Scheme`.

#### 2.7 `SchemeBenefit`
- **Purpose**: Monetary or non-monetary benefit breakdown.
- **Fields**:
  - `id`: UUID (PK)
  - `scheme_id`: UUID (FK -> `Scheme.id`)
  - `benefit_type`: Enum (`DIRECT_BENEFIT_TRANSFER`, `SUBSIDY`, `FEE_WAIVER`, `LOAN_INTEREST_SUBVENTION`, `EQUIPMENT_GRANT`, `NON_MONETARY`)
  - `amount_value`: Numeric(12, 2) (Nullable)
  - `amount_unit`: String(50) (e.g., "INR/year", "Percentage")
  - `description`: Text (Required)
- **Relationships**: N:1 with `Scheme`.

#### 2.8 `RequiredDocument`
- **Purpose**: Official document requirements checklist for a scheme.
- **Fields**:
  - `id`: UUID (PK)
  - `scheme_id`: UUID (FK -> `Scheme.id`)
  - `document_name`: String(150) (Required) (e.g., "Income Certificate")
  - `issuing_authority`: String(150) (e.g., "Revenue Department / Tehsildar")
  - `is_mandatory`: Boolean (Default: `true`)
  - `validity_conditions`: Text (e.g., "Issued after April 1 of current financial year")
- **Relationships**: N:1 with `Scheme`.

#### 2.9 `ApplicationProcess`
- **Purpose**: Step-by-step guidance instructions.
- **Fields**:
  - `id`: UUID (PK)
  - `scheme_id`: UUID (FK -> `Scheme.id`)
  - `step_number`: Integer (Required)
  - `mode`: Enum (`ONLINE`, `OFFLINE`, `HYBRID`)
  - `title`: String(150)
  - `instructions`: Text (Required)
- **Relationships**: N:1 with `Scheme`.

#### 2.10 `OfficialSource`
- **Purpose**: Authoritative government URL and document reference.
- **Fields**:
  - `id`: UUID (PK)
  - `scheme_id`: UUID (FK -> `Scheme.id`, Unique)
  - `portal_name`: String(150) (e.g., "National Scholarship Portal")
  - `official_url`: String(500) (Required, Check: `url LIKE '%.gov.in%' OR url LIKE '%.nic.in%'`)
  - `gazette_notification_ref`: String(150) (Nullable)
  - `last_scraped_at`: Timestamp (Nullable)
- **Relationships**: 1:1 with `Scheme`.

#### 2.11 `SchemeState`
- **Purpose**: Lookup for Indian States & Union Territories.
- **Fields**:
  - `code`: String(10) (PK) (e.g., `IN-MP`)
  - `name`: String(100) (Required)
  - `type`: Enum (`STATE`, `UNION_TERRITORY`)

#### 2.12 `SchemeProfession`
- **Purpose**: Professional sector lookup entity.
- **Fields**:
  - `code`: String(50) (PK)
  - `name`: String(100)

#### 2.13 `VerificationRecord`
- **Purpose**: Data governance audit log for auditor sign-offs.
- **Fields**:
  - `id`: UUID (PK)
  - `scheme_id`: UUID (FK -> `Scheme.id`)
  - `verifier_id`: UUID (FK -> `User.id`)
  - `verification_action`: Enum (`APPROVED`, `REJECTED`, `CHANGES_REQUESTED`)
  - `verification_notes`: Text
  - `source_document_url`: String(500)
  - `verified_at`: Timestamp (Auto)
- **Relationships**: N:1 with `Scheme`, N:1 with `User`.

#### 2.14 `SchemeUpdate`
- **Purpose**: Change log tracking updates made to scheme rules or benefits.
- **Fields**:
  - `id`: UUID (PK)
  - `scheme_id`: UUID (FK -> `Scheme.id`)
  - `change_summary`: Text (Required)
  - `diff_payload`: JSONB (Before/After snapshot)
  - `updated_by`: UUID (FK -> `User.id`)
  - `created_at`: Timestamp

#### 2.15 `SavedScheme`
- **Purpose**: User workspace bookmarked schemes.
- **Fields**:
  - `id`: UUID (PK)
  - `user_id`: UUID (FK -> `User.id`, Cascade Delete)
  - `scheme_id`: UUID (FK -> `Scheme.id`, Cascade Delete)
  - `status`: Enum (`BOOKMARKED`, `APPLYING`, `APPLIED`, `BENEFIT_RECEIVED`)
  - `notes`: Text (Nullable)
  - `created_at`: Timestamp
- **Constraints**: Unique (`user_id`, `scheme_id`).

#### 2.16 `Feedback`
- **Purpose**: Outdated info reports submitted by citizens.
- **Fields**:
  - `id`: UUID (PK)
  - `user_id`: UUID (FK -> `User.id`, Nullable for guests)
  - `scheme_id`: UUID (FK -> `Scheme.id`)
  - `report_type`: Enum (`BROKEN_LINK`, `OUTDATED_BENEFIT`, `INCORRECT_RULE`, `OTHER`)
  - `comments`: Text (Required)
  - `status`: Enum (`PENDING_REVIEW`, `RESOLVED`, `DISMISSED`)
  - `created_at`: Timestamp
