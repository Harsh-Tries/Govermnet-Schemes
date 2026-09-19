from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import SchemeBenefit, Scheme
from app.schemas.benefit import BenefitCreate, BenefitResponse

router = APIRouter()

@router.get("/schemes/{scheme_id}/benefits", response_model=list[BenefitResponse])
def get_scheme_benefits(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return db.query(SchemeBenefit).filter(SchemeBenefit.scheme_id == scheme_id).all()

@router.post("/schemes/{scheme_id}/benefits", response_model=BenefitResponse, status_code=status.HTTP_201_CREATED)
def create_scheme_benefit(scheme_id: str, payload: BenefitCreate, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    benefit = SchemeBenefit(scheme_id=scheme_id, **payload.model_dump())
    db.add(benefit)
    db.commit()
    db.refresh(benefit)
    return benefit
