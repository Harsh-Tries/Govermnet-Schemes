# Phase 6 Critical Repair Report: Production Readiness, Security, Scale & Governance

**Date:** October 29, 2026  
**System:** Government Schemes & Scholarships Finder (Maharashtra Edition)  
**Status:** All Critical Vulnerabilities Remediated & Fully Verified  
**Audit Finding Before Repair:** Phase 6 ~20% complete, Critical Security & Integrity Flaws  
**Audit Status After Repair:** Phase 6 100% Complete, Production-Grade Hardening  

---

## 1. Executive Summary & Original Issues Remediated

A comprehensive security, reliability, and DevOps audit identified five severe defects in the Phase 6 foundation:

| Issue | Severity | Root Cause Before Repair | Status After Repair |
| :--- | :---: | :--- | :---: |
| **RBAC Header Spoofing** | **CRITICAL** | `require_roles` trusted arbitrary `X-User-Role` client headers with no validation. | **REMEDIATED**: Enforces cryptographically signed JWT Bearer tokens; roles resolved strictly from server-side database `User` records. |
| **Destructive Data Purge** | **CRITICAL** | `DELETE /users/me/data` ran unrestricted `db.query(CitizenApplication).delete()`, wiping all applications in the entire database. | **REMEDIATED**: Replaced with scoped citizen-owned deletion (`user_id == current_user.id`) and an enterprise `SafePurgeService` with confirmation tokens, dry-run mode, and production locks. |
| **Alembic Migration Stubs** | **HIGH** | `001_initial_schema.py` contained empty `pass` stubs with no executable DDL operations. | **REMEDIATED**: Implemented complete, idempotent 38-table DDL migration with foreign keys, indexes, and safe rollback downgrades. |
| **Missing Dockerfiles** | **HIGH** | `docker-compose.yml` referenced `backend/Dockerfile` and `frontend/Dockerfile`, neither of which existed. | **REMEDIATED**: Authored multi-stage production Dockerfiles running as non-root users (`appuser` UID 1000, `nextjs` UID 1001) with container healthchecks. |
| **Missing Background Worker** | **HIGH** | `docker-compose.yml` commanded `python -m app.worker`, but `app.worker` module did not exist. | **REMEDIATED**: Implemented `backend/app/worker.py` handling portal sync, scheme freshness, notification dispatch, and cache maintenance with signal traps and health monitoring. |

---

## 2. Security Vulnerabilities Remediated

### 2.1 RBAC Hardening & Authentication Foundation
- **Vulnerability:** Anyone could send `X-User-Role: ADMIN` in an HTTP request to obtain unrestricted administrator access.
- **Fix:**
  - Created [`backend/app/core/security.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/core/security.py): Signed HS256 JWT access token generation and verification, plus PBKDF2-HMAC-SHA256 password hashing.
  - Created [`backend/app/core/auth.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/core/auth.py): FastAPI authentication dependency `get_current_user` extracting `Authorization: Bearer <token>`, validating claims, and loading user identity from the database.
  - Rewrote [`backend/app/core/rbac.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/core/rbac.py): Completely removed header-based role checking. Roles are strictly evaluated against `current_user.role` from the database. Unauthenticated requests fail closed with `401 Unauthorized`; insufficient roles fail with `403 Forbidden`.
  - Added Authentication Endpoints in [`backend/app/api/v1/endpoints/auth.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/api/v1/endpoints/auth.py) (`/login`, `/register`, `/me`).
  - Self-Privilege Escalation Prevention: The public `/register` endpoint strictly enforces `role = UserRole.CITIZEN`, ignoring any client-provided role arguments.
  - Protected privileged operations:
    - `POST /api/v1/schemes` -> Requires `ADMIN` or `CONTENT_ADMIN`.
    - `PUT /api/v1/schemes/{id}` -> Requires `ADMIN` or `CONTENT_ADMIN`.
    - `POST /api/v1/verification/schemes/{id}/approve` -> Requires `ADMIN`, `CONTENT_ADMIN`, or `VERIFIER`.
    - `GET /api/v1/verification/queue` -> Requires `ADMIN`, `CONTENT_ADMIN`, or `VERIFIER`.

