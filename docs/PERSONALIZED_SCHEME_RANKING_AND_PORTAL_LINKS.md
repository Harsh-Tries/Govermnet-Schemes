# Personalized Scheme Ranking, Verified Official Portals, and Dashboard Integration

## Executive Summary
This document records the architectural improvements, deterministic ranking rules, official government portal verification service, and automated test suite implemented for the Maharashtra Government Schemes and Scholarships Finder.

The implementation directly fulfills the dual objectives:
1. **Working, Verified Official Application Links**: Adding safe, authenticated external portal links to scheme cards that open in a new tab with security attributes (`rel="noopener noreferrer" target="_blank"`), differentiating direct application pages (e.g., MahaDBT 2.0, PM-KISAN) from informational/departmental portals.
2. **Deterministic Personalized Ranking**: Ranking schemes according to the authenticated citizen's profile, prioritizing relevant **farmer schemes** (Namo Shetkari, PM-KISAN, MahaDBT Krishi Mechanization) and **OBC student scholarships** (Tuition Fees and Examination Fees to OBC Students, Dr. Panjabrao Deshmukh Vasatgruh Nirvah Bhatta) for a Maharashtra resident with annual family income of **₹2,20,000**.

---

## 1. Files Created and Modified

| File Path | Type | Description |
|-----------|------|-------------|
| `backend/app/services/portal/portal_verifier.py` | New Service | Verifies official government portal URLs, sanitizes against malicious schemes (`javascript:`, `data:`, `vbscript:`, `file:`), identifies portal names (MahaDBT 2.0, PM-KISAN, Krishi Maharashtra, DTE, Aaple Sarkar, CMEGP, etc.), and differentiates direct application forms from informational portals. |
| `backend/app/services/personalization/ranking_service.py` | New Service | Implements the deterministic 7-tier ranking algorithm with dynamic scores (0–100, no hardcoded scores), transparent explanation factors, and missing information review notes. |
| `backend/app/services/personalization/recommendation_engine.py` | Updated Service | Integrates `SchemeRankingService` into the two-stage candidate retrieval and ranking pipeline. |
| `backend/app/db/seed_obc_and_portals.py` | New DB Script | Seeds the official "Tuition Fees and Examination Fees to OBC Students" scheme (MahaDBT 2.0, ₹8,00,000 cap), adds explicit caste category restrictions to the Rajarshi Shahu EBC scheme, and verifies all 27 genuine schemes. |
| `backend/app/api/v1/endpoints/profile.py` | Updated API | Exposes `GET /api/v1/profile/ranking` with authenticated profile summary bullets (`Maharashtra resident`, `Farmer`, `Student`, `OBC category`, `Annual family income: ₹220,000`) and deterministic ranked schemes. Enforces server-side JWT authentication and strict IDOR protection. |
| `frontend/src/services/schemesApi.ts` | Updated Client | Added client-side URL sanitization (`isSafeGovUrl`) and portal metadata extractor (`getVerifiedPortalInfo`). |
| `frontend/src/services/profileApi.ts` | Updated Client | Added `fetchRankedDashboard` API call and `RankedDashboardResponse` TypeScript interface. |
| `frontend/src/components/dashboard/SchemeCard.tsx` | Updated UI | Renders safe "Apply Portal" button with external link indicator, verified portal badges, match factors, review notes, and status badges (`ELIGIBLE`, `Criteria Review Needed`, `NOT_ELIGIBLE`). |
| `frontend/src/app/page.tsx` | Updated UI | Added "Recommended for Your Profile" priority section displaying confirmed citizen attributes and top-ranked scheme cards above the general catalog. |
| `tests/test_personalized_ranking_and_portals.py` | New Test Suite | 10 comprehensive tests covering farmer prioritization, OBC student prioritization, combo profiles, portal URL safety, IDOR protection, and absence of hardcoded match scores. |

---

## 2. Verified Official Government Portals & Security Handling

### 2.1 Domain Whitelist & URL Sanitization
All application URLs are validated through `PortalVerifier` before presentation:
- **Prohibited Protocols**: Any URL starting with `javascript:`, `data:`, `vbscript:`, or `file:` is strictly rejected to prevent Cross-Site Scripting (XSS) and injection attacks.
- **Allowed Government Suffixes**: Domains must belong to authorized government infrastructure:
  * `.gov.in`
  * `.nic.in`
  * `.maharashtra.gov.in`
  * `.mahaonline.gov.in`
  * `.ac.in` (authorized state universities)
  * `.org.in` (authorized statutory boards)

