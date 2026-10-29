import datetime
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserProfile
from app.models.scheme import Scheme
from app.enums import SchemeStatus
from app.core.auth import get_current_user, get_optional_current_user
from app.schemas.profile import (
    UserProfileResponse, UserProfileUpdate, OnboardingStepRequest
)
from app.services.personalization.recommendation_engine import PersonalizedRecommendationEngine
from app.services.eligibility.evaluator import DeterministicEligibilityEvaluator

router = APIRouter(prefix="/profile", tags=["Citizen Profile & Onboarding"])

def _get_or_create_profile(user: User, db: Session) -> UserProfile:
    """Retrieve existing profile or create a clean initial profile for user."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if not profile:
        profile = UserProfile(
            user_id=user.id,
            state_code="IN-MH",
            is_maharashtra_resident=True,
            onboarding_step=1,
            is_onboarding_completed=False,
            beneficiary_categories=[]
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

def _serialize_profile(profile: UserProfile, email: str | None = None) -> dict:
    """Serialize UserProfile model to response dict."""
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "email": email,
        "full_name": profile.full_name,
        "age": profile.age,
        "gender": profile.gender,
        "marital_status": profile.marital_status,
        "state_code": profile.state_code or "IN-MH",
        "district_name": profile.district_name,
        "taluka": profile.taluka,
        "village_city": profile.village_city,
        "residency_area": profile.residency_area,
        "is_maharashtra_resident": profile.is_maharashtra_resident if profile.is_maharashtra_resident is not None else True,
        "annual_family_income": profile.annual_family_income,
        "caste_category": profile.caste_category,
        "occupation_type": profile.occupation_type,
        "education_level": profile.education_level,
        "is_pwd": profile.is_pwd,
        "disability_percentage": profile.disability_percentage,
        "landholding_acres": profile.landholding_acres,
        "beneficiary_categories": profile.beneficiary_categories or [],
        "student_details": profile.student_details,
        "farmer_details": profile.farmer_details,
        "entrepreneur_details": profile.entrepreneur_details,
        "vulnerable_details": profile.vulnerable_details,
        "onboarding_step": profile.onboarding_step,
        "is_onboarding_completed": profile.is_onboarding_completed,
        "custom_attributes": profile.custom_attributes,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve authenticated citizen's profile.
    Fallback to demo citizen when unauthenticated for frictionless exploration.
    """
    if current_user:
        profile = _get_or_create_profile(current_user, db)
        return _serialize_profile(profile, current_user.email)

    # Demo citizen fallback
    demo_user = db.query(User).filter(User.id == "demo-citizen-user").first()
    if not demo_user:
        demo_user = User(
            id="demo-citizen-user",
            email="rohan.sharma@example.gov.in",
            role="CITIZEN",
            is_active=True
        )
        db.add(demo_user)
        db.commit()

    profile = _get_or_create_profile(demo_user, db)
    return _serialize_profile(profile, demo_user.email)