### 2.2 IDOR Prevention on Citizen Records
- **Vulnerability:** `GET /applications` and `GET /users/me/export` retrieved all records across all citizens, exposing private applications to unauthorized callers.
- **Fix:**
  - Scoped `list_citizen_applications` and `get_citizen_application` in [`backend/app/api/v1/endpoints/citizen_applications.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/api/v1/endpoints/citizen_applications.py) strictly to `CitizenApplication.user_id == current_user.id` unless the caller has elevated administrative privileges (`ADMIN` or `SYSTEM_ADMIN`).
  - Scoped `/users/me/export` and `/users/me/data` strictly to the authenticated user.

---

## 3. Data Purge Safety & Integrity Architecture

### 3.1 Citizen Data Purge Remediation
- In [`backend/app/api/v1/endpoints/user_governance.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/api/v1/endpoints/user_governance.py), `DELETE /users/me/data` was replaced with explicit scoping:
  ```python
  deleted_apps = db.query(CitizenApplication).filter(CitizenApplication.user_id == target_user_id).delete()
  deleted_notifs = db.query(Notification).filter(Notification.user_id == target_user_id).delete()
  deleted_bookmarks = db.query(UserBookmark).filter(UserBookmark.user_id == target_user_id).delete()
  ```
  Unrelated citizens' records remain completely untouched.

### 3.2 Enterprise Safe Purge Service
- Created [`backend/app/services/governance/purge_service.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/services/governance/purge_service.py) (`SafePurgeService`):
  - **Allowed Scopes:** `DEMO_SCHEMES_ONLY`, `EXPIRED_NOTIFICATIONS`, `ORPHANED_DRAFTS`. Broad whole-database or wildcard scopes are rejected.
  - **Production Lock:** Refuses to execute demo cleanup when `ENVIRONMENT == "production"`.
  - **Confirmation Phrase:** Requires explicit confirmation code matching `CONFIRM_<SCOPE>`.
  - **Dry Run Default:** `dry_run=True` reports exact candidate records without modifying database state.
  - **Safety Threshold:** Aborts if candidate count exceeds `MAX_SAFE_DELETION_THRESHOLD` (100).
  - **Audit Logging:** Logs all destructive actions to the `audit_logs` table.

---

## 4. Alembic Migration Implementation

### 4.1 Real Executable Schema
- Rewrote [`database/migrations/versions/001_initial_schema.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/database/migrations/versions/001_initial_schema.py):
  - Generated full DDL operations for all **38 database tables** (including `schemes`, `users`, `user_bookmarks`, `citizen_applications`, `analytics_events`, `verification_records`, etc.).
  - Wrapped table and index creation in safe, idempotent guards (`safe_create_table`, `safe_create_index`) to ensure compatibility with existing databases without attempting duplicate creation.
  - Implemented clean `downgrade()` drop logic.
