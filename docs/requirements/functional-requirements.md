# Functional Requirements
## Indian Government Scheme & Scholarship Assistant

This document specifies the functional requirements for the platform, assigned unique IDs (`FR-001` through `FR-035`).

---

### Module 1: Registration & Authentication

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-001** | Guest Access | The system shall allow unauthenticated users to perform keyword scheme searches, browse taxonomy, and test manual eligibility evaluation without creating an account. | High (MVP) |
| **FR-002** | User Registration | The system shall support user account creation using phone number / OTP authentication or email/password. | High (MVP) |
| **FR-003** | Secure Login | The system shall authenticate registered users and issue encrypted HttpOnly JWT tokens for session management. | High (MVP) |
| **FR-004** | Password Reset | The system shall provide secure password reset / OTP verification functionality. | Medium (MVP) |

---

### Module 2: User Profile Management

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-005** | Demographic Profile | The system shall store user age, gender, marital status, and category (General, OBC, SC, ST, EWS). | High (MVP) |
| **FR-006** | Geographic Profile | The system shall record user state, district, urban/rural residency, and pin code. | High (MVP) |
| **FR-007** | Socio-Economic Attributes | The system shall capture annual family income, family size, landholding size (acres/hectares), and BPL status. | High (MVP) |
| **FR-008** | Professional Profile | The system shall record occupation (Student, Farmer, Entrepreneur, Job Seeker, Worker, Senior Citizen, Unemployed) and sector details. | High (MVP) |
| **FR-009** | Special Attributes | The system shall store student qualification details, disability status (UDID, percentage), and farmer land ownership type. | High (MVP) |
| **FR-010** | Profile Editing | The system shall allow users to update their profile parameters at any time and immediately trigger re-evaluation of saved schemes. | High (MVP) |

---

### Module 3: Scheme Search & Filtering

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-011** | Keyword Search | The system shall support full-text keyword search across scheme titles, descriptions, and keywords. | High (MVP) |
| **FR-012** | State / Geography Filter | The system shall allow filtering schemes by Central/National scope vs specific State or District scope. | High (MVP) |
| **FR-013** | Category & Sector Filter | The system shall enable multi-category filtering (e.g., Education, Agriculture, Healthcare, Housing, Financial Aid). | High (MVP) |
| **FR-014** | Beneficiary Type Filter | The system shall filter schemes by target beneficiary groups (Student, Woman, Farmer, Senior Citizen, PwD, MSME). | High (MVP) |
| **FR-015** | Combined Multi-Filter | The system shall execute instantaneous faceted search combining state, category, income cap, and beneficiary group. | High (MVP) |

---

### Module 4: Eligibility Analysis & Engine

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-016** | Deterministic Evaluation | The system shall execute rule-based evaluation comparing profile attributes against structured scheme JSON logic without LLM reliance. | High (MVP) |
| **FR-017** | Match Result Grading | The system shall classify schemes into "Fully Eligible", "Partially Eligible", and "Ineligible" with exact rule match indicators. | High (MVP) |
| **FR-018** | Missing Attribute Identification | The system shall explicitly identify missing profile attributes required by a scheme and prompt the user to provide them. | High (MVP) |
| **FR-019** | Eligibility Breakdown | The system shall display an itemized rule evaluation matrix explaining why a user qualifies or fails each condition. | High (MVP) |

---

### Module 5: Scheme Details & Document Guidance

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-020** | Verified Scheme Overview | The system shall display verified scheme summary, funding source (Central/State ratio), and administering ministry. | High (MVP) |
| **FR-021** | Benefits Specification | The system shall render detailed financial grant amounts, subsidy percentages, or non-monetary assistance breakdowns. | High (MVP) |
| **FR-022** | Document Checklist | The system shall list required supporting documents (Aadhaar, Income Cert, Caste Cert, Land Records) with issuing authority guidance. | High (MVP) |
| **FR-023** | Official Application Guidance | The system shall outline step-by-step application procedures (Online portal steps vs offline office submission). | High (MVP) |
| **FR-024** | Verified External Link Navigation | The system shall provide direct outbound links to authoritative `.gov.in` / `.nic.in` web portals with security warnings. | High (MVP) |

---

### Module 6: User Workspace & Feedback

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-025** | Bookmark / Save Scheme | The system shall allow logged-in users to save schemes to a personal shortlist. | High (MVP) |
| **FR-026** | Saved Scheme Notes | The system shall allow users to attach application progress notes (e.g., "Income cert applied at Tehsil on Sept 10"). | Medium (MVP) |
| **FR-027** | Report Outdated Information | The system shall provide a feedback form for users to flag broken links, outdated income caps, or incorrect details. | High (MVP) |

---

### Module 7: Admin Verification & Data Governance

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-028** | Scheme Data Ingestion | The system shall allow admins to create and edit scheme records, eligibility JSON rules, and document requirements. | High (MVP) |
| **FR-029** | Verification State Workflow | The system shall enforce state transitions for schemes: `Draft` → `Pending Verification` → `Verified` → `Published`. | High (MVP) |
| **FR-030** | Source Metadata Tagging | The system shall enforce mandatory tagging of verified source URL, official notification number, and auditor ID before publication. | High (MVP) |
| **FR-031** | Verification Expiry & Review | The system shall flag scheme records for mandatory re-verification every 180 days or upon budget cycle updates. | Medium (Phase 4) |
| **FR-032** | Audit Logging | The system shall log all scheme modifications, rule changes, and publisher actions with timestamps. | High (MVP) |

---

### Module 8: Grounded AI Assistant (RAG Integration - Phase 3)

| ID | Title | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-033** | Conversational Scheme Q&A | The system shall allow users to ask natural-language questions regarding scheme guidelines. | Medium (Phase 3) |
| **FR-034** | Strict Grounding | The AI assistant shall synthesize answers strictly from retrieved verified government policy chunks, prohibiting ungrounded answers. | High (Phase 3) |
| **FR-035** | Inline Source Citations | Every AI response sentence must link directly to the specific verified document section and official `.gov.in` URL. | High (Phase 3) |
