import sys
import os
import pytest

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
backend_dir = os.path.join(root_dir, 'backend')
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.models.user import User, UserProfile
from app.models.scheme import Scheme
from app.enums import UserRole
from app.api.v1.endpoints.eligibility import (
    match_citizen_eligibility, get_citizen_eligibility, get_scheme_evaluation_reasons
)
from database.seeds.maharashtra_schemes import seed_maharashtra_knowledge_base
from app.db.seed_obc_and_portals import sync_maharashtra_schemes_and_portals

@pytest.fixture(autouse=True)
def seed_test_database(db_session):
    seed_maharashtra_knowledge_base(db_session)
    sync_maharashtra_schemes_and_portals(db_session)

@pytest.fixture
def obc_student_user(db_session):
    user = User(
        id="obc-student-test-uuid",
        email="obc.student@example.gov.in",
        role=UserRole.CITIZEN.value,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    prof = UserProfile(
        user_id=user.id,
        full_name="Harsh Wagh",
        age=21,
        state_code="IN-MH",
        annual_family_income=220000.0,
        occupation_type="STUDENT",
        caste_category="OBC",
        is_pwd=False,
        is_maharashtra_resident=True,
        student_details={"course": "UNDERGRADUATE"}
    )
    db_session.add(prof)
    db_session.commit()
    db_session.refresh(user)
    return user

def test_eligibility_match_endpoint_success(db_session, obc_student_user):
    """Verify POST /api/v1/eligibility/match returns real evaluated schemes and no 404."""
    payload = {
        "profile": {
            "age": 21,
            "state_code": "IN-MH",
            "annual_family_income": 220000,
            "occupation_type": "STUDENT",
            "caste_category": "OBC",
            "is_pwd": False,
            "course_level": "UNDERGRADUATE"
        }
    }

    res = match_citizen_eligibility(payload=payload, current_user=obc_student_user, db=db_session)
    assert res.total_schemes_evaluated > 0
    assert res.eligible_count > 0
    assert len(res.eligible) == res.eligible_count
    assert len(res.not_eligible) == res.not_eligible_count
    assert res.last_evaluated_at is not None

def test_obc_student_qualification(db_session, obc_student_user):
    """Verify OBC student with income ₹2,20,000 qualifies for OBC scholarships."""
    res = match_citizen_eligibility(payload=None, current_user=obc_student_user, db=db_session)

    eligible_names = [s.scheme_name.lower() for s in res.eligible]
    
    # Must qualify for OBC scholarships or student assistance
    obc_qualified = any("obc" in name or "ebc" in name or "panjabrao" in name or "shikshan" in name for name in eligible_names)
    assert obc_qualified, f"Expected OBC student to qualify for OBC or EBC schemes, got: {eligible_names}"

def test_income_ceiling_enforcement(db_session):
    """Verify income above ceiling triggers NOT_ELIGIBLE on income-tested schemes."""
    high_income_profile = {
        "profile": {
            "age": 21,
            "state_code": "IN-MH",
            "annual_family_income": 1500000,  # ₹15,00,000 exceeds ₹8,00,000 ceiling
            "occupation_type": "STUDENT",
            "caste_category": "OBC",
            "is_pwd": False
        }
    }

    res = match_citizen_eligibility(payload=high_income_profile, current_user=None, db=db_session)
    
    # Income-capped scholarship schemes must fail
    not_eligible_names = [s.scheme_name.lower() for s in res.not_eligible]
    has_rejected_scholarship = any("obc" in name or "ebc" in name for name in not_eligible_names)
    assert has_rejected_scholarship, "High income profile should fail income-capped schemes"

def test_missing_mandatory_attribute_unknown_status(db_session):
    """Missing mandatory fields (e.g. empty profile) produces UNKNOWN or NOT_ELIGIBLE outcomes."""
    empty_profile = {"profile": {}}
    res = match_citizen_eligibility(payload=empty_profile, current_user=None, db=db_session)
    assert res.total_schemes_evaluated > 0

def test_scheme_evaluation_reasons_table(db_session, obc_student_user):
    """Verify rule comparison table is populated with condition, citizen value, requirement, and result."""
    # Find an eligible scheme
    match_res = match_citizen_eligibility(payload=None, current_user=obc_student_user, db=db_session)
    assert len(match_res.eligible) > 0
    target_scheme_id = match_res.eligible[0].scheme_id

    reasons = get_scheme_evaluation_reasons(
        scheme_id=target_scheme_id,
        current_user=obc_student_user,
        db=db_session
    )
    assert reasons["scheme_id"] == target_scheme_id
    assert "rules_table" in reasons
    assert len(reasons["rules_table"]) > 0

    row = reasons["rules_table"][0]
    assert "condition" in row
    assert "citizen_value" in row
    assert "required_value" in row
    assert "result" in row
    assert row["result"] in ["PASS", "FAIL", "NEEDS_INFO"]

def test_taxonomies_and_recommendations_populated(db_session, obc_student_user):
    """Verify categories, departments, benefit types, and top recommendations are returned."""
    res = match_citizen_eligibility(payload=None, current_user=obc_student_user, db=db_session)
    assert len(res.categories) >= 5
    assert len(res.departments) >= 5
    assert len(res.benefit_types) >= 2
    assert len(res.recommended_schemes) > 0
    assert len(res.recommended_schemes) <= 5
