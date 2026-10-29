"""
Comprehensive Automated Test Suite for:
1. Working, Verified Official Government Application Links & Portal Security.
2. Deterministic Personalized Ranking Prioritizing Farmer and OBC Student Schemes
   for Maharashtra Residents (Annual Family Income: ₹2,20,000).
"""

import pytest
from app.models.user import User, UserProfile
from app.enums import UserRole
from app.core.security import create_access_token
from app.services.portal.portal_verifier import PortalVerifier
from app.services.personalization.ranking_service import SchemeRankingService
from database.seeds.maharashtra_schemes import seed_maharashtra_knowledge_base
from app.db.seed_obc_and_portals import sync_maharashtra_schemes_and_portals
from app.api.v1.endpoints.profile import get_ranked_dashboard_schemes

@pytest.fixture(autouse=True)
def seed_test_database(db_session):
    seed_maharashtra_knowledge_base(db_session)
    sync_maharashtra_schemes_and_portals(db_session)


# =============================================================================
# 1. TEST MAHARASHTRA FARMER WITH INCOME ₹2,20,000
# =============================================================================
def test_maharashtra_farmer_income_220k(db_session):
    """
    Evaluates a verified Maharashtra farmer with annual family income of ₹2,20,000.
    Must rank farmer DBT schemes (Namo Shetkari, PM-KISAN, Krishi mechanization)
    at the top with appropriate CHECK_REQUIRED status explaining 7/12 land records.
    """
    farmer_profile = {
        "state_code": "IN-MH",
        "is_maharashtra_resident": True,
        "occupation_type": "FARMER",
        "farmer_status": True,
        "annual_income": 220000,
        "caste_category": "OPEN",
        "landholding_acres": 2.5,
        "beneficiary_categories": ["FARMERS"]
    }

    ranked = SchemeRankingService.rank_schemes_for_citizen(db_session, farmer_profile, limit=10)
    top_slugs = [r["slug"] for r in ranked[:4]]

    assert any("namo-shetkari" in slug for slug in top_slugs), "Namo Shetkari should be among top farmer recommendations"
    assert any("pm-kisan" in slug for slug in top_slugs), "PM-KISAN should be among top farmer recommendations"

    # Verify transparent explanations
    nsmny = next(r for r in ranked if "namo-shetkari" in r["slug"])
    assert nsmny["eligibility_status"] == "CHECK_REQUIRED"
    assert any("PM-KISAN" in f for f in nsmny["explanation_factors"])
    assert nsmny["match_score"] > 60


# =============================================================================
# 2. TEST OBC STUDENT WITH INCOME ₹2,20,000
# =============================================================================
def test_obc_student_income_220k(db_session):
    """
    Evaluates an OBC student with annual family income of ₹2,20,000 in Maharashtra.
    Must rank Tuition Fees to OBC Students (MahaDBT 2.0) at the top as ELIGIBLE,
    and correctly mark Post-Matric OBC full scholarship as NOT_ELIGIBLE (since income > ₹1.5L).
    """
    obc_student_profile = {
        "state_code": "IN-MH",
        "is_maharashtra_resident": True,
        "occupation_type": "STUDENT",
        "student_status": True,
        "caste_category": "OBC",
        "annual_income": 220000,
        "beneficiary_categories": ["STUDENTS"]
    }

    ranked = SchemeRankingService.rank_schemes_for_citizen(db_session, obc_student_profile, limit=10)
    
    # 1. Tuition Fees to OBC Students must be #1 or at top as ELIGIBLE
    top_scheme = ranked[0]
    assert "obc" in top_scheme["slug"].lower()
    assert top_scheme["eligibility_status"] == "ELIGIBLE"
    assert "8,00,000" in " ".join(top_scheme["explanation_factors"])
    assert top_scheme["match_score"] >= 85

    # 2. Post-Matric OBC Maintenance Allowance should fail income threshold (> ₹1.5L)
    post_matric = next(r for r in ranked if r["slug"] == "post-matric-scholarship-vjnt-obc-sbc-maharashtra")
    assert post_matric["eligibility_status"] == "NOT_ELIGIBLE"
    assert "1,50,000" in " ".join(post_matric["explanation_factors"])


# =============================================================================
# 3. TEST CITIZEN WHO IS BOTH A FARMER AND AN OBC STUDENT (TARGET PROFILE)
# =============================================================================
def test_citizen_both_farmer_and_obc_student(db_session):
    """
    Evaluates target persona: Maharashtra resident, Student & Farming family, OBC, ₹2,20,000 income.
    Top schemes must prioritize:
    1. Tuition Fees and Examination Fees to OBC Students (MahaDBT 2.0)
    2. Dr. Panjabrao Deshmukh Vasatgruh Nirvah Bhatta Yojna (for farmer children in higher ed)
    3. Namo Shetkari Mahasanman Nidhi Yojana
    4. PM-KISAN
    """
    combo_profile = {
        "state_code": "IN-MH",
        "is_maharashtra_resident": True,
        "occupation_type": "STUDENT",
        "student_status": True,
        "farmer_status": True,
        "caste_category": "OBC",
        "annual_income": 220000,
        "landholding_acres": 2.5,
        "beneficiary_categories": ["STUDENTS", "FARMERS"]
    }

    ranked = SchemeRankingService.rank_schemes_for_citizen(db_session, combo_profile, limit=10)
    top_slugs = [r["slug"] for r in ranked[:5]]

    assert "tuition-fees-and-examination-fees-to-obc-students" in top_slugs
    assert "dr-panjabrao-deshmukh-vasatgruh-nirvah-bhatta" in top_slugs
    assert any("namo-shetkari" in s for s in top_slugs)
    assert any("pm-kisan" in s for s in top_slugs)


