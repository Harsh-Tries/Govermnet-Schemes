# Eligibility Parameter Model
## Indian Government Scheme & Scholarship Assistant

This document defines the canonical parameter dictionary used by the **Deterministic Rules Engine** to evaluate citizen eligibility.

> **Design Principle**: Not every scheme requires every parameter. The system supports scheme-specific parameter subsetting while maintaining a unified schema.

---

### 1. Demographics

| Parameter Name | Data Type | Allowed Values / Range | Required | Sensitive | Example | Relevance to Eligibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `age` | Integer | 0 to 120 | Yes | No | `20` | Determines minimum/maximum age thresholds for scholarships, pensions, and youth training. |
| `gender` | Enum | `MALE`, `FEMALE`, `TRANSGENDER`, `ALL` | Yes | No | `FEMALE` | Filters schemes restricted to women, girls, or transgender individuals. |
| `marital_status` | Enum | `SINGLE`, `MARRIED`, `WIDOWED`, `DIVORCED`, `SEPARATED` | No | No | `SINGLE` | Evaluates eligibility for widow pensions, maternity aid, or family schemes. |

---

### 2. Location

| Parameter Name | Data Type | Allowed Values / Range | Required | Sensitive | Example | Relevance to Eligibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `state_code` | String (ISO) | Valid Indian State/UT Codes (e.g., `IN-MP`, `IN-MH`, `IN-TN`) | Yes | No | `IN-MP` | Differentiates State-sponsored schemes from Central sector schemes. |
| `district_name` | String | Standardized District Names | Yes | No | `Bhopal` | Evaluates district-specific aspirational district or regional development aid. |
| `residency_area` | Enum | `URBAN`, `RURAL`, `SEMI_URBAN` | Yes | No | `RURAL` | Evaluates rural development schemes (e.g., PMAY-Gramin vs PMAY-Urban). |
| `is_domicile` | Boolean | `true`, `false` | Yes | No | `true` | Validates state domicile criteria for state scholarships and reservation quotas. |

---

### 3. Socioeconomic

| Parameter Name | Data Type | Allowed Values / Range | Required | Sensitive | Example | Relevance to Eligibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `annual_family_income` | Float | `>= 0.0` (in INR) | Yes | Yes | `220000.0` | Primary threshold for income-capped welfare schemes (e.g., `< ₹2,50,000`). |
| `family_size` | Integer | `>= 1` | No | No | `4` | Evaluates per-capita income or household aid ceilings. |
| `caste_category` | Enum | `GENERAL`, `OBC`, `SC`, `ST`, `EWS` | Yes | Yes | `OBC` | Key parameter for affirmative action scholarships, quotas, and grants. |
| `is_bpl` | Boolean | `true`, `false` | No | Yes | `false` | Determines eligibility for Below Poverty Line targeted benefits (ration, pensions). |
| `minority_community` | Enum | `NONE`, `MUSLIM`, `CHRISTIAN`, `SIKH`, `BUDDHIST`, `JAIN`, `PARSI` | No | Yes | `NONE` | Evaluates dedicated Ministry of Minority Affairs scholarships. |

---

### 4. Professional & Occupational

| Parameter Name | Data Type | Allowed Values / Range | Required | Sensitive | Example | Relevance to Eligibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `occupation_type` | Enum | `STUDENT`, `FARMER`, `ENTREPRENEUR`, `JOB_SEEKER`, `SENIOR_CITIZEN`, `WORKER`, `ARTISAN`, `UNEMPLOYED`, `OTHER` | Yes | No | `STUDENT` | Primary taxonomy router for beneficiary-specific schemes. |
| `employment_status` | Enum | `EMPLOYED_GOVT`, `EMPLOYED_PRIVATE`, `SELF_EMPLOYED`, `UNEMPLOYED`, `INFORMAL_WORKER` | No | No | `UNEMPLOYED` | Filters unemployment allowances or informal sector worker insurance. |
| `industry_sector` | Enum | `AGRICULTURE`, `TEXTILES`, `IT_ITES`, `FOOD_PROCESSING`, `HANDICRAFTS`, `SERVICES`, `MANUFACTURING`, `OTHER` | No | No | `AGRICULTURE` | Directs users to sector-specific MSME subsidies or trade grants. |
| `is_shg_member` | Boolean | `true`, `false` | No | No | `false` | Evaluates Self-Help Group micro-finance revolving funds. |

---

### 5. Education & Academics

| Parameter Name | Data Type | Allowed Values / Range | Required | Sensitive | Example | Relevance to Eligibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `education_level` | Enum | `BELOW_10TH`, `10TH_PASS`, `12TH_PASS`, `DIPLOMA`, `UNDERGRADUATE`, `POSTGRADUATE`, `DOCTORAL` | Required if Student | No | `UNDERGRADUATE` | Baseline criterion for merit and post-matric scholarships. |
| `current_course` | String | e.g., `B.Tech`, `B.Sc`, `MBBS`, `ITI`, `Polytechnic` | No | No | `B.Tech` | Filters discipline-specific aid (e.g., technical vs medical scholarships). |
| `academic_marks_pct` | Float | `0.0` to `100.0` | No | No | `82.5` | Evaluates merit-based scholarship eligibility thresholds (e.g., `>= 80%`). |
| `institution_type` | Enum | `GOVERNMENT`, `GOVT_AIDED`, `PRIVATE_RECOGNIZED`, `FOREIGN` | No | No | `GOVERNMENT` | Evaluates public institution tuition fee reimbursement schemes. |

---

### 6. Special Conditions & Landholding

| Parameter Name | Data Type | Allowed Values / Range | Required | Sensitive | Example | Relevance to Eligibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `is_pwd` | Boolean | `true`, `false` | Yes | Yes | `false` | Triggers disability aid, assistive equipment, and dedicated quotas. |
| `disability_percentage`| Float | `0.0` to `100.0` | Required if `is_pwd` | Yes | `60.0` | Evaluates minimum disability threshold criteria (e.g., `>= 40%`). |
| `disability_type` | Enum | `LOCOMOTOR`, `VISUAL`, `HEARING`, `SPEECH`, `INTELLECTUAL`, `MULTIPLE`, `OTHER` | Required if `is_pwd` | Yes | `LOCOMOTOR` | Directs users to specialized assistive device grants under ADIP. |
| `landholding_acres` | Float | `>= 0.0` | Required if Farmer | No | `1.5` | Crucial criterion for PM-KISAN (small/marginal farmer <= 2 hectares). |
| `is_owner_cultivator` | Boolean | `true`, `false` | Required if Farmer | No | `true` | Distinguishes land-owning farmers from tenant farmers or agricultural labor. |

---

### 7. Scheme-Specific Parameter Extension Pattern

Scheme evaluation rules store custom dynamic parameters in JSON format:

```json
{
  "scheme_id": "SCHEME-MP-OBC-2026",
  "rules": [
    { "field": "age", "operator": ">=", "value": 18 },
    { "field": "state_code", "operator": "==", "value": "IN-MP" },
    { "field": "caste_category", "operator": "in", "value": ["OBC"] },
    { "field": "annual_family_income", "operator": "<=", "value": 250000 },
    { "field": "custom_attributes.first_generation_learner", "operator": "==", "value": true }
  ]
}
```
