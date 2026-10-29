# Citizen Application Tracking Dashboard Implementation Report

**Project:** Government Scheme Assistant — Maharashtra Government Schemes & Scholarships Finder  
**Author:** Senior Full-Stack Engineering Team  
**Date:** October 30, 2026  
**Status:** Fully Functional & Tested  

---

## 1. Existing Functionality Inspected

Prior to this implementation, the Application Tracking Dashboard was inspected across both backend and frontend:
1. **Frontend (`frontend/src/app/applications/page.tsx`):**
   - Displayed static hardcoded cards including an out-of-scope Madhya Pradesh scheme (`MP Post Matric Scholarship Scheme for SC/ST/OBC Students`) and hardcoded demo reference numbers.
   - The `+ Track New Application` button merely appended a dummy item into React local component state (`setApplications([newItem, ...applications])`), persisting nothing to the database.
   - The status timeline was a visual mockup that could not reflect real database-backed status transitions.
   - Document upload, official portal sync, history view, and edit status were static or missing.
2. **Backend Models (`backend/app/models/application_tracking.py`):**
   - `CitizenApplication` and `ApplicationStatusHistory` tables existed in SQLite, but were missing critical columns needed for tracking: `application_type`, `tracking_method`, `last_synced_at`, `rejection_reason`, `action_required_details`, and `disbursement_details`.
   - `ApplicationDocument` table did not exist.
3. **Backend Endpoints (`backend/app/api/v1/endpoints/citizen_applications.py`):**
   - The router lacked summary calculation endpoints (`/applications/summary`), document upload & deletion endpoints, and search/sort filtering.
   - Initial application creation did not validate unique reference numbers per citizen or enforce safe status progressions.

---

## 2. Root Cause of Static Features

- **Hardcoded State:** The frontend was disconnected from the FastAPI `/api/v1/applications` API.
- **Missing Endpoints:** No REST endpoints existed for document uploads, application summaries, and search/sorting.
- **Unused Database Tables:** While database tables had been created in earlier phases, no complete frontend service bridge connected the UI to them.

---

## 3. Database Models & Migrations

