# Indian Government Scheme Assistant & Knowledge Engine

A production-grade, verifiable platform for Indian government schemes and scholarships discovery, powered by a deterministic eligibility & scheme intelligence engine and an AI-powered conversational layer.

---

## 🚀 System Architecture & Progress

### Phase 1 — System Architecture & Data Model (Completed)
- Standardized SRS, scheme taxonomy, eligibility parameters catalog, data dictionary, system architecture & ADRs under `docs/`.

### Phase 2 — Government Scheme Data & Knowledge Layer (Completed)
- Database schema and ORM models for schemes, categories, eligibility rule groups, eligibility rules, parameters, benefits, documents, and verification lifecycle audit trails.
- Schema verification pipeline enforcing official government source citations (`OfficialSource`, `SchemeSource`).
- Administrative CRUD & Verification REST APIs under `/api/v1/schemes`, `/api/v1/verification`, `/api/v1/taxonomy`.
- Full seed migration script populating canonical real-world schemes.

### Phase 3 — Eligibility & Scheme Intelligence Engine (Completed)
- **Deterministic Evaluator**: Formal boolean & comparative evaluation engine (`DeterministicEligibilityEvaluator`). Zero LLM / black-box scoring.
- **Rule Validator**: Parameter name, operator, and type compatibility checker (`RuleValidator`).
- **Tri-State Classification**: `ELIGIBLE`, `NOT_ELIGIBLE`, and `UNKNOWN`. Missing profile attributes produce `UNKNOWN`, never `NOT_ELIGIBLE`.
- **Nested Tree Logic**: Evaluates arbitrary nested AND/OR rule groups (`evaluate_rule_group`).
- **Explanation Generator**: Produces human-readable line items with strict status markers (`✓`, `✗`, `?`).
- **Profile Completeness**: Missing parameter calculation & prompt generation service (`ProfileCompletenessService`).
- **Batch Scheme Matcher**: Matching engine executing pre-filtering and batch scheme evaluation over published schemes (`SchemeMatchingEngine`).

### Phase 4 — AI Conversational Assistant & RAG Layer (Completed)
- **LLM Provider Abstraction**: Pluggable provider architecture (`LLMProvider`, `OpenAIProvider`, `MockLocalProvider`).
- **Controlled Intent Taxonomy**: Enforces 11 controlled intent enums (`SCHEME_SEARCH`, `ELIGIBILITY_CHECK`, `DOCUMENT_QUERY`, `APPLICATION_GUIDANCE`, `WHY_NOT_ELIGIBLE`, etc.).
- **Entity Extraction & Validation**: Parameter extraction validated against `EligibilityParameter` metadata.
- **Profile Resolution**: Merges stored user profile, message entities, and conversation context without unconfirmed DB overwrites.
- **Controlled Tool Registry**: Mediates tool execution (`search_schemes`, `get_scheme_details`, `evaluate_eligibility`, `get_required_documents`, `get_application_process`, `compare_schemes`).
- **Published Scheme Boundary**: Restricts AI responses strictly to `PUBLISHED` schemes.
- **Clarification Engine**: Formats precise questions asking only for relevant missing parameters when eligibility is `UNKNOWN`.
- **Source-Grounded Responses**: All answers ground scheme claims in retrieved context with official citations and last verified dates.
- **Conversation REST APIs**: `/api/v1/conversations` and `/api/v1/assistant/query`.
- **Frontend Conversational UI**: Full chat UI under `frontend/src/app/chat/page.tsx` with embedded scheme cards, eligibility badges, missing info forms, and citation links.
- **Comprehensive Test Suite**: Pytest test suite `tests/test_phase4_assistant.py` (20/20 test cases passing across all phases).
- **Documentation**: Comprehensive AI docs under `docs/ai/`.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy (Async/Sync), Pydantic v2, SQLite / PostgreSQL.
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide React icons.
- **AI & RAG**: LLM Provider Abstraction (OpenAI / Mock), Controlled Tool Calling, Grounded Citation Pipeline.
- **Testing & Verification**: Pytest, Next.js Production Build verification.

---

## 🏃 Running the Application

### 1. Backend Server
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### 2. Frontend Development Server
```bash
cd frontend
npm run dev
```
Frontend Web UI available at: `http://localhost:3000`
- AI Assistant Chat UI: `http://localhost:3000/chat`
- Eligibility Engine UI: `http://localhost:3000/eligibility`

### 3. Run Full Test Suite
```bash
python -m pytest tests/ -v
```

---

## 📚 Documentation Map

- **AI Assistant Architecture**: `docs/ai/ai-architecture.md`
- **Conversation & Memory Architecture**: `docs/ai/conversation-architecture.md`
- **Intent System & Entities**: `docs/ai/intent-system.md`
- **Scheme Retrieval & Published Boundary**: `docs/ai/retrieval.md`
- **Tool Calling Architecture**: `docs/ai/tool-calling.md`
- **Anti-Hallucination Controls**: `docs/ai/hallucination-prevention.md`
- **Prompt Management**: `docs/ai/prompt-management.md`
- **Evaluation Benchmark**: `docs/ai/evaluation.md`
- **Eligibility Engine Architecture**: `docs/eligibility/eligibility-engine.md`
- **Phase 1 System Architecture**: `docs/architecture/system-architecture.md`