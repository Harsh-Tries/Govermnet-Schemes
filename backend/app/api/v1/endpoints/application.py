from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import ApplicationProcess, ApplicationStep, Scheme
from app.schemas.application import ApplicationProcessCreate, ApplicationProcessResponse

router = APIRouter()

@router.get("/schemes/{scheme_id}/application", response_model=ApplicationProcessResponse | None)
def get_application_process(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return db.query(ApplicationProcess).filter(ApplicationProcess.scheme_id == scheme_id).first()

@router.post("/schemes/{scheme_id}/application", response_model=ApplicationProcessResponse, status_code=status.HTTP_201_CREATED)
def set_application_process(scheme_id: str, payload: ApplicationProcessCreate, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    
    existing = db.query(ApplicationProcess).filter(ApplicationProcess.scheme_id == scheme_id).first()
    if existing:
        db.delete(existing)
        db.commit()

    process = ApplicationProcess(
        scheme_id=scheme_id,
        application_mode=payload.application_mode,
        official_application_url=payload.official_application_url,
        authority=payload.authority,
        instructions=payload.instructions
    )
    db.add(process)
    db.commit()
    db.refresh(process)

    for step_data in payload.steps:
        step = ApplicationStep(
            process_id=process.id,
            step_number=step_data.step_number,
            title=step_data.title,
            instructions=step_data.instructions
        )
        db.add(step)

    db.commit()
    db.refresh(process)
    return process