A database migration was created and executed in [`backend/app/db/migrate_application_tracking.py`](file:///backend/app/db/migrate_application_tracking.py) on `scheme_assistant.db`:

1. **`citizen_applications` Table:**
   - Added `application_type VARCHAR(20) DEFAULT 'FRESH'` (`FRESH` vs `RENEWAL`).
   - Added `tracking_method VARCHAR(50) DEFAULT 'MANUAL'` (`MANUAL` vs `OFFICIAL_SYNC`).
   - Added `last_synced_at DATETIME`.
   - Added `rejection_reason TEXT` (explanation when an application is rejected).
   - Added `action_required_details TEXT` (details of missing documents/action required).
   - Added `disbursement_details TEXT` (verified DBT transaction details).

2. **`application_status_history` Table:**
   - Added `title VARCHAR(255)`.
   - Added `remarks TEXT`.
   - Added `created_by VARCHAR(100)`.

3. **`application_documents` Table (Created):**
   - `id VARCHAR(36) PRIMARY KEY`.
   - `application_id VARCHAR(36) NOT NULL FOREIGN KEY(citizen_applications.id) ON DELETE CASCADE`.
   - `user_id VARCHAR(36) FOREIGN KEY(users.id) ON DELETE CASCADE`.
   - `document_name VARCHAR(255) NOT NULL`.
   - `document_type VARCHAR(100) NOT NULL`.
   - `file_path VARCHAR(500) NOT NULL`.
   - `mime_type VARCHAR(100)`.
   - `file_size INTEGER`.
   - `verification_status VARCHAR(50) DEFAULT 'PENDING'`.
   - `uploaded_at DATETIME NOT NULL`.
   - Indexes on `application_id` and `user_id`.

---

## 4. Backend Endpoints Implemented

In [`backend/app/api/v1/endpoints/citizen_applications.py`](file:///backend/app/api/v1/endpoints/citizen_applications.py):

| Method | Endpoint | Description | IDOR / Security |
|---|---|---|---|
| `POST` | `/api/v1/applications` | Create a new tracked application with initial status history | Authenticated citizen only; duplicate reference check per citizen |
| `GET` | `/api/v1/applications` | List citizen applications with search, status filtering, and sorting | Citizen sees only their own; Admin sees all |
| `GET` | `/api/v1/applications/summary` | Get summary counts (Total, Under Process, Approved, Action Required, Rejected) | Scoped to authenticated user |
| `GET` | `/api/v1/applications/{id}` | Retrieve application dossier with history and documents | Cross-account access blocked with 403 Forbidden |
| `PATCH`| `/api/v1/applications/{id}` | Update application details, personal notes, or citizen status | Ownership check enforced |
| `PUT`  | `/api/v1/applications/{id}/status` | Update status transition and log history record | Ownership check enforced |
| `GET`  | `/api/v1/applications/{id}/history` | Retrieve full timeline audit history | Scoped to owner / admin |
| `POST` | `/api/v1/applications/{id}/documents` | Upload supporting document or acknowledgement receipt | Validates file size (max 5MB) and mime types (.pdf, .png, .jpg, .webp) |
| `GET`  | `/api/v1/applications/{id}/documents` | List uploaded documents for application | Scoped to owner |
| `GET`  | `/api/v1/applications/{id}/documents/{doc_id}/download` | Secure document download | Checks user ownership before serving file |
| `DELETE`| `/api/v1/applications/{id}/documents/{doc_id}` | Delete uploaded document | Scoped to owner; removes physical file |

---

## 5. Frontend Architecture & Features

Created [`frontend/src/services/applicationsApi.ts`](file:///frontend/src/services/applicationsApi.ts) and rebuilt [`frontend/src/app/applications/page.tsx`](file:///frontend/src/app/applications/page.tsx):

1. **Dashboard Header & Top Summary Cards:**
   - Real database metric counts:
     - **Total Applications**
     - **Under Process:** `SUBMITTED`, `DOCUMENTS_VERIFICATION`, `UNDER_REVIEW`, `PAYMENT_PROCESSING`.
     - **Approved:** `APPROVED`, `BENEFIT_DISBURSED`.
     - **Action Required:** `ADDITIONAL_INFO_REQUIRED`.
2. **Search, Filter & Sorting Bar:**
   - Real-time search across scheme names, reference numbers, and department names.
   - Status filter pills with live counts.
   - Sorting options: Recently Updated, Recently Submitted, Oldest, and By Status.
   - Clear/reset filters action.
3. **`+ Track New Application` Modal:**
   - Dropdown of genuine Maharashtra schemes loaded from the backend scheme database.
   - Auto-populates Department and verified official portal URL when a scheme is chosen.
   - Validates Reference Number, Submission Date (restricted to past/today), Application Type (`Fresh` vs `Renewal`).
   - Supports optional acknowledgement receipt document upload upon creation.
   - Shows field validation errors and toast notification upon success.
4. **Dynamic 4-Step Progress Tracker:**
   - Stages: **1. Submitted** → **2. Documents Verification** → **3. Under Review** → **4. Approved / Rejected**.
   - Distinct color-coded status badges:
     - Emerald Green: Approved / Benefit Disbursed
     - Sky Blue: Under Process / Payment Processing
     - Amber: Action Required (with banner detailing missing documents)
     - Rose Red: Rejected (with banner detailing official rejection reason)
5. **Timeline & Audit History Modal (`View History`):**
   - Displays chronological history of every transition: Title, previous status → new status, timestamp, source (`CITIZEN_MANUAL`, `ADMIN_VERIFICATION`), notes, and remarks.
6. **Update Status Modal (`Update Status`):**
   - Allows citizens to record latest progress updates from government portals.
   - Automatically records a new history event with previous and new statuses.
7. **Application Dossier Modal (`View Details`):**
   - Displays complete scheme and application information.
   - Lists uploaded documents with download and delete capabilities.
   - Allows uploading additional supporting documents with instant file validation.
   - Provides a "Download Summary" action that generates a print-friendly official application record receipt.
   - Direct link to official portals (MahaDBT, Aaple Sarkar, PM-KISAN, etc.).
8. **Clean Empty State:**
   - Shows when zero applications are tracked, providing a clean CTA to track the first application. No fake demo schemes.

---

## 6. Official Portal Integration Transparency

In compliance with project requirements:
- **Manual Tracking Mode:** Displayed by default for all citizen-managed applications. Clearly displays "Manual Tracking" with last citizen update timestamp.
- **No Fabricated Live Sync:** Removed fake "Official Portal Sync" badges. The dashboard clearly provides verified official links to portals such as MahaDBT (`https://mahadbt.maharashtra.gov.in/`) and Aaple Sarkar (`https://aaplesarkar.mahaonline.gov.in/`) without claiming automated scraping or unauthorized live API connections.

---

## 7. Automated Test Suite & Verification

Created [`tests/test_citizen_application_tracking.py`](file:///tests/test_citizen_application_tracking.py) testing all core workflows:

1. `test_create_citizen_application_success`: ✅ PASSED
2. `test_create_application_duplicate_reference_rejected`: ✅ PASSED (409 Conflict)
3. `test_create_application_invalid_scheme_rejected`: ✅ PASSED (404 Not Found)
4. `test_list_applications_and_idor_protection`: ✅ PASSED (Citizen A cannot see Citizen B's applications)
5. `test_get_application_by_id_idor_blocked`: ✅ PASSED (403 Forbidden)
6. `test_update_application_status_and_history`: ✅ PASSED (Complete 4-stage progression and history log)
7. `test_application_action_required_and_rejection_states`: ✅ PASSED (Explaining specific reasons)
8. `test_application_summary_metrics`: ✅ PASSED (Counts match DB records)
9. `test_application_document_upload_and_idor_protection`: ✅ PASSED (Upload, MIME validation, and deletion protection)

**TypeScript Typecheck:** `npx tsc --noEmit` passed with 0 errors.  
**Pytest Results:** `9 passed in 4.74s`.  
**Dev Servers Active:**
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:3000/applications`
