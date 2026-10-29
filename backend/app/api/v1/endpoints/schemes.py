import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import or_, case, func
from app.db.session import get_db
from app.models import (
    Scheme, SchemeCategoryMap, SchemeBeneficiary, 
    SchemeProfession, SchemeState, SchemeDistrict,
    SchemeUpdate, AuditLog, BeneficiaryType, SchemeCategory
)
from app.enums import GovernmentLevel, SchemeType, SchemeStatus, AuditAction
from app.schemas.scheme import SchemeCreate, SchemeUpdateSchema, SchemeResponse

router = APIRouter()

@router.get("/schemes", response_model=list[SchemeResponse])
def list_schemes(
    search: str | None = Query(None, description="Text search on name and description"),
    q: str | None = Query(None, description="Search query alias"),
    government_level: GovernmentLevel | None = None,
    level: GovernmentLevel | None = Query(None, description="Government level alias"),
    scheme_type: SchemeType | None = None,
    category_id: str | None = None,
    beneficiary_id: str | None = None,
    profession_id: str | None = None,
    state_code: str | None = None,
    district_id: str | None = None,
    sort_by: str | None = Query("state_first", description="Sorting: state_first, name_asc, name_desc, recently_verified"),
    status_filter: SchemeStatus | None = Query(None, description="Authorised status filter"),
    include_all_statuses: bool = Query(False, description="Whether to include non-published schemes for admin views"),
    db: Session = Depends(get_db)
):
    # Normalize potential FastAPI Query parameter objects if called directly in Python
    search_str = search if isinstance(search, str) else (q if isinstance(q, str) else None)
    gov_lvl = government_level if isinstance(government_level, (GovernmentLevel, str)) else (level if isinstance(level, (GovernmentLevel, str)) else None)
    sort_mode = sort_by if isinstance(sort_by, str) else "state_first"
    st_filter = status_filter if isinstance(status_filter, SchemeStatus) else None
    inc_all = include_all_statuses if isinstance(include_all_statuses, bool) else False
    ben_id = beneficiary_id if isinstance(beneficiary_id, str) else None
    cat_id = category_id if isinstance(category_id, str) else None

    query = db.query(Scheme)

    # Public visibility constraint
    if not inc_all and not st_filter:
        query = query.filter(Scheme.status == SchemeStatus.PUBLISHED)
    elif st_filter:
        query = query.filter(Scheme.status == st_filter)

    # Apply taxonomy & location joins
    if gov_lvl:
        query = query.filter(Scheme.government_level == gov_lvl)
    if scheme_type and isinstance(scheme_type, SchemeType):
        query = query.filter(Scheme.scheme_type == scheme_type)

    if cat_id:
        norm_cat = cat_id.strip().upper()
        query = query.join(SchemeCategoryMap).outerjoin(
            SchemeCategory, SchemeCategoryMap.category_id == SchemeCategory.id
        ).filter(
            or_(
                SchemeCategoryMap.category_id == cat_id,
                SchemeCategory.code.ilike(f"%{norm_cat}%"),
                SchemeCategory.name.ilike(f"%{norm_cat}%")
            )
        )

    if ben_id:
        norm_ben = ben_id.strip().upper()
        if norm_ben == "PWD":
            norm_ben = "DIVYANG"
        elif norm_ben == "MSME":
            norm_ben = "ENTREPRENEUR"

        query = query.join(SchemeBeneficiary).outerjoin(
            BeneficiaryType, SchemeBeneficiary.beneficiary_type_id == BeneficiaryType.id
        ).filter(
            or_(
                SchemeBeneficiary.beneficiary_type_id == ben_id,
                BeneficiaryType.code.ilike(f"%{norm_ben}%"),
                BeneficiaryType.name.ilike(f"%{norm_ben}%"),
                Scheme.short_description.ilike(f"%{norm_ben}%"),
                Scheme.description.ilike(f"%{norm_ben}%")
            )
        )

    if profession_id and isinstance(profession_id, str):
        query = query.join(SchemeProfession).filter(SchemeProfession.profession_id == profession_id)
    if state_code and isinstance(state_code, str):
        query = query.join(SchemeState).filter(SchemeState.state_code == state_code)
    if district_id and isinstance(district_id, str):
        query = query.join(SchemeDistrict).filter(SchemeDistrict.district_id == district_id)

    # Text search
    if search_str:
        search_pattern = f"%{search_str.strip()}%"
        query = query.filter(
            or_(
                Scheme.name.ilike(search_pattern),
                Scheme.short_description.ilike(search_pattern),
                Scheme.description.ilike(search_pattern),
                Scheme.administering_ministry.ilike(search_pattern),
                Scheme.slug.ilike(search_pattern)
            )
        )

    # Sorting
    if sort_mode == "name_asc":
        query = query.order_by(func.lower(Scheme.name).asc())
    elif sort_mode == "name_desc":
        query = query.order_by(func.lower(Scheme.name).desc())
    elif sort_mode == "recently_verified":
        query = query.order_by(Scheme.published_at.desc(), Scheme.updated_at.desc())
    else:  # state_first default: Prioritize Maharashtra State Government schemes
        level_priority = case(
            (Scheme.government_level == GovernmentLevel.STATE, 1),
            (Scheme.government_level == GovernmentLevel.CENTRALLY_SPONSORED, 2),
            (Scheme.government_level == GovernmentLevel.CENTRAL, 3),
            else_=4
        )
        query = query.order_by(level_priority, func.lower(Scheme.name).asc())

    return query.options(
        selectinload(Scheme.categories),
        selectinload(Scheme.beneficiaries),
        selectinload(Scheme.benefits),
        selectinload(Scheme.documents),
        joinedload(Scheme.application_process),
        selectinload(Scheme.sources)
    ).distinct().all()

@router.get("/schemes/{scheme_id}", response_model=SchemeResponse)
def get_scheme_by_id(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).options(
        selectinload(Scheme.categories),
        selectinload(Scheme.beneficiaries),
        selectinload(Scheme.benefits),
        selectinload(Scheme.documents),
        joinedload(Scheme.application_process),
        selectinload(Scheme.sources)
    ).filter(or_(Scheme.id == scheme_id, Scheme.slug == scheme_id)).first()
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
