# User Journeys
## Indian Government Scheme & Scholarship Assistant

This document outlines the step-by-step user interaction maps (User Action → System Action → Result) for core user tasks.

---

### Journey A: Find Schemes Using Profile

1. **User Action**: The user selects "Check My Eligibility" from the home dashboard and enters socio-demographic parameters (Age: 20, Gender: Male, State: MP, Income: ₹2.2L, Profession: Student).
2. **System Action**:
   - Validates input parameters against the eligibility parameter schema.
   - Invokes the **Deterministic Rules Engine** to filter the active scheme catalog.
   - Evaluates boolean logic conditions (`Age >= 18 AND Income <= 250000 AND State == 'MP'`).
   - Ranks fully eligible schemes first, followed by partially eligible schemes.
3. **Result**: The system displays a personalized dashboard showing "3 Fully Eligible Schemes" (e.g., Post-Matric Scholarship for OBC) and "2 Partially Eligible Schemes" with match percentages and clear breakdown tags.

---

### Journey B: Search Schemes Manually

1. **User Action**: The user enters keywords in the global search bar (e.g., "drip irrigation subsidy Maharashtra") and clicks Search.
2. **System Action**:
   - Tokenizes and cleans search query parameters.
   - Performs full-text keyword search across scheme titles, descriptions, and category tags.
   - Filters results by State ("Maharashtra") and Sector ("Agriculture").
3. **Result**: System presents a paginated list of matching government schemes with active filters highlighted, displaying scheme summary cards with official badges.

---

### Journey C: View Scheme Details

1. **User Action**: The user clicks on a scheme card (e.g., "Pradhan Mantri Fasal Bima Yojana").
2. **System Action**:
   - Fetches verified scheme record from PostgreSQL database.
   - Retrieves associated metadata: Ministry details, benefit structures, application timelines, official portal URL, and verification timestamp.
3. **Result**: System renders a structured detail page showing Key Overview, Benefits Breakdown, Financial Grant Ceilings, Eligibility Checklist, Required Documents, and Official Source Link.

---

### Journey D: Determine Eligibility

1. **User Action**: On a scheme detail page, an authenticated user clicks "Am I Eligible?".
2. **System Action**:
   - Cross-references the user's stored profile attributes against the specific scheme's structured JSON eligibility rules.
   - Executes attribute-by-attribute evaluation (e.g., `Landholding <= 2.0 Acres` -> PASS; `Income <= 1.5L` -> PASS).
3. **Result**: System displays an explicit "ELIGIBLE" status badge along with an itemized evaluation matrix showing every rule criterion and the corresponding profile value evaluated.

---

### Journey E: Identify Missing Eligibility Information

1. **User Action**: User evaluates eligibility for a specialized scheme (e.g., "National Fellowship for Persons with Disabilities") without having specified their disability status in their profile.
2. **System Action**:
   - The Rules Engine detects missing required parameters (`disability_status`, `disability_percentage`).
   - Flag the condition as "INCOMPLETE_PROFILE".
3. **Result**: System displays a prompt: *"To evaluate eligibility for this scheme, please answer 2 missing questions: Do you have a recognized disability certificate? What is your disability percentage?"* with inline input fields to update the profile immediately.

---

### Journey F: View Required Documents

1. **User Action**: User clicks on the "Required Documents" tab for an eligible scheme.
2. **System Action**:
   - Fetches the mapped `RequiredDocument` entities linked to the scheme.
   - Checks whether the document type is mandatory or optional.
   - Retrieves document specification rules (e.g., "Income Certificate issued on or after April 1, 2026 by Revenue Authority").
3. **Result**: System displays an interactive document checklist with issuing authority details, required format (PDF/JPEG), sample template links, and readiness status toggles for the user.

---

### Journey G: Navigate to Official Application Source

1. **User Action**: User clicks the "Apply via Official Portal" button.
2. **System Action**:
   - Intercepts the click to log external navigation metrics.
   - Validates that the destination URL matches verified domain patterns (`*.gov.in` or `*.nic.in`).
   - Renders a brief security notice modal: *"You are now leaving Government Scheme Assistant to visit the official government application portal (https://scholarships.gov.in)."*
3. **Result**: User is safely redirected to the authoritative government application page in a new browser window.

---

### Journey H: Save / Bookmark a Scheme

1. **User Action**: An authenticated user clicks the "Bookmark / Save" icon on a scheme card.
2. **System Action**:
   - Creates a new record in `SavedScheme` table linked to the user's account.
   - Stores optional user notes or status tags (e.g., "Documents Pending", "Applied").
3. **Result**: Bookmark icon toggles to filled state, toast notification confirms "Saved to My Schemes", and the scheme appears under the user's "Saved Schemes" tab.

---

### Journey I: Report Outdated or Incorrect Information

1. **User Action**: User notices a broken official URL or outdated income threshold on a scheme page and clicks "Report Outdated Info".
2. **System Action**:
   - Displays a feedback modal with options: "Broken Link", "Outdated Benefit Amount", "Incorrect Eligibility Rule", "Other".
   - Captures user's text notes, current scheme ID, and user ID.
   - Writes a pending `Feedback` and `SchemeUpdate` record for admin review.
3. **Result**: System displays a confirmation toast: *"Thank you. Your report has been submitted to government data verifiers for review."*
