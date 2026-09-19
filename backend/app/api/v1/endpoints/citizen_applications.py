from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.application_tracking import CitizenApplication, ApplicationStatusHistory
from app.models import Scheme
from app.schemas.citizen_application import (
    CitizenApplicationCreate, CitizenApplicationStatusUpdate,
    CitizenApplicationResponse
)

router = APIRouter(tags=["Citizen Applications"])

@router.post("/applications", response_model=CitizenApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_citizen_application(data: CitizenApplicationCreate, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == data.scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    app_rec = CitizenApplication(
        scheme_id=data.scheme_id,
        application_reference=data.application_reference,
        application_date=data.application_date or datetime.utcnow(),
        status=data.status,
        department=data.department or scheme.administering_ministry,
        portal_url=data.portal_url,
        notes=data.notes
    )
    db.add(app_rec)
    db.commit()
    db.refresh(app_rec)

    # Log initial status history
    history = ApplicationStatusHistory(
        application_id=app_rec.id,
        old_status=None,
        new_status=str(app_rec.status.value if hasattr(app_rec.status, 'value') else app_rec.status),
        source="CITIZEN_MANUAL",
        notes="Initial application recorded."
    )
    db.add(history)
    db.commit()
    db.refresh(app_rec)

    resp = CitizenApplicationResponse.model_validate(app_rec)
    resp.scheme_name = scheme.name
    return resp

@router.get("/applications", response_model=list[CitizenApplicationResponse])
def list_citizen_applications(db: Session = Depends(get_db)):
    apps = db.query(CitizenApplication).order_by(CitizenApplication.created_at.desc()).all()
    results = []
    for a in apps:
        resp = CitizenApplicationResponse.model_validate(a)
        if a.scheme:
            resp.scheme_name = a.scheme.name
        results.append(resp)
    return results

@router.get("/applications/{id}", response_model=CitizenApplicationResponse)
def get_citizen_application(id: str, db: Session = Depends(get_db)):
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found")
    resp = CitizenApplicationResponse.model_validate(a)
    if a.scheme:
        resp.scheme_name = a.scheme.name
    return resp

@router.put("/applications/{id}/status", response_model=CitizenApplicationResponse)
def update_application_status(id: str, data: CitizenApplicationStatusUpdate, db: Session = Depends(get_db)):
    a = db.query(CitizenApplication).filter(CitizenApplication.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found")

    old_st = str(a.status.value if hasattr(a.status, 'value') else a.status)
    new_st = str(data.new_status.value if hasattr(data.new_status, 'value') else data.new_status)

    a.status = data.new_status
    a.updated_at = datetime.utcnow()

    history = ApplicationStatusHistory(
        application_id=a.id,
        old_status=old_st,
        new_status=new_st,
        source=data.source,
        notes=data.notes or f"Status updated to {new_st}"
    )
    db.add(history)
    db.commit()
    db.refresh(a)

    resp = CitizenApplicationResponse.model_validate(a)
    if a.scheme:
        resp.scheme_name = a.scheme.name
    return resp
