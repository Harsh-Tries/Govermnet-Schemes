# Data Flow Specifications
## Indian Government Scheme & Scholarship Assistant

This document outlines the two primary operational data flows within the system: **User Profile Eligibility Evaluation** and **Government Scheme Verification Ingestion**.

---

### Flow 1: User Profile Eligibility Evaluation Flow

```
[ User Input Profile ]
       │
       ▼
( API Gateway Validation ) ──► [ Schema Validation Error ] ──► ( Return HTTP 422 )
       │
       ▼ ( Valid Pydantic Schema )
[ Extract User Attributes ] ( Age, State, Income, Occupation, Caste, Land, etc. )
       │
       ▼
[ Fetch Candidate Schemes ] ( Filter by State == User.State OR State == 'NATIONAL' )
       │
       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DETERMINISTIC RULES EVALUATOR                        │
│                                                                        │
│   Loop through Candidate Schemes:                                      │
│     For each Scheme:                                                   │
│       1. Fetch JSON Eligibility Rules Matrix                           │
│       2. Compare Profile Attributes against Rule Conditions            │
│       3. Track PASS / FAIL / MISSING_ATTRIBUTE states                  │
│       4. Calculate Overall Status:                                     │
│          - All Mandatory Rules PASS  ==> FULLY_ELIGIBLE                │
│          - Non-Mandatory Rule FAIL   ==> PARTIALLY_ELIGIBLE            │
│          - Mandatory Rule FAIL       ==> INELIGIBLE                    │
│          - Missing Required Param    ==> INCOMPLETE_PROFILE            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
[ Format Evaluation Response Matrix ] ( Score, Explanations, Missing Inputs )
                                    │
                                    ▼
[ Render User Eligibility Dashboard ] ( Fully Eligible Cards, Action Buttons )
```

---

### Flow 2: Government Scheme Verification & Data Ingestion Flow

```
[ Raw Scheme Notification / Manual Entry / Scraper Draft ]
       │
       ▼
[ Admin Data Ingestion Engine ]
       │
       ▼
[ Store as DRAFT Status in DB ]
       │
       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     HUMAN-IN-THE-LOOP VERIFICATION                     │
│                                                                        │
│   Government Data Auditor Actions:                                     │
│   1. Inspect Official Gazette Notification / Policy PDF                 │
│   2. Verify Official `.gov.in` / `.nic.in` Application Portal URL      │
│   3. Standardize Eligibility Criteria into JSON Rules Matrix           │
│   4. Define Required Documents and Benefit Structure                   │
│   5. Attach Auditor Sign-Off Metadata (Auditor ID, Verification Date)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ├──────────────────────────┐
               [ APPROVED ]         │                          │ [ REJECTED / EDITS ]
                                    ▼                          ▼
                       [ Mark Status = VERIFIED ]      [ Return to DRAFT ]
                                    │
                                    ▼
                       [ Publish to Scheme DB ]
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
            ( Active Rules Index )     ( Grounded RAG Index )
            ( Deterministic Engine )   ( Vector Chunks in pgvector )
```

---

### Human Verification Points

1. **Rule Translation Check**: A human auditor must confirm that unstructured policy sentences (e.g., *"Available to small farmers owning up to 2 hectares of agricultural land"*) are accurately represented in structured rule JSON (`landholding_acres <= 4.94`).
2. **Domain URL Verification**: Auditors must confirm that outbound application links point directly to authoritative government domains (`.gov.in` or `.nic.in`). Unofficial third-party blog links are strictly prohibited.
3. **Periodic Re-Verification**: Schemes flagged as outdated or modified via citizen feedback are routed to the verification queue before updates are published.
