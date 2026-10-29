# Explore Schemes 404 Route & Discovery Interface Fix Report

**Date:** October 29, 2026  
**Status:** Resolved & Verified  
**Affected Component:** Homepage Quick Actions ("Find Schemes"), Explore button, View All links, Next.js routing, and TopNav search.

---

## 1. Problem Identification & Root Cause Analysis

### Symptoms
When a citizen clicked the **"Find Schemes"** Quick Action card or its **"Explore"** button on the home page (`http://localhost:3000`), the browser navigated to `/schemes` and displayed:
```text
404 — This page could not be found.
```
In dev server logs:
```text
GET /schemes 404 in 144ms
GET /schemes 404 in 118ms
GET /schemes 404 in 58ms
```

### Root Cause
1. **Route Mismatch:** The home page (`frontend/src/app/page.tsx`) hardcoded navigation to `/schemes` (both in the Quick Action card wrapper and the bottom "View All" CTA button).
2. **Missing Schemes Route:** In the Next.js App Router tree (`frontend/src/app/`), dynamic scheme details existed at `schemes/[id]/page.tsx`, but no index route `schemes/page.tsx` existed.
3. **Canonical Route at `/explore`:** The full scheme discovery page was authored at `frontend/src/app/explore/page.tsx`, causing a split between the route navigated to (`/schemes`) and the route implemented (`/explore`).
4. **Header Search Inactivity:** The search input in `frontend/src/components/navigation/TopNav.tsx` was unattached to a form submission or router handler, preventing keyboard-driven exploration.

---

## 2. Implemented Fixes

### A. Route Realignment in Homepage
- **File:** `frontend/src/app/page.tsx`
- Updated the "Find Schemes" Quick Action card link from `/schemes` to canonical `/explore`.
- Updated the bottom "Explore All 26+ Verified Maharashtra Government Schemes" button from `/schemes` to `/explore`.

### B. Created `/schemes` Route Alias
- **File:** `frontend/src/app/schemes/page.tsx`
- Created an index route under `schemes/` that directly imports and renders `ExplorePage`.
- **Result:** Whether a citizen clicks the link, enters `/explore`, or directly bookmarks or navigates to `/schemes`, both routes return `200 OK` with zero 404 errors.

### C. Enhanced Scheme Discovery Experience (`/explore`)
- **File:** `frontend/src/app/explore/page.tsx`
- **Heading & Subtitle:**
  - Heading: *Explore Government Schemes*
  - Subtitle: *Browse verified welfare schemes, student scholarships, agricultural subsidies, and entrepreneurship credit programs. Prioritizing official Maharashtra State Government initiatives alongside Centrally sponsored programs.*
- **Search:** Instant text search across scheme name, keyword, department, or beneficiary with query string initialization (`useSearchParams`).
- **Beneficiary Filtering:**
  - Interactive pill buttons: **All Schemes**, **Students**, **Farmers**, **MSME**, and **PwD**.
- **Government-Level Filters:**
  - Select options: **All Government Levels**, **Maharashtra State Government**, **Centrally Sponsored Schemes**, **Central Government Initiatives**.
- **Sorting Modes:**
  - **State Schemes First (Default)**, **Scheme Name (A to Z)**, **Scheme Name (Z to A)**, and **Recently Verified**.
- **Scheme Cards:**
  - Official badges (Maharashtra State, Centrally Sponsored, Central).
  - Verified trust badges.
  - Interactive bookmarking with optimistic updates and backend synchronization (`fetchBookmarkedSchemeIds`, `toggleSchemeBookmark`).
  - Benefit ceilings and official `.gov.in` application links.
  - Details button routing to `/schemes/[id]` or `/schemes/[slug]`.
- **States:**
  - Animated loading skeletons.
  - Friendly error states with a retry button.
  - Clean empty states with a one-click "Clear All Filters" button.

### D. Header Search Bar Navigation
- **File:** `frontend/src/components/navigation/TopNav.tsx`
- Connected the top search bar to `useRouter()`. Pressing Enter now pushes directly to `/explore?search=${encodeURIComponent(query)}`.

---

## 3. Verification & Test Evidence

| Check / Action | Expected Result | Actual Result |
|---|---|---|
| Click "Find Schemes" card on home page | Navigates to `/explore` | **200 OK** (Instant load) |
| Click "Explore" button on Quick Action card | Navigates to `/explore` | **200 OK** |
| Navigate directly to `http://localhost:3000/schemes` | Renders Explore directory | **200 OK** (Zero 404s) |
| Beneficiary tabs (Students, Farmers, MSME, PwD) | Filters schemes by target group | **Passed** |
| Government Level filter | Distinguishes State vs Central | **Passed** |
| Search via TopNav search bar | Navigates to `/explore?search=...` | **Passed** |
| Automated pytest suite (`test_featured_schemes_finder.py`) | 7/7 tests passing | **7/7 Passed** |
| Frontend TypeScript check (`npx tsc --noEmit`) | 0 compilation errors | **0 Errors** |
