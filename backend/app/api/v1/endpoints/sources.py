from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import OfficialSource, SchemeSource, Scheme, AuditLog
from app.enums import AuditAction
from app.schemas.source import (
    SourceCreate, SourceResponse,
    SchemeSourceCreate, SchemeSourceResponse
)

router = APIRouter()

@router.get("/sources", response_model=list[SourceResponse])
def list_official_sources(db: Session = Depends(get_db)):
    return db.query(OfficialSource).all()

@router.post("/sources", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
def create_official_source(payload: SourceCreate, db: Session = Depends(get_db)):
    source = OfficialSource(**payload.model_dump())
    db.add(source)
    db.commit()
    db.refresh(source)
    return source

@router.get("/schemes/{scheme_id}/sources", response_model=list[SchemeSourceResponse])
def get_scheme_sources(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return db.query(SchemeSource).filter(SchemeSource.scheme_id == scheme_id).all()

@router.post("/schemes/{scheme_id}/sources", response_model=SchemeSourceResponse, status_code=status.HTTP_201_CREATED)
def attach_source_to_scheme(scheme_id: str, payload: SchemeSourceCreate, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    source = db.query(OfficialSource).filter(OfficialSource.id == payload.source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Official source entity not found.")

    scheme_source = SchemeSource(scheme_id=scheme_id, **payload.model_dump())
    db.add(scheme_source)

    db.add(AuditLog(
        action=AuditAction.UPDATE_SOURCE,
        target_entity="Scheme",
        target_id=scheme_id,
        payload={"source_id": payload.source_id, "source_url": source.url}
    ))

    db.commit()
    db.refresh(scheme_source)
    return scheme_source
