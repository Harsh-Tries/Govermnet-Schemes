# System Architecture
## Indian Government Scheme & Scholarship Assistant

This document outlines the software architecture, component boundaries, modular boundaries, and fundamental design principles of the system.

---

### 1. High-Level Component Flow Diagram

```
                     ┌──────────────────────────────────────────────┐
                     │          User / Mobile Browser               │
                     │    Next.js 14 App Router / React / UI Shell │
                     └──────────────────────┬───────────────────────┘
                                            │ HTTPS / REST API
                                            ▼
                     ┌──────────────────────────────────────────────┐
                     │             API Gateway Layer                │
                     │          FastAPI / Pydantic v2 Router        │
                     └───────┬──────────────────────────────┬───────┘
                             │                              │
             ┌───────────────┴───────────────┐              │
             ▼                               ▼              ▼
┌──────────────────────────┐    ┌──────────────────────────┐  ┌──────────────────────────┐
│   User/Profile Service   │    │  Scheme & Search Service │  │  Admin & Audit Service   │
└────────────┬─────────────┘    └────────────┬─────────────┘  └────────────┬─────────────┘
             │                               │                             │
             │                               ▼                             │
             │                  ┌──────────────────────────┐               │
             └─────────────────►│ Deterministic Engine     │◄──────────────┘
                                │ JSON Rule Evaluator      │
                                └────────────┬─────────────┘
                                             │ SQL / SQLAlchemy v2
                                             ▼
                                ┌──────────────────────────┐
                                │ Verified Scheme DB       │
                                │ PostgreSQL 16 (Relational│
                                │ + JSONB Rules Matrix)    │
                                └────────────┬─────────────┘
                                             │
                                             ▼ (Phases 3+)
                                ┌──────────────────────────┐
                                │ Grounded RAG AI Layer    │
                                │ Vector Store (pgvector)  │
                                │ + Context-Bound LLM      │
                                └────────────┬─────────────┘
                                             │ Outbound Verified Links
                                             ▼
                                ┌──────────────────────────┐
                                │ Official Govt Sources    │
                                │ (*.gov.in / *.nic.in)    │
                                └──────────────────────────┘
```

---

### 2. CORE ARCHITECTURAL PRINCIPLE: Deterministic Rules vs. AI

> **FUNDAMENTAL RULE**:
> The **Eligibility Engine MUST be 100% deterministic**. It executes formal logical evaluations (`AND`, `OR`, `>=`, `<=`, `IN`) over structured parameters in JSON format.
>
> The **LLM / RAG Layer** is strictly isolated to **natural-language understanding, retrieval, policy explanation, and conversational assistance**.
>
> The LLM **MUST NEVER** be used to independently decide, infer, or guess whether a citizen is eligible for a scheme.

---

### 3. Core System Modules

#### 3.1 Authentication & Profile Module (`app/modules/auth_profile`)
- Manages user registrations, sessions, JWT token lifecycle, and PII encryption.
- Maintains user socio-economic profiles and handles profile updates.

#### 3.2 Scheme Catalog & Search Module (`app/modules/schemes`)
- Provides REST endpoints for keyword search, taxonomy filtering, and faceted browsing.
- Serves verified scheme summaries, benefit breakdowns, and document requirements.

#### 3.3 Deterministic Eligibility Engine (`app/modules/eligibility`)
- High-performance rule matching engine.
- Evaluates `UserProfile` instances against `EligibilityRule` records.
- Computes match states (`FULLY_ELIGIBLE`, `PARTIALLY_ELIGIBLE`, `INELIGIBLE`) and generates human-readable evaluation matrices.

#### 3.4 Admin & Verification Module (`app/modules/admin`)
- Workflow engine for government data auditors to create, review, verify, and publish schemes.
- Enforces source metadata tagging (`official_url`, `gazette_ref`, `auditor_id`).

#### 3.5 Grounded RAG AI Assistant Module (`app/modules/ai` - Phase 3)
- Vector indexing pipeline for verified government policy PDFs/guidelines.
- Grounded prompt execution ensuring LLM answers cite specific verified document chunks.

#### 3.6 User Workspace Module (`app/modules/workspace`)
- Manages bookmarked schemes, application tracking notes, and document readiness checklists.

#### 3.7 Audit & Logging Module (`app/modules/audit`)
- Immutable log recorder tracking rule changes, admin sign-offs, and verification histories.

---

### 4. Technical Stack Justification

- **Next.js 14+ (App Router)**: Enables fast Server-Side Rendering (SSR) for SEO and low-bandwidth client bundle sizes.
- **FastAPI (Python)**: High asynchronous throughput, native Pydantic v2 data validation, and seamless integration with Python AI ecosystem (LangChain/pgvector).
- **PostgreSQL 16**: Industry standard relational database providing robust ACID compliance for scheme relations, native `JSONB` indexing for dynamic eligibility rules, and `pgvector` extension for vector embeddings.
- **Modular Monolith Architecture**: Avoids microservices overhead while maintaining strict domain layer boundaries, simplifying deployment during early phases.
