import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models import (
    Scheme, SchemeCategoryMap, SchemeBeneficiary, 
    SchemeProfession, SchemeState, SchemeDistrict,
    SchemeUpdate, AuditLog
)
from app.enums import GovernmentLevel, SchemeType, SchemeStatus, AuditAction
from app.schemas.scheme import SchemeCreate, SchemeUpdateSchema, SchemeResponse

router = APIRouter()

@router.get("/schemes", response_model=list[SchemeResponse])
def list_schemes(
    search: str | None = Query(None, description="Text search on name and description"),
    government_level: GovernmentLevel | None = None,
    scheme_type: SchemeType | None = None,
    category_id: str | None = None,
    beneficiary_id: str | None = None,
    profession_id: str | None = None,
    state_code: str | None = None,
    district_id: str | None = None,
    status_filter: SchemeStatus | None = Query(None, description="Authorised status filter"),
    include_all_statuses: bool = Query(False, description="Whether to include non-published schemes for admin views"),
    db: Session = Depends(get_db)
):
    query = db.query(Scheme)

    # Public visibility constraint
    if not include_all_statuses and not status_filter:
        query = query.filter(Scheme.status == SchemeStatus.PUBLISHED)
    elif status_filter:
        query = query.filter(Scheme.status == status_filter)

    # Apply taxonomy & location joins
    if government_level:
        query = query.filter(Scheme.government_level == government_level)
    if scheme_type:
        query = query.filter(Scheme.scheme_type == scheme_type)
    if category_id:
        query = query.join(SchemeCategoryMap).filter(SchemeCategoryMap.category_id == category_id)
    if beneficiary_id:
        query = query.join(SchemeBeneficiary).filter(SchemeBeneficiary.beneficiary_type_id == beneficiary_id)
    if profession_id:
        query = query.join(SchemeProfession).filter(SchemeProfession.profession_id == profession_id)
    if state_code:
        query = query.join(SchemeState).filter(SchemeState.state_code == state_code)
    if district_id:
        query = query.join(SchemeDistrict).filter(SchemeDistrict.district_id == district_id)

    # Text search
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Scheme.name.ilike(search_pattern),
                Scheme.short_description.ilike(search_pattern),
                Scheme.description.ilike(search_pattern)
            )
        )

    return query.distinct().all()

@router.get("/schemes/{scheme_id}", response_model=SchemeResponse)
def get_scheme_by_id(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return scheme

@router.post("/schemes", response_model=SchemeResponse, status_code=status.HTTP_201_CREATED)
def create_scheme(payload: SchemeCreate, db: Session = Depends(get_db)):
    existing = db.query(Scheme).filter(Scheme.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Scheme slug already exists.")

    scheme = Scheme(
        name=payload.name,
        slug=payload.slug,
        short_description=payload.short_description,
        description=payload.description,
        government_level=payload.government_level,
        scheme_type=payload.scheme_type,
        administering_ministry=payload.administering_ministry,
        funding_ratio=payload.funding_ratio,
        status=SchemeStatus.DRAFT
    )
    db.add(scheme)
    db.commit()
    db.refresh(scheme)

    # Attach associations
    for cat_id in payload.category_ids:
        db.add(SchemeCategoryMap(scheme_id=scheme.id, category_id=cat_id))
    for ben_id in payload.beneficiary_type_ids:
        db.add(SchemeBeneficiary(scheme_id=scheme.id, beneficiary_type_id=ben_id))
    for prof_id in payload.profession_ids:
        db.add(SchemeProfession(scheme_id=scheme.id, profession_id=prof_id))
    for scode in payload.state_codes:
        db.add(SchemeState(scheme_id=scheme.id, state_code=scode))
    for dist_id in payload.district_ids:
        db.add(SchemeDistrict(scheme_id=scheme.id, district_id=dist_id))

    db.add(AuditLog(
        action=AuditAction.CREATE_SCHEME,
        target_entity="Scheme",
        target_id=scheme.id,
        payload={"name": scheme.name, "slug": scheme.slug}
    ))

    db.commit()
    db.refresh(scheme)
    return scheme

@router.put("/schemes/{scheme_id}", response_model=SchemeResponse)
def update_scheme(scheme_id: str, payload: SchemeUpdateSchema, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    update_data = payload.model_dump(exclude_unset=True)
    
    # Track scheme update history
    for field, new_val in update_data.items():
        if field not in ["category_ids", "beneficiary_type_ids", "profession_ids", "state_codes", "district_ids"]:
            old_val = getattr(scheme, field, None)
            if old_val != new_val:
                setattr(scheme, field, new_val)
                db.add(SchemeUpdate(
                    scheme_id=scheme.id,
                    changed_field=field,
                    previous_value=str(old_val),
                    new_value=str(new_val),
                    reason="Admin API Update"
                ))

    # Update taxonomy relations if provided
    if payload.category_ids is not None:
        db.query(SchemeCategoryMap).filter(SchemeCategoryMap.scheme_id == scheme_id).delete()
        for cid in payload.category_ids:
            db.add(SchemeCategoryMap(scheme_id=scheme_id, category_id=cid))

    if payload.beneficiary_type_ids is not None:
        db.query(SchemeBeneficiary).filter(SchemeBeneficiary.scheme_id == scheme_id).delete()
        for bid in payload.beneficiary_type_ids:
            db.add(SchemeBeneficiary(scheme_id=scheme_id, beneficiary_type_id=bid))

    scheme.updated_at = datetime.datetime.utcnow()
    
    db.add(AuditLog(
        action=AuditAction.UPDATE_SCHEME,
        target_entity="Scheme",
        target_id=scheme.id,
        payload=update_data
    ))

    db.commit()
    db.refresh(scheme)
    return scheme
