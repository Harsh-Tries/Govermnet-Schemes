# Government Scheme Taxonomy
## Indian Government Scheme & Scholarship Assistant

This document specifies the multi-dimensional, extensible classification taxonomy used to categorize, index, and retrieve government schemes and scholarships.

---

### 1. Multi-Dimensional Taxonomy Design

A single scheme can belong to multiple categories across different dimensions:

```
                          ┌───────────────────────────┐
                          │   Government Level        │
                          │ (Central / State / Local) │
                          └─────────────┬─────────────┘
                                        │
┌───────────────────────────┐           ▼           ┌───────────────────────────┐
│     Beneficiary Type      │◄────── SCHEME ───────►│    Functional Category    │
│ (Student/Farmer/Woman...) │           │           │ (Scholarship/Housing...)  │
└───────────────────────────┘           ▼           └───────────────────────────┘
                          ┌───────────────────────────┐
                          │   Geographic Scope        │
                          │ (National / State / Dist) │
                          └───────────────────────────┘
```

---

### 2. Dimension 1: Government Level

1. **Central Government** (`CENTRAL`)
   - Administered directly by Union Ministries (e.g., Ministry of Agriculture, Ministry of Social Justice, Ministry of Education).
   - 100% Union funded or Central Sector Schemes.
2. **State Government** (`STATE`)
   - Administered by State Government Departments (e.g., Department of Higher Education, Maharashtra; Social Welfare Department, Tamil Nadu).
3. **Centrally Sponsored** (`CENTRALLY_SPONSORED`)
   - Jointly funded by Union and State Governments (e.g., 60:40 or 90:10 ratio).
4. **Local / Municipal** (`LOCAL`)
   - Administered by Panchayati Raj Institutions (PRIs) or Urban Local Bodies (ULBs).

---

### 3. Dimension 2: Beneficiary Types

A scheme may target one or more beneficiary groups:

- `STUDENT`: Primary, secondary, higher education, and research scholars.
- `FARMER`: Small, marginal, tenant, and large agricultural landowners.
- `ENTREPRENEUR`: MSMEs, startups, cottage industries, micro-enterprises.
- `JOB_SEEKER`: Unemployed youth, apprentices, skill trainees.
- `SENIOR_CITIZEN`: Elderly individuals aged 60 and above.
- `WOMAN`: Girls, adult women, pregnant/lactating mothers, widows, SHG members.
- `PERSON_WITH_DISABILITY`: Individuals with recognized disabilities (>= 40% UDID).
- `WORKER_ARTISAN`: Unorganized sector workers, street vendors, traditional craftsmen (Vishwakarmas).
- `WEAKER_SECTION`: SC, ST, OBC, EWS, BPL, minority communities.

---

### 4. Dimension 3: Functional Scheme Categories

Schemes are organized into primary functional domain categories:

| Category Code | Category Name | Description & Sub-Categories |
| :--- | :--- | :--- |
| `SCHOLARSHIP` | Scholarships & Fellowships | Post-matric, pre-matric, merit-cum-means, overseas study fellowships. |
| `EDUCATION` | Education & Skill Development | Free coaching, laptops/tablets, hostel fee waiver, PMKVY skill courses. |
| `AGRICULTURE` | Agriculture & Rural Aid | PM-KISAN, crop insurance, fertilizer subsidy, drip irrigation, solar pumps. |
| `EMPLOYMENT` | Employment & Livelihood | MGNREGA, apprenticeship stipends, urban employment guarantees. |
| `ENTREPRENEURSHIP`| Business & Micro-Finance | MUDRA loans, PMEGP, Stand-Up India, collateral-free credit guarantees. |
| `HOUSING` | Housing & Urban Infrastructure | Pradhan Mantri Awas Yojana (PMAY Urban/Gramin), home loan subsidies. |
| `HEALTHCARE` | Healthcare & Insurance | Ayushman Bharat (PM-JAY), maternity health aid, disability appliances. |
| `SOCIAL_SECURITY` | Pensions & Social Welfare | Old age pensions, widow pensions, disability pensions, provident funds. |
| `FINANCIAL_AID` | Direct Benefit Transfer (DBT) | Cash transfers, emergency relief funds, marriage assistance grants. |

---

### 5. Dimension 4: Geographic Scope

- **National / Pan-India** (`NATIONAL`): Available across all States and Union Territories.
- **State-Specific** (`STATE_BOUND`): Applicable exclusively within a specific State/UT boundary (e.g., `IN-MH`).
- **District-Specific** (`DISTRICT_BOUND`): Restricted to designated Aspirational Districts or tribal blocks.
- **Urban Only** (`URBAN_ONLY`): Applicable only within municipal corporation limits.
- **Rural Only** (`RURAL_ONLY`): Applicable only in gram panchayat jurisdictions.

---

### 6. Dimension 5: Professional / Sectoral Categories

- `AGRICULTURE_ALLIED`: Farming, horticulture, animal husbandry, fisheries, sericulture.
- `TEXTILES_HANDLOOM`: Weavers, handloom workers, garment artisans.
- `MANUFACTURING`: Food processing, electronics assembly, auto components.
- `TRADES_SERVICES`: Retail shopkeepers, street vendors, repair technicians.
- `ARTS_CRAFT`: Traditional artisans (potters, sculptors, blacksmiths, carpenters).
- `IT_DIGITAL`: Software developers, digital creators, tech startups.

---

### 7. Multi-Category Assignment Example

**Scheme**: *Pradhan Mantri Formalisation of Micro Food Processing Enterprises (PMFME)*

- **Government Level**: `CENTRALLY_SPONSORED` (60:40 Union:State ratio)
- **Beneficiary Types**: `[ENTREPRENEUR, FARMER, WOMAN, WORKER_ARTISAN]`
- **Categories**: `[ENTREPRENEURSHIP, FINANCIAL_AID, AGRICULTURE]`
- **Geographic Scope**: `NATIONAL`
- **Professional Sector**: `[AGRICULTURE_ALLIED, FOOD_PROCESSING]`