### 2.2 Portal Mapping & Direct Application Designation
| Scheme Name | Official Destination URL | Identified Portal | Direct Application? | Action Label |
|-------------|-------------------------|-------------------|---------------------|--------------|
| Tuition Fees and Examination Fees to OBC Students | `https://mahadbt2.maharashtra.gov.in/` | MahaDBT 2.0 Portal | Yes | Apply on MahaDBT 2.0 |
| Dr. Panjabrao Deshmukh Vasatgruh Nirvah Bhatta | `https://mahadbt2.maharashtra.gov.in/` | MahaDBT 2.0 Portal | Yes | Apply on MahaDBT 2.0 |
| Namo Shetkari Mahasanman Nidhi (NSMNY) | `https://krishi.maharashtra.gov.in/` | Krishi Maharashtra (State Dept) | Yes | Apply on Krishi Portal |
| PM-KISAN (Maharashtra Beneficiaries) | `https://pmkisan.gov.in/` | PM-KISAN Central Portal | Yes | Apply on PM-KISAN |
| MahaDBT Krishi Yantrikikaran Yojna | `https://mahadbt2.maharashtra.gov.in/` | MahaDBT Farmer Portal | Yes | Apply on MahaDBT |
| PM Fasal Bima Yojana (₹1 Token Insurance) | `https://pmfby.gov.in/` | PMFBY National Crop Insurance | Yes | Apply on PMFBY |
| Chief Minister Employment Generation (CMEGP) | `https://maha-cmegp.gov.in/` | CMEGP Maharashtra Portal | Yes | Apply on CMEGP |
| Mahatma Jyotirao Phule Jan Arogya Yojana | `https://www.jeevandayee.gov.in/` | Jeevandayee Arogya Portal | No (Empaneled Hospital Enrollment) | View Official Details |
| Directorate of Technical Education Schemes | `https://dte.maharashtra.gov.in/` | DTE Maharashtra | No (Informational & Guidelines) | View Official Guidelines |

---

## 3. Deterministic Ranking & Scoring Rules

### 3.1 7-Tier Order of Importance
1. **Active Published Boundary**: Only schemes in `PUBLISHED` status are evaluated.
2. **Mandatory Criteria Satisfaction**: Evaluates residency, age limits, gender, caste, and income ceilings.
3. **Specific Beneficiary Group Matching**: Prioritizes schemes explicitly matching the citizen's caste/social category (e.g., OBC, VJNT, SBC) and occupation (e.g., Farmer, Student).
4. **Income Ceiling Adherence**: Evaluates family income thresholds dynamically:
   * **₹1,50,000 threshold**: For Post-Matric OBC full maintenance allowance. A citizen with ₹2,20,000 is marked `NOT_ELIGIBLE` and directed to the Tuition Fee scheme.
   * **₹8,00,000 threshold**: Non-Creamy Layer limit for 50% OBC Tuition & Exam Fee reimbursement and Dr. Panjabrao Deshmukh scheme for farmer wards.
5. **Criteria Review Requirements (`CHECK_REQUIRED`)**: Flags schemes that require institutional admission confirmation or revenue land record verification (7/12 extract, CAP allotment letter, Alpabhudharak certificate).
6. **Verified Destination Availability**: Schemes with verified direct government portals receive higher ranking weights.
7. **Profile Affinities**:
   * **Farmer Persona**: Flagship State DBT (Namo Shetkari) and Central DBT (PM-KISAN) are prioritized at ranks #1 and #2.
   * **OBC Student Persona**: Tuition Fees to OBC Students is prioritized at rank #1.
   * **Combo Persona (Farmer + OBC Student)**: Tuition Fees to OBC Students, Namo Shetkari, and Dr. Panjabrao Deshmukh occupy the top 3 recommendations.

### 3.2 Dynamic Scoring Weights (No Hardcoded Scores)
- **Base Score**:
  * `ELIGIBLE`: 50 points
  * `CHECK_REQUIRED`: 45 points
  * `NOT_ELIGIBLE`: 0 points