# =============================================================================
# 4. TEST MISSING COURSE OR ADMISSION DETAILS
# =============================================================================
def test_missing_course_details_reports_review_needed(db_session):
    """
    For Dr. Panjabrao Deshmukh scheme, when CAP admission or course details
    are unconfirmed, engine must report CHECK_REQUIRED and explain review requirements.
    """
    profile = {
        "state_code": "IN-MH",
        "occupation_type": "STUDENT",
        "student_status": True,
        "farmer_status": True,
        "caste_category": "OBC",
        "annual_income": 220000
    }

    ranked = SchemeRankingService.rank_schemes_for_citizen(db_session, profile, limit=10)
    panjabrao = next(r for r in ranked if "panjabrao" in r["slug"])

    assert panjabrao["eligibility_status"] == "CHECK_REQUIRED"
    assert any("CAP" in f or "Alpabhudharak" in f for f in panjabrao["explanation_factors"])


# =============================================================================
# 5. TEST SCHEME WITH MATCHING INCOME BUT MISMATCHED CATEGORY
# =============================================================================
def test_matching_income_mismatched_category_not_eligible(db_session):
    """
    Rajarshi Chhatrapati Shahu Maharaj (EBC) has ₹8L cap (which ₹2.2L satisfies),
    but an OBC student must NOT qualify for EBC because EBC is for Open/General/EWS.
    Also SC/ST scholarships must report NOT_ELIGIBLE.
    """
    obc_profile = {
        "state_code": "IN-MH",
        "occupation_type": "STUDENT",
        "student_status": True,
        "caste_category": "OBC",
        "annual_income": 220000
    }

    ranked = SchemeRankingService.rank_schemes_for_citizen(db_session, obc_profile, limit=50)
    
    # 1. EBC scheme must be NOT_ELIGIBLE
    ebc = next(r for r in ranked if "ebc" in r["slug"])
    assert ebc["eligibility_status"] == "NOT_ELIGIBLE"
    assert any("Open" in f or "General" in f or "OBC" in f for f in ebc["explanation_factors"])

    # 2. SC post-matric must be NOT_ELIGIBLE
    sc_scheme = next(r for r in ranked if "-sc-" in r["slug"])
    assert sc_scheme["eligibility_status"] == "NOT_ELIGIBLE"
    assert any("Scheduled Caste" in f or "SC" in f for f in sc_scheme["explanation_factors"])


# =============================================================================
# 6. TEST SCHEME WITH UNVERIFIED OR MISSING APPLICATION URL
# =============================================================================
def test_unverified_application_url_handling():
    """
    PortalVerifier must flag unverified, missing, or non-gov URLs properly.
    """
    meta_none = PortalVerifier.get_portal_metadata(None)
    assert meta_none["is_verified"] is False
    assert meta_none["clean_url"] is None

    meta_invalid = PortalVerifier.get_portal_metadata("https://random-commercial-site.com/apply")
    assert meta_invalid["is_verified"] is False

    meta_valid = PortalVerifier.get_portal_metadata("https://mahadbt2.maharashtra.gov.in/")
    assert meta_valid["is_verified"] is True
    assert meta_valid["is_safe"] is True
    assert "MahaDBT 2.0" in meta_valid["portal_name"]


# =============================================================================
# 7. TEST PREVENTION OF UNSAFE EXTERNAL URLS (XSS / JAVASCRIPT INJECTION)
# =============================================================================
def test_prevention_of_unsafe_external_urls():
    """
    Strictly reject javascript:, data:, vbscript:, and file: schemes.
    """
    unsafe_urls = [
        "javascript:alert(1)",
        "javascript:fetch('//evil.com')",
        "data:text/html,<script>window.location='evil.com'</script>",
        "vbscript:msgbox(1)",
        "file:///C:/Windows/System32"
    ]
    for url in unsafe_urls:
        assert PortalVerifier.is_safe_url(url) is False
        meta = PortalVerifier.get_portal_metadata(url)
        assert meta["is_safe"] is False
        assert meta["is_verified"] is False


