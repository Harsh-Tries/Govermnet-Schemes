# Software Requirements Specification (SRS)
## Indian Government Scheme & Scholarship Assistant

---

### 1. Document Control & Overview

| Document Version | Status | Author | Date |
| :--- | :--- | :--- | :--- |
| **v1.0.0 (Phase 1)** | Approved Blueprint | Lead Software Architect | September 2026 |

---

### 2. Project Overview & Problem Statement

#### 2.1 Project Overview
The **Indian Government Scheme & Scholarship Assistant** is a digital platform designed to bridge the awareness and accessibility gap between eligible Indian citizens and government welfare schemes/scholarships. The platform utilizes a **deterministic eligibility evaluation engine** paired with a grounded **Retrieval-Augmented Generation (RAG) AI assistant** to deliver transparent, verified, and personalized scheme recommendations.

#### 2.2 Problem Statement
India operates over 3,000 active Central and State government welfare schemes with billions of rupees allocated annually. Despite this investment, millions of intended beneficiaries fail to access benefits due to:
1. **Navigational Complexity**: Information is dispersed across fragmented portals, requiring specialized knowledge to find relevant programs.
2. **Opaque Criteria**: Complex multi-variable eligibility rules (income thresholds, land limits, caste categories, academic scores) leave citizens unsure of whether they qualify.
3. **Information Asymmetry & Scams**: Citizens frequently fall victim to unofficial agents charging illegal fees or relying on outdated third-party blog posts.
4. **Lack of Guidance**: Citizens often do not know which supporting documents (e.g., Income Certificate, Domicile, Caste Certificate) are required before applying.

---

### 3. Project Objectives

1. **Deterministic Accuracy**: Ensure 100% rule compliance in eligibility evaluation. The system must never use AI to guess or hallucinate scheme eligibility.
2. **Single-Window Discovery**: Provide a unified catalog of Central and State schemes categorized by beneficiary group, profession, location, and socio-economic attributes.
3. **Actionable Transparency**: Clearly articulate *why* a user qualifies or *what specific criteria* are missing.
4. **Verified Application Guidance**: Direct users exclusively to official government application portals (`.gov.in` / `.nic.in`) and display verified document requirements.
5. **Inclusivity & Accessibility**: Design for low-tech literacy, mobile devices, and future multi-lingual execution.

---

### 4. Target Users & User Roles

#### 4.1 Target User Groups
- **Students & Academic Aspirants** (Scholarships, fee waivers, skill training, laptop schemes)
- **Farmers & Agricultural Workers** (Subsidies, crop insurance, PM-KISAN, equipment aid)
- **Entrepreneurs & MSMEs** (Credit guarantees, mudra loans, startup seed funds)
- **Job Seekers & Rural Youth** (Apprenticeships, skill development stipends)
- **Senior Citizens** (Old age pensions, healthcare coverage, travel concessions)
- **Women & Self-Help Group (SHG) Members** (Maternity benefits, housing schemes, enterprise loans)
- **Persons with Disabilities (PwD)** (Disability pensions, assistive device aid, reservation quotas)
- **Artisans & Traditional Craftsmen** (Toolkits, credit support, marketing aid)

#### 4.2 System User Roles
- **Citizen / Public User (Unauthenticated)**: Browse taxonomy, search schemes manually, perform guest eligibility checks.
- **Registered Citizen (Authenticated)**: Save socio-economic profile, store bookmarked schemes, track required document readiness.
- **Government Data Auditor / Verifier (Admin)**: Review, verify, edit, and publish scheme data scraped or ingested from official sources.
- **System Administrator**: Manage user roles, system health, vector index updates, and audit logs.

---

### 5. Requirements Scope: MVP vs. Future Scope

```
┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
│            MVP Scope (Phases 1-3)             │            Future Scope (Phases 4-6)          │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ • Deterministic Eligibility Engine            │ • Multi-lingual support (12+ Indian languages)│
│ • Single-profile user matching                │ • Direct API integrations (UMANG / DigiLocker)│
│ • Extensible scheme taxonomy & filtering       │ • Automated web scraping & source change alert│
│ • Verified scheme database & search           │ • WhatsApp & SMS conversational assistant     │
│ • Grounded RAG AI Q&A (verified sources only) │ • Common Service Center (CSC) operator mode   │
│ • Basic Admin Verification Dashboard          │ • Offline PWA support for low-connectivity    │
└───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

### 6. Functional Requirements Overview

*(Detailed specifications available in `docs/requirements/functional-requirements.md`)*

1. **User Profile Management**: Capture demographics, location, income, profession, education, and special conditions.
2. **Deterministic Rules Evaluation**: Evaluate multi-attribute profiles against JSON-based eligibility logic.
3. **Scheme Discovery & Filtering**: Search by keyword, state, category, beneficiary type, and funding level.
4. **Scheme Detail & Document Checklists**: Present verified summary, benefits breakdown, required document list, and official application URL.
5. **Grounded AI Assistance (RAG)**: Conversational explanation anchored strictly in official policy documents with inline source citations.
6. **Admin Verification Pipeline**: Multi-stage verification (Draft → Pending Review → Verified → Published).

---

### 7. Non-Functional Requirements

#### 7.1 Performance & Scalability
- **Eligibility Engine Latency**: Deterministic rule evaluation for a complete profile against 1,000+ schemes must complete in `< 150ms`.
- **API Response Time**: Non-AI REST endpoints must return data in `< 300ms` (p95).
- **AI Latency**: RAG response generation must stream initial tokens within `< 1.5 seconds`.

#### 7.2 Security Requirements
- **Authentication**: JWT-based session management with secure HTTPS-only HttpOnly cookies.
- **Data Encryption**: AES-256 encryption for user profile PII at rest; TLS 1.3 in transit.
- **No Hardcoded Secrets**: Secrets injected strictly via environment variables.

#### 7.3 Privacy Requirements
- **DPDP Act Compliance**: Explicit user consent prior to collecting socio-economic profile attributes.
- **Right to Erasure**: Users can permanently delete their account and profile data at any time.
- **Third-Party AI Isolation**: User PII is scrubbed before passing context to external LLM providers.

#### 7.4 Data Reliability & Integrity
- **Source Verification Requirement**: No scheme shall be displayed as "Verified" without an active `.gov.in` / `.nic.in` reference URL and timestamped auditor sign-off.
- **Zero Fabrication Policy**: Synthetic scheme data is prohibited in production databases.

---

### 8. System Constraints & Assumptions

#### 8.1 Constraints
- **Legal Non-Intermediary Status**: The system provides discovery and guidance only; it does not process government applications or issue funds directly.
- **State-Specific Terminology**: Scheme rules must accommodate varying state-level terminology (e.g., revenue districts, caste classifications).

#### 8.2 Assumptions
- Citizens possess basic smartphone/web connectivity or are assisted by family/CSC operators.
- Official government application portals remain accessible via standard HTTPS web protocols.