- **Profile Affinity Boost**:
  * Farmer Flagship DBT (Namo Shetkari): +38 points
  * Central Farmer DBT (PM-KISAN): +32 points
  * Agricultural Mechanization: +28 points
  * Farm Pond / Crop Insurance: +25 points
  * OBC Tuition & Exam Fee Assistance: +38 points
  * Dr. Panjabrao Deshmukh (Hostel for Farmer Ward in Higher Ed): +36 points
  * Generic Universal Schemes (no occupation/caste targeted affinity): +10 points
- **Category Match Boost**:
  * Explicit OBC scheme for OBC citizen: +10 points
- **Jurisdiction Boost**:
  * Maharashtra State Government Scheme: +5 points
- **Portal Verification Boost**:
  * Verified Direct Application Portal: +5 points
  * Verified Informational/Departmental Portal: +3 points

---

## 4. Specific Eligibility Edge Cases Handled

1. **Rajarshi Chhatrapati Shahu Maharaj EBC Scheme vs. OBC Students**:
   * EBC is strictly for Open / General / EWS students.
   * An OBC student with family income ₹2,20,000 is marked `NOT_ELIGIBLE` for EBC with the explainable note: *"Reserved for Open / General / EWS category students. As an OBC student, apply under the OBC Tuition & Exam Fee scheme on MahaDBT."*
2. **Post-Matric OBC Scholarship vs. Tuition Fee Reimbursement**:
   * Full living maintenance allowance under Post-Matric OBC has a strict ₹1,50,000 family income ceiling.
   * A student with ₹2,20,000 income fails this threshold and is marked `NOT_ELIGIBLE` with the note: *"Annual income of ₹220,000 exceeds the ₹1,50,000 threshold for full maintenance allowance. Eligible for 50% Tuition Fee Reimbursement scheme instead."*
3. **Dr. Panjabrao Deshmukh Vasatgruh Nirvah Bhatta Yojna**:
   * General non-farmer students have a ₹1,00,000 income limit.
   * Wards of marginal/small farmers (Alpabhudharak Shetkari) have an ₹8,00,000 limit.
   * With ₹2,20,000 income and a farming household background, the scheme is marked `CHECK_REQUIRED` with review notes:
     * *"CAP admission allotment letter and Tahsildar Alpabhudharak (marginal farmer) certificate required."*
     * *"Hostel admission receipt or rented room agreement required."*
4. **Namo Shetkari Mahasanman Nidhi Yojana (NSMNY)**:
   * Marked `CHECK_REQUIRED` with review notes:
     * *"Active approved PM-KISAN beneficiary registration in Maharashtra required."*
     * *"Cultivable land record (7/12 & 8-A extract) verification required."*

---

## 5. Automated Test Results

The dedicated test suite `tests/test_personalized_ranking_and_portals.py` verified all 10 specifications:

```
tests/test_personalized_ranking_and_portals.py::test_maharashtra_farmer_income_220k PASSED [ 10%]
tests/test_personalized_ranking_and_portals.py::test_obc_student_income_220k PASSED [ 20%]
tests/test_personalized_ranking_and_portals.py::test_citizen_both_farmer_and_obc_student PASSED [ 30%]
tests/test_personalized_ranking_and_portals.py::test_missing_course_details_reports_review_needed PASSED [ 40%]
tests/test_personalized_ranking_and_portals.py::test_matching_income_mismatched_category_not_eligible PASSED [ 50%]
tests/test_personalized_ranking_and_portals.py::test_unverified_application_url_handling PASSED [ 60%]
tests/test_personalized_ranking_and_portals.py::test_prevention_of_unsafe_external_urls PASSED [ 70%]
tests/test_personalized_ranking_and_portals.py::test_correct_apply_portal_destinations PASSED [ 80%]
tests/test_personalized_ranking_and_portals.py::test_no_hardcoded_match_scores PASSED [ 90%]
tests/test_personalized_ranking_and_portals.py::test_profile_ranking_endpoint_and_idor_protection PASSED [100%]
```

Full regression suite execution (`pytest`):
- `tests/test_citizen_onboarding.py`: 4 passed
- `tests/test_phase6_production_repair.py`: 7 passed
- `tests/test_featured_schemes_finder.py`: 7 passed
- `tests/test_personalized_ranking_and_portals.py`: 10 passed
- **Total: 28 passed, 0 failed.**

TypeScript check:
- `cd frontend; npx tsc --noEmit`: 0 errors.
