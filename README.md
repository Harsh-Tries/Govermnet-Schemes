# Indian Government Scheme Assistant & Knowledge Engine

A production-grade, verifiable platform for Indian government schemes and scholarships discovery, powered by a deterministic eligibility & scheme intelligence engine.

---

## 🚀 System Architecture & Progress

### Phase 1 — System Architecture & Data Model (Completed)
- Standardized SRS, scheme taxonomy, eligibility parameters catalog, data dictionary, system architecture & ADRs under `docs/`.

### Phase 2 — Government Scheme Data & Knowledge Layer (Completed)
- Database schema and ORM models for schemes, categories, eligibility rule groups, eligibility rules, parameters, benefits, documents, and verification lifecycle audit trails.
- Schema verification pipeline enforcing official government source citations (`OfficialSource`, `SchemeSource`).
- Administrative CRUD & Verification REST APIs under `/api/v1/schemes`, `/api/v1/verification`, `/api/v1/taxonomy`.
- Full seed migration script populating 5 canonical real-world schemes (MP Post Matric Scholarship, PM-KISAN, PMEGP, PM-VISHWAKARMA, Post-Matric Scholarship for SC Students).

### Phase 3 — Eligibility & Scheme Intelligence Engine (Completed)
- **Deterministic Evaluator**: Formal boolean & comparative evaluation engine (`DeterministicEligibilityEvaluator`). Zero LLM / black-box scoring.
- **Rule Validator**: Parameter name, operator, and type compatibility checker (`RuleValidator`).
- **Tri-State Classification**: `ELIGIBLE`, `NOT_ELIGIBLE`, and `UNKNOWN`. Missing profile attributes produce `UNKNOWN`, never `NOT_ELIGIBLE`.
- **Nested Tree Logic**: Evaluates arbitrary nested AND/OR rule groups (`evaluate_rule_group`).
- **Explanation Generator**: Produces human-readable line items with strict status markers (`✓`, `✗`, `?`).
- **Profile Completeness**: Missing parameter calculation & prompt generation service (`ProfileCompletenessService`).
- **Batch Scheme Matcher**: Matching engine executing pre-filtering and batch scheme evaluation over published schemes (`SchemeMatchingEngine`).
- **REST APIs**: Endpoints under `/api/v1/eligibility` (`/match`, `/eval`, `/completeness`, `/validate-rule`).
- **Frontend Integration**: Built `EligibilityStatusBadge`, `EligibilityExplanationList`, `MissingInformationPrompt`, `SchemeMatchCard`, and live matching page under `frontend/src/app/eligibility/page.tsx`.
- **Test Suite**: Pytest test suite `tests/test_intelligence_engine.py` (100% pass rate across 5 test cases).
- **Documentation**: Detailed docs under `docs/eligibility/`.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy (Async/Sync), Pydantic v2, SQLite / PostgreSQL.
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide React icons.
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

### 3. Run Backend Test Suite
```bash
python -m pytest tests/test_intelligence_engine.py -v
```

---

## 📚 Documentation Map

- **Phase 1 System Architecture**: `docs/architecture/system-architecture.md`
- **Software Requirements Specification (SRS)**: `docs/requirements/SRS.md`
- **Eligibility Engine Architecture**: `docs/eligibility/eligibility-engine.md`
- **Rule Evaluation & Operators**: `docs/eligibility/rule-evaluation.md`
- **Result States & Explanations**: `docs/eligibility/result-states.md`
- **Profile Completeness**: `docs/eligibility/profile-completeness.md`
- **Scheme Matching Engine**: `docs/eligibility/matching-engine.md`