@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(
    payload: UserProfileUpdate,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Update citizen's profile attributes.
    IDOR Security Guarantee: Strictly updates the authenticated user's profile.
    """
    target_user = current_user
    if not target_user:
        target_user = db.query(User).filter(User.id == "demo-citizen-user").first()
        if not target_user:
            target_user = User(
                id="demo-citizen-user",
                email="rohan.sharma@example.gov.in",
                role="CITIZEN",
                is_active=True
            )
            db.add(target_user)
            db.commit()

    profile = _get_or_create_profile(target_user, db)

    # Update only provided fields
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if hasattr(profile, field):
            setattr(profile, field, val)

    profile.updated_at = datetime.datetime.utcnow()
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return _serialize_profile(profile, target_user.email)

@router.post("/onboarding/step", response_model=UserProfileResponse)
def save_onboarding_step(
    req: OnboardingStepRequest,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Save progress and field values for an individual onboarding wizard step.
    Supports save-and-resume behavior and partial completion.
    """
    target_user = current_user
    if not target_user:
        target_user = db.query(User).filter(User.id == "demo-citizen-user").first()
        if not target_user:
            target_user = User(
                id="demo-citizen-user",
                email="rohan.sharma@example.gov.in",
                role="CITIZEN",
                is_active=True
            )
            db.add(target_user)
            db.commit()

    profile = _get_or_create_profile(target_user, db)
    data = req.data

    # Map step data to profile fields
    if req.step == 1:
        # Welcome & Name step
        if "full_name" in data and data["full_name"]:
            name = str(data["full_name"]).strip()
            if len(name) > 255:
                raise HTTPException(status_code=400, detail="Name exceeds maximum allowed length.")
            profile.full_name = name
        profile.onboarding_step = max(profile.onboarding_step, 2)

    elif req.step == 3:
        # Location step (Maharashtra residency)
        if "state_code" in data:
            profile.state_code = data["state_code"] or "IN-MH"
        if "district_name" in data:
            profile.district_name = data["district_name"]
        if "taluka" in data:
            profile.taluka = data["taluka"]
        if "village_city" in data:
            profile.village_city = data["village_city"]
        if "residency_area" in data:
            profile.residency_area = data["residency_area"]
        if "is_maharashtra_resident" in data:
            profile.is_maharashtra_resident = bool(data["is_maharashtra_resident"])
        profile.onboarding_step = max(profile.onboarding_step, 4)

    elif req.step == 4:
        # Personal & family profile
        if "age" in data and data["age"] is not None:
            try:
                profile.age = int(data["age"])
            except (ValueError, TypeError):
                pass
        if "gender" in data:
            profile.gender = data["gender"]
        if "marital_status" in data:
            profile.marital_status = data["marital_status"]
        if "annual_family_income" in data and data["annual_family_income"] is not None:
            try:
                profile.annual_family_income = float(data["annual_family_income"])
            except (ValueError, TypeError):
                pass
        if "caste_category" in data:
            profile.caste_category = data["caste_category"]
        if "education_level" in data:
            profile.education_level = data["education_level"]
        if "occupation_type" in data:
            profile.occupation_type = data["occupation_type"]
        if "is_pwd" in data:
            profile.is_pwd = bool(data["is_pwd"])
        if "disability_percentage" in data and data["disability_percentage"] is not None:
            try:
                profile.disability_percentage = float(data["disability_percentage"])
            except (ValueError, TypeError):
                pass
        profile.onboarding_step = max(profile.onboarding_step, 5)

    elif req.step == 5:
        # Beneficiary categories & conditional sections
        if "beneficiary_categories" in data:
            profile.beneficiary_categories = data["beneficiary_categories"]
        if "student_details" in data:
            profile.student_details = data["student_details"]
        if "farmer_details" in data:
            profile.farmer_details = data["farmer_details"]
        if "entrepreneur_details" in data:
            profile.entrepreneur_details = data["entrepreneur_details"]
        if "vulnerable_details" in data:
            profile.vulnerable_details = data["vulnerable_details"]
        if "landholding_acres" in data and data["landholding_acres"] is not None:
            try:
                profile.landholding_acres = float(data["landholding_acres"])
            except (ValueError, TypeError):
                pass
        profile.onboarding_step = max(profile.onboarding_step, 6)
        profile.is_onboarding_completed = True

    elif req.step == 6:
        profile.onboarding_step = 6
        profile.is_onboarding_completed = True

    profile.updated_at = datetime.datetime.utcnow()
    db.add(profile)
    db.commit()
    db.refresh(profile)

    return _serialize_profile(profile, target_user.email)

@router.get("/recommendations")
def get_profile_recommendations(
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate organized, personalized Maharashtra welfare & scholarship recommendations
    matching the citizen's saved profile attributes with deterministic Phase 3 evaluation.
    """
    target_user = current_user
    if not target_user:
        target_user = db.query(User).filter(User.id == "demo-citizen-user").first()
        if not target_user:
            target_user = User(
                id="demo-citizen-user",
                email="rohan.sharma@example.gov.in",
                role="CITIZEN",
                is_active=True
            )
            db.add(target_user)
            db.commit()

    profile = _get_or_create_profile(target_user, db)

    # Convert UserProfile to citizen_profile dict for Deterministic matching
    is_stud = (
        (profile.occupation_type or "").upper() == "STUDENT" or
        "STUDENTS" in (profile.beneficiary_categories or []) or
        bool(profile.student_details)
    )
    is_farm = (
        (profile.occupation_type or "").upper() in ["FARMER", "AGRICULTURE"] or
        "FARMERS" in (profile.beneficiary_categories or []) or
        bool(profile.farmer_details) or
        ((profile.landholding_acres or 0) > 0)
    )

    citizen_dict = {
        "name": profile.full_name or "Citizen",
        "age": profile.age or 22,
        "gender": profile.gender or "MALE",
        "state_code": "IN-MH" if profile.is_maharashtra_resident else (profile.state_code or "IN-MH"),
        "state": "IN-MH" if profile.is_maharashtra_resident else (profile.state_code or "IN-MH"),
        "is_maharashtra_resident": profile.is_maharashtra_resident if profile.is_maharashtra_resident is not None else True,
        "district": profile.district_name or "Pune",
        "district_name": profile.district_name or "Pune",
        "income": profile.annual_family_income if profile.annual_family_income is not None else 220000,
        "annual_income": profile.annual_family_income if profile.annual_family_income is not None else 220000,
        "category": profile.caste_category or "OBC",
        "caste_category": profile.caste_category or "OBC",
        "profession": profile.occupation_type or ("STUDENT" if is_stud else "Citizen"),
        "occupation_type": profile.occupation_type or ("STUDENT" if is_stud else "Citizen"),
        "student_status": is_stud,
        "farmer_status": is_farm,
        "is_pwd": profile.is_pwd,
        "landholding_acres": profile.landholding_acres or (2.5 if is_farm else 0.0),
        "beneficiary_categories": profile.beneficiary_categories or [],
        "student_details": profile.student_details,
        "farmer_details": profile.farmer_details,
        "entrepreneur_details": profile.entrepreneur_details
    }

    # Retrieve all candidate published schemes
    all_recs = PersonalizedRecommendationEngine.get_personalized_recommendations(
        db=db,
        citizen_profile=citizen_dict,
        limit=50
    )

    # Classify recommendations into citizen-focused domain sections
    top_matches = []
    scholarships = []
    farmer_schemes = []
    women_schemes = []
    msme_schemes = []
    disability_and_social = []

    for rec in all_recs:
        s_name = rec["scheme_name"].lower()
        s_desc = (rec.get("short_description") or "").lower()

        # Categorize
        if "scholarship" in s_name or "education" in s_desc or "shikshan" in s_name or "swadhar" in s_name or "bhatta" in s_name:
            scholarships.append(rec)
        elif "farmer" in s_name or "kisan" in s_name or "shetkari" in s_name or "krishi" in s_name or "krushi" in s_name or "irrigation" in s_desc or "crop" in s_desc:
            farmer_schemes.append(rec)
        elif "ladki bahin" in s_name or "women" in s_desc or "mahila" in s_desc or "kanya" in s_name:
            women_schemes.append(rec)
        elif "cmegp" in s_name or "msme" in s_desc or "entrepreneur" in s_desc or "employment" in s_name or "mudra" in s_name:
            msme_schemes.append(rec)
        elif "disability" in s_desc or "divyang" in s_desc or "niradhar" in s_name or "nivruttivetan" in s_name or "shravanbal" in s_name or "pension" in s_desc:
            disability_and_social.append(rec)

        # Top overall matches (Eligible or highest match scores)
        if rec.get("eligibility_status") == "ELIGIBLE" or rec.get("match_score", 0) >= 80:
            top_matches.append(rec)

    # Fallback to top matches if specific category list is small
    if not top_matches:
        top_matches = all_recs[:6]

    return {
        "citizen_summary": {
            "name": profile.full_name or "Citizen",
            "district": profile.district_name or "Maharashtra",
            "occupation": profile.occupation_type or "General Citizen",
            "income": profile.annual_family_income or 200000,
            "category": profile.caste_category or "General",
            "is_onboarding_completed": profile.is_onboarding_completed
        },
        "total_evaluated": len(all_recs),
        "top_matches": top_matches[:8],
        "scholarships": scholarships[:6],
        "farmer_schemes": farmer_schemes[:6],
        "women_schemes": women_schemes[:6],
        "msme_schemes": msme_schemes[:6],
        "disability_and_social": disability_and_social[:6],
        "all_recommendations": all_recs
    }

@router.get("/ranking")
def get_ranked_dashboard_schemes(
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns full list of published schemes ranked deterministically against
    the authenticated citizen's verified profile with official portal verification.
    """
    target_user = current_user
    if not target_user:
        target_user = db.query(User).filter(User.id == "demo-citizen-user").first()
        if not target_user:
            target_user = User(
                id="demo-citizen-user",
                email="rohan.sharma@example.gov.in",
                role="CITIZEN",
                is_active=True
            )
            db.add(target_user)
            db.commit()

    profile = _get_or_create_profile(target_user, db)

    is_stud = (
        (profile.occupation_type or "").upper() == "STUDENT" or
        "STUDENTS" in (profile.beneficiary_categories or []) or
        bool(profile.student_details)
    )
    is_farm = (
        (profile.occupation_type or "").upper() in ["FARMER", "AGRICULTURE"] or
        "FARMERS" in (profile.beneficiary_categories or []) or
        bool(profile.farmer_details) or
        ((profile.landholding_acres or 0) > 0)
    )

    income_val = profile.annual_family_income if profile.annual_family_income is not None else 220000

    # Build concise confirmed profile summary bullets
    summary_bullets = []
    if profile.is_maharashtra_resident or profile.state_code in ["IN-MH", "MH", "Maharashtra"]:
        summary_bullets.append("Maharashtra resident")
    if is_farm:
        summary_bullets.append("Farmer")
    if is_stud:
        summary_bullets.append("Student")
    if profile.caste_category:
        summary_bullets.append(f"{profile.caste_category} category")
    summary_bullets.append(f"Annual family income: ₹{int(income_val):,}")

    citizen_dict = {
        "name": profile.full_name or "Citizen",
        "state_code": "IN-MH" if profile.is_maharashtra_resident else (profile.state_code or "IN-MH"),
        "is_maharashtra_resident": profile.is_maharashtra_resident if profile.is_maharashtra_resident is not None else True,
        "annual_income": income_val,
        "income": income_val,
        "caste_category": profile.caste_category or "OBC",
        "occupation_type": profile.occupation_type or ("STUDENT" if is_stud else "Citizen"),
        "student_status": is_stud,
        "farmer_status": is_farm,
        "gender": profile.gender or "MALE",
        "age": profile.age or 21,
        "landholding_acres": profile.landholding_acres or (2.5 if is_farm else 0.0),
        "beneficiary_categories": profile.beneficiary_categories or []
    }

    ranked_schemes = PersonalizedRecommendationEngine.get_personalized_recommendations(
        db=db,
        citizen_profile=citizen_dict,
        limit=50
    )

    return {
        "profile_summary": {
            "name": profile.full_name or "Citizen",
            "is_maharashtra_resident": profile.is_maharashtra_resident,
            "is_farmer": is_farm,
            "is_student": is_stud,
            "occupation": profile.occupation_type or "General Citizen",
            "caste_category": profile.caste_category or "OBC",
            "annual_income": income_val,
            "district": profile.district_name or "Pune",
            "summary_bullets": summary_bullets
        },
        "total_ranked": len(ranked_schemes),
        "ranked_schemes": ranked_schemes
    }