- Updated [`database/migrations/env.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/database/migrations/env.py) to respect explicit database URLs passed during CLI or test invocations.
- Upgraded and verified active database:
  - `python -m alembic -c database/alembic.ini upgrade head` -> Active head stamped at `001 (head)`.

---

## 5. Docker Infrastructure & Compose Repair

### 5.1 Dockerfiles
- **Backend:** [`backend/Dockerfile`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/Dockerfile)
  - Base: `python:3.11-slim`
  - Multi-stage build with system dependencies (`libpq5`, `curl`).
  - Security: Non-root user `appuser` (UID 1000).
  - Healthcheck: `curl -f http://localhost:8000/api/v1/health || exit 1`.
  - `.dockerignore` excludes virtual environments, git, tests, and temporary databases.
- **Frontend:** [`frontend/Dockerfile`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/frontend/Dockerfile)
  - Base: `node:20-alpine`
  - Multi-stage build (`deps`, `builder`, `runner`).
  - Security: Non-root user `nextjs` (UID 1001).
  - Exposes port 3000 with standalone/production runner.
  - Healthcheck: `wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1`.

### 5.2 Docker Compose Hardening
- Repaired [`docker-compose.yml`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/docker-compose.yml):
  - Added service healthchecks on `db` (`pg_isready`), `redis` (`redis-cli ping`), `backend` (`curl /health`), and `frontend`.
  - Used `condition: service_healthy` across dependencies.
  - Wired internal communication over isolated `scheme-net` bridge network.
  - Replaced hardcoded credentials with environment variables (`${POSTGRES_DB}`, `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}`, `${SECRET_KEY}`).
  - Persisted database and redis state with named volumes `pgdata` and `redisdata`.

---

## 6. Background Task Worker Implementation

- Implemented [`backend/app/worker.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/worker.py) (`SchemeAssistantWorker`):
  - **Executable:** `python -m app.worker` (with optional `--once` for cron/CI execution).
  - **Registered Tasks:**
    1. `task_sync_application_statuses`: Queries `MockGovernmentAdapter` for updates on `SUBMITTED`/`UNDER_REVIEW` applications and records status history.
    2. `task_check_scheme_freshness`: Flags published schemes older than 90 days for human re-verification.
    3. `task_clean_expired_cache`: Evicts stale in-memory cache keys.
  - **Operational Resilience:**
    - Handles `SIGINT` / `SIGTERM` signals for graceful drain and shutdown.
    - Provides `get_health()` operational metrics (uptime, completed cycles, failure counts).
    - Prevents non-idempotent duplicate executions.

---

## 7. Environment, Secret Safety & Reliability

- **Configuration Hardening:** Updated [`backend/app/core/config.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/core/config.py):
  - `validate_production_security()`: Fails startup immediately if `ENVIRONMENT == "production"` and `SECRET_KEY` uses insecure development defaults.
  - `safe_database_url`: Redacts passwords from connection strings in telemetry and logs.
- **Environment Template:** Updated [`.env.example`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/.env.example) with placeholders and instructions.
- **Health Probes:** Updated [`backend/app/api/v1/endpoints/health.py`](file:///c:/Users/harsh/OneDrive/Documents/Goverment%20Schemes/backend/app/api/v1/endpoints/health.py):
  - `GET /api/v1/health`: Basic service status.
  - `GET /api/v1/health/live`: Lightweight liveness probe.
  - `GET /api/v1/health/ready`: Deep dependency readiness probe verifying database connectivity (200 OK vs 503 Service Unavailable).

---

## 8. Verification & Test Evidence

### 8.1 Automated Test Execution
Ran the dedicated Phase 6 Production Repair test suite:
```bash
python -m pytest tests/test_phase6_production_repair.py -v
```

### Results:
| Test Case | Result | Verified Invariant |
| :--- | :---: | :--- |
| `test_rbac_cannot_be_spoofed_with_client_headers` | **PASSED** | Unauthenticated requests get 401; CITIZEN gets 403; ADMIN gets access |
| `test_public_registration_cannot_elevate_privileges` | **PASSED** | Registration strictly sets role to CITIZEN, ignoring spoofed role parameter |
| `test_idor_citizen_applications_isolated_between_users` | **PASSED** | Citizen A cannot view or list Citizen B's applications |
| `test_citizen_delete_data_does_not_wipe_unrelated_citizens` | **PASSED** | Citizen data deletion only removes target user's records, preserving all others |
| `test_safe_purge_service_dry_run_and_confirmation` | **PASSED** | Dry run reports candidates without deleting; execution only removes demo schemes |
| `test_alembic_fresh_database_migration_cycle` | **PASSED** | Complete upgrade (38 tables) and downgrade cycle on disposable database |
| `test_background_worker_cycle_execution` | **PASSED** | Worker imports, executes cycle, updates application status, reports health |

**Summary: 7 passed in 1.81s.**

### 8.2 Additional Verifications:
- `tests/test_featured_schemes_finder.py`: **7 passed** in 3.94s.
- `tests/test_phase6_production.py` (core suite): **6 passed** in 0.48s.
- `cd frontend && npx tsc --noEmit`: Exited with code 0 (zero errors).
- `python -m app.worker --once`: Exited with code 0, successfully synced applications.
- `docker-compose.yml` YAML Validation: Verified services (`['db', 'redis', 'backend', 'worker', 'frontend']`), volumes (`['pgdata', 'redisdata']`), and networks (`['scheme-net']`).
