import sys
import os
import pytest
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.models.user import User, UserProfile
from app.enums import UserRole
from app.core.security import verify_password, create_access_token
from app.api.v1.endpoints.auth import register_citizen, login, RegisterRequest, LoginRequest
from app.api.v1.endpoints.profile import (
    get_my_profile, update_my_profile, save_onboarding_step, get_profile_recommendations
)
from app.schemas.profile import UserProfileUpdate, OnboardingStepRequest
from database.seeds.maharashtra_schemes import seed_maharashtra_knowledge_base

@pytest.fixture(autouse=True)
def seed_test_database(db_session):
    seed_maharashtra_knowledge_base(db_session)

def test_citizen_registration_and_password_hashing(db_session):
    """Verify citizen registration creates hashed credentials and enforced CITIZEN role."""
    reg_req = RegisterRequest(
        email="aarav.patil@example.com",
        password="SecurePassword123!",
        full_name="Aarav Patil",
        role="ADMIN"  # Malicious attempt to self-elevate
    )

    resp = register_citizen(payload=reg_req, db=db_session)
    assert resp.access_token is not None
    assert resp.user["email"] == "aarav.patil@example.com"
    # Role MUST be CITIZEN despite malicious request
    assert resp.user["role"] == UserRole.CITIZEN.value
    assert resp.user["full_name"] == "Aarav Patil"

    # Verify password was hashed, not plaintext
    user_db = db_session.query(User).filter(User.email == "aarav.patil@example.com").first()
    assert user_db is not None
    assert user_db.password_hash != "SecurePassword123!"
    assert verify_password("SecurePassword123!", user_db.password_hash) is True

    # Verify profile was initialized
    prof = db_session.query(UserProfile).filter(UserProfile.user_id == user_db.id).first()
    assert prof is not None
    assert prof.full_name == "Aarav Patil"
    assert prof.state_code == "IN-MH"
    assert prof.is_maharashtra_resident is True

def test_citizen_login_flow(db_session):
    """Verify login authentication with correct and incorrect credentials."""
    # Register first
    reg_req = RegisterRequest(
        email="priya.deshmukh@example.com",
        password="MySecretPassword456!",
        full_name="Priya Deshmukh"
    )
    register_citizen(payload=reg_req, db=db_session)

    # 1. Successful login
    login_req = LoginRequest(email="priya.deshmukh@example.com", password="MySecretPassword456!")
    login_resp = login(payload=login_req, db=db_session)
    assert login_resp.access_token is not None
    assert login_resp.user["full_name"] == "Priya Deshmukh"

    # 2. Failed login with wrong password
    bad_req = LoginRequest(email="priya.deshmukh@example.com", password="WrongPassword!")
    with pytest.raises(Exception):
        login(payload=bad_req, db=db_session)

def test_onboarding_step_by_step_wizard(db_session):
    """Verify multi-step onboarding progression and partial save-and-resume."""
    # Create citizen user
    user = User(
        email="suresh.kulkarni@example.com",
        role="CITIZEN",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Step 1: Welcome & Name
    s1 = save_onboarding_step(
        req=OnboardingStepRequest(step=1, data={"full_name": "Suresh Kulkarni"}),
        current_user=user,
        db=db_session
    )
    assert s1["full_name"] == "Suresh Kulkarni"
    assert s1["onboarding_step"] >= 2
    assert s1["is_onboarding_completed"] is False

    # Step 3: Location / Maharashtra residency
    s3 = save_onboarding_step(
        req=OnboardingStepRequest(step=3, data={
            "state_code": "IN-MH",
            "district_name": "Kolhapur",
            "taluka": "Karvir",
            "village_city": "Kolhapur City",
            "residency_area": "URBAN",
            "is_maharashtra_resident": True
        }),
        current_user=user,
        db=db_session
    )
    assert s3["district_name"] == "Kolhapur"
    assert s3["taluka"] == "Karvir"
    assert s3["is_maharashtra_resident"] is True
    assert s3["onboarding_step"] >= 4

    # Step 4: Personal profile
    s4 = save_onboarding_step(
        req=OnboardingStepRequest(step=4, data={
            "age": 21,
            "gender": "MALE",
            "annual_family_income": 180000,
            "caste_category": "OBC",
            "education_level": "GRADUATE",
            "occupation_type": "STUDENT"
        }),
        current_user=user,
        db=db_session
    )
    assert s4["age"] == 21
    assert s4["annual_family_income"] == 180000.0
    assert s4["caste_category"] == "OBC"
    assert s4["occupation_type"] == "STUDENT"
    assert s4["onboarding_step"] >= 5

    # Step 5: Beneficiary categories & conditional details
    s5 = save_onboarding_step(
        req=OnboardingStepRequest(step=5, data={
            "beneficiary_categories": ["STUDENT"],
            "student_details": {
                "course": "B.Tech Computer Science",
                "institution_type": "GOVERNMENT_AIDED",
                "academic_year": "3rd Year"
            }
        }),
        current_user=user,
        db=db_session
    )
    assert "STUDENT" in s5["beneficiary_categories"]
    assert s5["student_details"]["course"] == "B.Tech Computer Science"
    assert s5["onboarding_step"] == 6
    assert s5["is_onboarding_completed"] is True

def test_personalized_scheme_recommendations_for_onboarded_citizen(db_session):
    """Verify personalized recommendations categorize student, farmer, and top matches."""
    # Create citizen student user
    student_user = User(
        email="ananya.shinde@example.com",
        role="CITIZEN",
        is_active=True
    )
    db_session.add(student_user)
    db_session.commit()
    db_session.refresh(student_user)

    prof = UserProfile(
        user_id=student_user.id,
        full_name="Ananya Shinde",
        age=20,
        gender="FEMALE",
        state_code="IN-MH",
        district_name="Pune",
        annual_family_income=200000,
        caste_category="EBC",
        occupation_type="STUDENT",
        beneficiary_categories=["STUDENT", "WOMAN"],
        is_onboarding_completed=True
    )
    db_session.add(prof)
    db_session.commit()

    recs = get_profile_recommendations(current_user=student_user, db=db_session)
    assert recs["citizen_summary"]["name"] == "Ananya Shinde"
    assert recs["total_evaluated"] > 0
    assert len(recs["top_matches"]) > 0

    # Must contain scholarships section with genuine student scholarships
    assert len(recs["scholarships"]) > 0
    scholarship_names = [s["scheme_name"].lower() for s in recs["scholarships"]]
    assert any("shahu maharaj" in name or "scholarship" in name for name in scholarship_names)