# =============================================================================
# 8. TEST CORRECT APPLY PORTAL DESTINATIONS
# =============================================================================
def test_correct_apply_portal_destinations(db_session):
    """
    Verify authentic government destinations for key schemes:
    - MahaDBT 2.0: https://mahadbt2.maharashtra.gov.in
    - PM-KISAN: https://pmkisan.gov.in
    - Krishi Maharashtra: https://krishi.maharashtra.gov.in
    - DTE Maharashtra: https://dte.maharashtra.gov.in
    """
    profile = {
        "state_code": "IN-MH",
        "occupation_type": "STUDENT",
        "student_status": True,
        "farmer_status": True,
        "caste_category": "OBC",
        "annual_income": 220000
    }

    ranked = SchemeRankingService.rank_schemes_for_citizen(db_session, profile, limit=20)
    
    obc_tuition = next(r for r in ranked if "tuition-fees" in r["slug"])
    assert "mahadbt2.maharashtra.gov.in" in obc_tuition["official_url"]
    assert "MahaDBT 2.0" in obc_tuition["portal_name"]

    pmk = next(r for r in ranked if "pm-kisan" in r["slug"])
    assert "pmkisan.gov.in" in pmk["official_url"]

    nsmny = next(r for r in ranked if "namo-shetkari" in r["slug"])
    assert "krishi.maharashtra.gov.in" in nsmny["official_url"]


# =============================================================================
# 9. TEST NO HARDCODED MATCH SCORES
# =============================================================================
def test_no_hardcoded_match_scores(db_session):
    """
    Scores must vary dynamically across schemes based on rule evaluation
    and component weights (no constant 65% across all items).
    """
    profile = {
        "state_code": "IN-MH",
        "occupation_type": "STUDENT",
        "student_status": True,
        "farmer_status": True,
        "caste_category": "OBC",
        "annual_income": 220000
    }

    ranked = SchemeRankingService.rank_schemes_for_citizen(db_session, profile, limit=20)
    scores = [r["match_score"] for r in ranked]

    unique_scores = set(scores)
    assert len(unique_scores) >= 3, f"Expected varied dynamic scores, got {unique_scores}"
    assert all(0 <= s <= 100 for s in scores)


# =============================================================================
# 10. TEST ENDPOINT /api/v1/profile/ranking AND AUTHORIZED ACCESS
# =============================================================================
def test_profile_ranking_endpoint_and_idor_protection(db_session):
    """
    Tests GET /api/v1/profile/ranking endpoint returns confirmed summary bullets,
    ranks schemes correctly for authenticated citizen, and enforces profile isolation (IDOR protection).
    """
    # Create test citizen with target profile
    citizen = User(
        email="farmer.obc.student@example.gov.in",
        role=UserRole.CITIZEN.value,
        is_active=True
    )
    db_session.add(citizen)
    db_session.commit()
    db_session.refresh(citizen)

    prof = UserProfile(
        user_id=citizen.id,
        full_name="Sachin Patil",
        state_code="IN-MH",
        is_maharashtra_resident=True,
        district_name="Pune",
        annual_family_income=220000,
        caste_category="OBC",
        occupation_type="STUDENT",
        beneficiary_categories=["STUDENTS", "FARMERS"],
        landholding_acres=2.5,
        is_onboarding_completed=True
    )
    db_session.add(prof)
    db_session.commit()

    # Call ranking endpoint logic directly with authenticated citizen
    data = get_ranked_dashboard_schemes(current_user=citizen, db=db_session)

    assert "profile_summary" in data
    bullets = data["profile_summary"]["summary_bullets"]
    assert "Maharashtra resident" in bullets
    assert "Farmer" in bullets
    assert "Student" in bullets
    assert "OBC category" in bullets
    assert "220,000" in " ".join(bullets)

    ranked = data["ranked_schemes"]
    assert len(ranked) > 0
    top_scheme = ranked[0]
    assert top_scheme["eligibility_status"] in ["ELIGIBLE", "CHECK_REQUIRED"]
    assert "MahaDBT" in (top_scheme["portal_name"] or "") or "krishi" in (top_scheme["official_url"] or "")

    # IDOR Protection: Create another user and verify isolated recommendation results
    other_citizen = User(
        email="other.citizen@example.gov.in",
        role=UserRole.CITIZEN.value,
        is_active=True
    )
    db_session.add(other_citizen)
    db_session.commit()

    other_prof = UserProfile(
        user_id=other_citizen.id,
        full_name="Meena Kamble",
        state_code="IN-MH",
        is_maharashtra_resident=True,
        annual_family_income=120000,
        caste_category="SC",
        occupation_type="STUDENT",
        beneficiary_categories=["STUDENTS"],
        is_onboarding_completed=True
    )
    db_session.add(other_prof)
    db_session.commit()

    other_data = get_ranked_dashboard_schemes(current_user=other_citizen, db=db_session)
    assert other_data["profile_summary"]["name"] == "Meena Kamble"
    assert "SC category" in other_data["profile_summary"]["summary_bullets"]
    # Ensure other citizen's response does not contain Sachin's profile
    assert other_data["profile_summary"]["name"] != "Sachin Patil"
