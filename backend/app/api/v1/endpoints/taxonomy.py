from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import State, District, SchemeCategory, BeneficiaryType, Profession
from app.schemas.taxonomy import (
    StateResponse, DistrictResponse,
    CategoryCreate, CategoryResponse,
    BeneficiaryCreate, BeneficiaryResponse,
    ProfessionCreate, ProfessionResponse
)

router = APIRouter()

# States & Districts
@router.get("/states", response_model=list[StateResponse])
def list_states(db: Session = Depends(get_db)):
    return db.query(State).all()

@router.get("/districts", response_model=list[DistrictResponse])
def list_districts(state_code: str | None = None, db: Session = Depends(get_db)):
    query = db.query(District)
    if state_code:
        query = query.filter(District.state_code == state_code)
    return query.all()

# Categories
@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(SchemeCategory).all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(SchemeCategory).filter(SchemeCategory.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category code already exists.")
    cat = SchemeCategory(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

# Beneficiaries
@router.get("/beneficiaries", response_model=list[BeneficiaryResponse])
def list_beneficiaries(db: Session = Depends(get_db)):
    return db.query(BeneficiaryType).all()

@router.post("/beneficiaries", response_model=BeneficiaryResponse, status_code=status.HTTP_201_CREATED)
def create_beneficiary(payload: BeneficiaryCreate, db: Session = Depends(get_db)):
    existing = db.query(BeneficiaryType).filter(BeneficiaryType.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Beneficiary code already exists.")
    b = BeneficiaryType(**payload.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

# Professions
@router.get("/professions", response_model=list[ProfessionResponse])
def list_professions(db: Session = Depends(get_db)):
    return db.query(Profession).all()

@router.post("/professions", response_model=ProfessionResponse, status_code=status.HTTP_201_CREATED)
def create_profession(payload: ProfessionCreate, db: Session = Depends(get_db)):
    existing = db.query(Profession).filter(Profession.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profession code already exists.")
    p = Profession(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
