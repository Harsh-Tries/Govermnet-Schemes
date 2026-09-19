from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import EligibilityParameter, EligibilityRuleGroup, EligibilityRule, Scheme, AuditLog
from app.enums import AuditAction
from app.schemas.eligibility import (
    ParameterCreate, ParameterResponse,
    RuleGroupCreate, RuleGroupResponse
)

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
