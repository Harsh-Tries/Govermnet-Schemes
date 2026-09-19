from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Scheme, UserProfile, EligibilityParameter
from app.schemas.intelligence import (
    SchemeEvaluationResult, MatchingResponse, ProfileCompletenessResponse
)
from app.services.eligibility.evaluator import DeterministicEligibilityEvaluator
from app.services.eligibility.explanation import ExplanationGenerator
from app.services.eligibility.completeness import ProfileCompletenessService
from app.services.eligibility.matching import SchemeMatchingEngine

router = APIRouter()

# 1. Evaluate one scheme against supplied or authenticated user profile
@router.post("/eligibility/evaluate/{scheme_id}", response_model=SchemeEvaluationResult)
def evaluate_single_scheme(
    scheme_id: str,
    profile: dict[str, Any] | None = None,
    db: Session = Depends(get_db)
):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    profile_data = profile or {}
    
    params = db.query(EligibilityParameter).all()
    param_map = {p.name: p for p in params}

    res = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile_data, param_map)
    res.explanations = ExplanationGenerator.generate_explanations(res)
    return res

# 2. Evaluate supplied profile against explicit scheme rules payload
@router.post("/eligibility/evaluate", response_model=SchemeEvaluationResult)
def evaluate_supplied_profile(
    payload: dict[str, Any],
    db: Session = Depends(get_db)
):
    scheme_id = payload.get("scheme_id")
    profile_data = payload.get("profile", {})
    
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    params = db.query(EligibilityParameter).all()
    param_map = {p.name: p for p in params}

    res = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile_data, param_map)
    res.explanations = ExplanationGenerator.generate_explanations(res)
    return res

# 3. Multi-scheme matching service
@router.post("/matching", response_model=MatchingResponse)
def match_published_schemes(
    profile: dict[str, Any],
    state: str | None = Query(None),
    category_id: str | None = Query(None),
    beneficiary_id: str | None = Query(None),
    profession_id: str | None = Query(None),
    include_all_statuses: bool = Query(False),
    db: Session = Depends(get_db)
):
    return SchemeMatchingEngine.match_schemes(
        db=db,
        profile_data=profile,
        filter_state=state,
        filter_category_id=category_id,
        filter_beneficiary_id=beneficiary_id,
        filter_profession_id=profession_id,
        include_all_statuses=include_all_statuses
    )

# 4. Profile completeness service
@router.get("/profile/completeness", response_model=ProfileCompletenessResponse)
def get_profile_completeness(
    state_code: str | None = None,
    age: int | None = None,
    annual_income: float | None = None,
    occupation_type: str | None = None,
    db: Session = Depends(get_db)
):
    profile_data = {}
    if state_code: profile_data["state_code"] = state_code
    if age is not None: profile_data["age"] = age
    if annual_income is not None: profile_data["annual_family_income"] = annual_income
    if occupation_type: profile_data["occupation_type"] = occupation_type

    published_schemes = db.query(Scheme).filter(Scheme.status == "PUBLISHED").all()
    return ProfileCompletenessService.calculate_completeness(profile_data, published_schemes)

# 5. Get human-readable eligibility requirements explanation for a scheme
@router.get("/schemes/{scheme_id}/eligibility-explanation")
def get_scheme_eligibility_explanation(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    # Run dummy empty evaluation to generate base requirements list
    dummy_res = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, {})
    return {
        "scheme_id": scheme.id,
        "scheme_name": scheme.name,
        "required_parameters": dummy_res.missing_information,
        "rule_count": len(dummy_res.satisfied_conditions) + len(dummy_res.failed_conditions) + len(dummy_res.missing_information)
    }
