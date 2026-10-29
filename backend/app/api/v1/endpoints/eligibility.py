from typing import Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import (
    EligibilityParameter, EligibilityRuleGroup, EligibilityRule, 
    Scheme, AuditLog, User, UserProfile
)
from app.enums import AuditAction, GovernmentLevel
from app.core.auth import get_optional_current_user
from app.schemas.eligibility import (
    ParameterCreate, ParameterResponse,
    RuleGroupCreate, RuleGroupResponse
)
from app.schemas.intelligence import MatchingResponse, SchemeEvaluationResult
from app.services.eligibility.matching import SchemeMatchingEngine
from app.services.eligibility.evaluator import DeterministicEligibilityEvaluator
from app.services.eligibility.explanation import ExplanationGenerator

router = APIRouter()

# Eligibility Parameters
@router.get("/eligibility-parameters", response_model=list[ParameterResponse])
def list_eligibility_parameters(db: Session = Depends(get_db)):
    return db.query(EligibilityParameter).filter(EligibilityParameter.is_active == True).all()

@router.post("/eligibility-parameters", response_model=ParameterResponse, status_code=status.HTTP_201_CREATED)
def create_eligibility_parameter(payload: ParameterCreate, db: Session = Depends(get_db)):
    existing = db.query(EligibilityParameter).filter(EligibilityParameter.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Parameter name already exists.")
    param = EligibilityParameter(**payload.model_dump())
    db.add(param)
    db.commit()
    db.refresh(param)
    return param

# Scheme Eligibility Rules Storage
@router.get("/schemes/{scheme_id}/eligibility-rules", response_model=list[RuleGroupResponse])
def get_scheme_eligibility_rules(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return db.query(EligibilityRuleGroup).filter(EligibilityRuleGroup.scheme_id == scheme_id).all()

@router.post("/schemes/{scheme_id}/eligibility-rules", response_model=RuleGroupResponse, status_code=status.HTTP_201_CREATED)
def create_scheme_rule_group(scheme_id: str, payload: RuleGroupCreate, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    
    group = EligibilityRuleGroup(
        scheme_id=scheme_id,
        logical_operator=payload.logical_operator,
        parent_group_id=payload.parent_group_id
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    for r_data in payload.rules:
        rule = EligibilityRule(
            group_id=group.id,
            parameter_name=r_data.parameter_name,
            operator=r_data.operator,
            comparison_value=r_data.comparison_value,
            is_mandatory=r_data.is_mandatory,
            failure_message=r_data.failure_message
        )
        db.add(rule)

    db.add(AuditLog(
        action=AuditAction.UPDATE_ELIGIBILITY_RULE,
        target_entity="Scheme",
        target_id=scheme_id,
        payload={"group_id": group.id, "rule_count": len(payload.rules)}
    ))

    db.commit()
    db.refresh(group)
    return group


# ---------------- Deterministic Multi-Scheme Eligibility Matching Endpoints ----------------

def resolve_effective_profile(
    db: Session,
    payload_profile: dict[str, Any] | None,
    current_user: User | None
) -> dict[str, Any]:
    """
    Constructs an effective citizen profile by loading authenticated profile from DB 
    and applying any runtime overrides passed by the user.
    """
    profile: dict[str, Any] = {
        "age": 21,
        "state_code": "IN-MH",
        "annual_family_income": 220000,
        "annual_income": 220000,
        "occupation_type": "STUDENT",
        "caste_category": "OBC",
        "is_pwd": False,
        "course_level": "UNDERGRADUATE"
    }

    user_id = current_user.id if current_user else "demo-citizen-user"
    user_prof = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if user_prof:
        if getattr(user_prof, "age", None) is not None:
            profile["age"] = user_prof.age
        if getattr(user_prof, "state_code", None):
            profile["state_code"] = user_prof.state_code
        if getattr(user_prof, "annual_family_income", None) is not None:
            profile["annual_family_income"] = user_prof.annual_family_income
            profile["annual_income"] = user_prof.annual_family_income
        if getattr(user_prof, "occupation_type", None):
            profile["occupation_type"] = user_prof.occupation_type
        if getattr(user_prof, "caste_category", None):
            profile["caste_category"] = user_prof.caste_category
        if getattr(user_prof, "is_pwd", None) is not None:
            profile["is_pwd"] = user_prof.is_pwd
        if getattr(user_prof, "gender", None):
            profile["gender"] = user_prof.gender
        if hasattr(user_prof, "student_details") and isinstance(user_prof.student_details, dict):
            profile["course_level"] = user_prof.student_details.get("course", profile.get("course_level", "UNDERGRADUATE"))

    # Merge payload overrides if supplied
    if payload_profile:
        for k, v in payload_profile.items():
            if v is not None:
                profile[k] = v
                if k == "annual_income" and "annual_family_income" not in payload_profile:
                    profile["annual_family_income"] = v
                if k == "annual_family_income" and "annual_income" not in payload_profile:
                    profile["annual_income"] = v

    return profile


@router.post("/eligibility/match", response_model=MatchingResponse)
def match_citizen_eligibility(
    payload: dict[str, Any] | None = None,
    category_id: str | None = Query(None),
    beneficiary_id: str | None = Query(None),
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Evaluates real database-backed schemes deterministically against the citizen's profile.
    Accepts both { profile: { ... } } and flat profile structures.
    """
    raw_profile = None
    if payload:
        raw_profile = payload.get("profile") if "profile" in payload else payload

    effective_profile = resolve_effective_profile(db, raw_profile, current_user)

    cat_id = category_id if isinstance(category_id, str) else None
    ben_id = beneficiary_id if isinstance(beneficiary_id, str) else None

    return SchemeMatchingEngine.match_schemes(
        db=db,
        profile_data=effective_profile,
        filter_category_id=cat_id,
        filter_beneficiary_id=ben_id
    )


@router.get("/eligibility/match", response_model=MatchingResponse)
def get_citizen_eligibility(
    category_id: str | None = Query(None),
    beneficiary_id: str | None = Query(None),
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    effective_profile = resolve_effective_profile(db, None, current_user)
    cat_id = category_id if isinstance(category_id, str) else None
    ben_id = beneficiary_id if isinstance(beneficiary_id, str) else None
    return SchemeMatchingEngine.match_schemes(
        db=db,
        profile_data=effective_profile,
        filter_category_id=cat_id,
        filter_beneficiary_id=ben_id
    )


@router.get("/eligibility/evaluations/{scheme_id}/reasons")
def get_scheme_evaluation_reasons(
    scheme_id: str,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    profile = resolve_effective_profile(db, None, current_user)
    params = db.query(EligibilityParameter).all()
    param_map = {p.name: p for p in params}

    res = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile, param_map)
    res.explanations = ExplanationGenerator.generate_explanations(res)

    rules_table = []
    for cond in res.satisfied_conditions:
        rules_table.append({
            "condition": cond.parameter.replace('_', ' ').title(),
            "parameter": cond.parameter,
            "operator": cond.operator.value,
            "required_value": str(cond.required_value),
            "citizen_value": str(cond.user_value) if cond.user_value is not None else "Not Provided",
            "result": "PASS",
            "message": "Condition satisfied"
        })
    for cond in res.failed_conditions:
        rules_table.append({
            "condition": cond.parameter.replace('_', ' ').title(),
            "parameter": cond.parameter,
            "operator": cond.operator.value,
            "required_value": str(cond.required_value),
            "citizen_value": str(cond.user_value) if cond.user_value is not None else "Not Provided",
            "result": "FAIL",
            "message": cond.failure_message or f"Requirement not met (Must be {cond.operator.value} {cond.required_value})"
        })
    for missing in res.missing_information:
        rules_table.append({
            "condition": missing.replace('_', ' ').title(),
            "parameter": missing,
            "operator": "REQUIRED",
            "required_value": "Mandatory Profile Field",
            "citizen_value": "Missing in Profile",
            "result": "NEEDS_INFO",
            "message": f"Please update profile with {missing.replace('_', ' ')} to confirm eligibility."
        })

    return {
        "scheme_id": scheme.id,
        "scheme_name": scheme.name,
        "status": res.status.value,
        "rules_table": rules_table,
        "explanations": res.explanations
    }
