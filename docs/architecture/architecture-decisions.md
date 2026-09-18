# Architecture Decision Records (ADRs)
## Indian Government Scheme & Scholarship Assistant

This document records the core architectural decisions made for the system, following the standard ADR format (Context, Decision, Reason, Consequences).

---

### ADR-001: Use a Modular Monolith Architecture Initially

- **Context**: The project requires establishing user management, scheme catalog, deterministic rules engine, search, and admin verification capabilities. Microservices introduce complex distributed operations, deployment friction, and network overhead.
- **Decision**: Adopt a **Modular Monolith** architecture pattern in Python/FastAPI. Separate domain features into isolated modules (`app/modules/auth_profile`, `app/modules/schemes`, `app/modules/eligibility`, etc.) with clear in-process interface boundaries.
- **Reason**: Simplifies initial development, testing, deployment, and transactional integrity while keeping code modular for potential future microservices extraction.
- **Consequences**:
  - *Positive*: Faster development velocity, simple local setup, zero microservice network latency.
  - *Negative*: Requires disciplined module isolation to prevent monolithic code coupling.

---

### ADR-002: Use PostgreSQL as Primary Relational Database

- **Context**: The system manages highly relational metadata (Schemes, Categories, Benefits, Documents, Users) alongside dynamic eligibility parameter definitions.
- **Decision**: Standardize on **PostgreSQL 16+** using relational tables for core schema and `JSONB` columns for dynamic eligibility rules and dynamic user profile attributes. In Phase 3, enable `pgvector` extension for vector embeddings.
- **Reason**: PostgreSQL provides industry-grade ACID reliability, excellent JSON indexing performance, and seamless vector search extension capability, avoiding the need to run a separate vector database.
- **Consequences**:
  - *Positive*: Unified database layer for relational data, JSON rule matrices, and AI embeddings.
  - *Negative*: Requires careful indexing strategy for JSONB query paths.

---

### ADR-003: Represent Eligibility as Structured JSON Rules Rather Than Unstructured Text

- **Context**: Government scheme guidelines are published as unstructured prose. Evaluating eligibility requires precise mathematical and boolean evaluations.
- **Decision**: Formalize all eligibility criteria into a standardized **structured JSON rule model** containing explicit fields, logical operators (`EQ`, `GTE`, `LTE`, `IN`), and target thresholds.
- **Reason**: Structured JSON rules enable programmatic, fast, deterministic evaluation and permit clean error reporting when a rule fails.
- **Consequences**:
  - *Positive*: Enables 100% deterministic rule matching and clean execution breakdown.
  - *Negative*: Requires human auditor effort to translate policy text into JSON rules during ingestion.

---

### ADR-004: Enforce a Deterministic Rules Engine for Eligibility Evaluation

- **Context**: LLMs can hallucinate or misinterpret edge-case numbers when performing mathematical evaluations, leading to inaccurate eligibility claims.
- **Decision**: Eligibility determination must be **100% deterministic**, handled strictly by code logic evaluating user attributes against structured scheme rules. **AI/LLM models must never be used to make eligibility decisions.**
- **Reason**: Ensures complete accuracy, auditability, legal safety, and trust for citizens seeking government aid.
- **Consequences**:
  - *Positive*: Zero eligibility hallucinations; 100% reproducible results.
  - *Negative*: Rules engine must accommodate complex nested AND/OR condition groups.

---

### ADR-005: Use Grounded RAG for AI Assistant in Later Phases

- **Context**: Citizens need natural-language conversational support to understand complex application procedures and scheme nuances.
- **Decision**: Implement a **Grounded Retrieval-Augmented Generation (RAG)** pipeline in Phase 3. The LLM prompt context will be strictly bound to retrieved chunks of verified government policy documents, with required inline source citations.
- **Reason**: Prevents LLM hallucinations by restricting the model to authoritative source documents.
- **Consequences**:
  - *Positive*: Safe, conversational Q&A linked directly to official policy paragraphs.
  - *Negative*: Requires text chunking, vector embedding maintenance, and strict prompt engineering.

---

### ADR-006: Prioritize Official Government Sources Only

- **Context**: Unofficial blogs, forums, and agents frequently publish inaccurate guidelines or malicious referral links.
- **Decision**: Enforce a strict policy requiring all outbound scheme links to be verified domains ending in `.gov.in` or `.nic.in`.
- **Reason**: Protects citizens from scams, phishers, and outdated third-party information.
- **Consequences**:
  - *Positive*: High user trust and compliance with government data standards.
  - *Negative*: Third-party application portals cannot be listed unless officially designated by a ministry.

---

### ADR-007: Track Verification Date and Auditor Metadata for All Schemes

- **Context**: Government schemes undergo annual policy revisions, budget updates, and portal changes.
- **Decision**: Every scheme record must track `last_verified_at`, `verifier_id`, and `official_source_url`.
- **Reason**: Provides data provenance, accountability, and automated staleness detection.
- **Consequences**:
  - *Positive*: Complete audit history and data quality assurance.
  - *Negative*: Adds database schema overhead and requires admin workflow management.

---

### ADR-008: Strict Non-Verification Policy for Unverified Content

- **Context**: Ingesting draft scheme data or unverified web-scraped content risks exposing incorrect information to citizens.
- **Decision**: Schemes in `DRAFT` or `PENDING_VERIFICATION` status must **never be surfaced in public search or public eligibility evaluations**.
- **Reason**: Prevents unverified or misleading information from reaching citizens.
- **Consequences**:
  - *Positive*: Guarantees that public search results contain only human-verified data.
  - *Negative*: Schemes require explicit admin sign-off before becoming discoverable.
