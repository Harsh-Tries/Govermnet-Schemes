import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Scheme, VerificationRecord, AuditLog
from app.enums import SchemeStatus, VerificationAction, AuditAction
from app.schemas.verification import VerificationRequest, VerificationRecordResponse
from app.schemas.scheme import SchemePublishValidation

router = APIRouter()

@router.post("/verification/schemes/{scheme_id}", response_model=VerificationRecordResponse)
def verify_scheme_action(scheme_id: str, payload: VerificationRequest, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")

    target_status = scheme.status

    if payload.action == VerificationAction.SUBMIT:
        if scheme.status not in [SchemeStatus.DRAFT, SchemeStatus.REVERIFICATION_REQUIRED]:
            raise HTTPException(status_code=400, detail=f"Cannot submit for review from state {scheme.status}")
        target_status = SchemeStatus.UNDER_REVIEW

    elif payload.action == VerificationAction.VERIFY_SOURCE:
        if scheme.status not in [SchemeStatus.UNDER_REVIEW, SchemeStatus.DRAFT]:
            raise HTTPException(status_code=400, detail=f"Cannot verify source from state {scheme.status}")
        target_status = SchemeStatus.SOURCE_VERIFIED

    elif payload.action == VerificationAction.APPROVE:
        if scheme.status not in [SchemeStatus.SOURCE_VERIFIED, SchemeStatus.UNDER_REVIEW]:
            raise HTTPException(status_code=400, detail=f"Cannot approve from state {scheme.status}")
        target_status = SchemeStatus.APPROVED

    elif payload.action == VerificationAction.PUBLISH:
        # Enforce validation before publishing
        has_categories = len(scheme.categories) > 0
        has_beneficiaries = len(scheme.beneficiaries) > 0
        has_sources = len(scheme.sources) > 0
        is_source_verified = scheme.status in [SchemeStatus.SOURCE_VERIFIED, SchemeStatus.APPROVED]

        try:
            validator = SchemePublishValidation(
                name=scheme.name,
                short_description=scheme.short_description,
                government_level=scheme.government_level,
                has_categories=has_categories,
                has_beneficiaries=has_beneficiaries,
                has_sources=has_sources,
                is_source_verified=is_source_verified
            )
        except ValueError as e:
            raise HTTPException(status_code=422, detail=f"Publication validation failed: {str(e)}")

        target_status = SchemeStatus.PUBLISHED
        scheme.published_at = datetime.datetime.utcnow()

    elif payload.action == VerificationAction.FLAG_REVERIFICATION:
        target_status = SchemeStatus.REVERIFICATION_REQUIRED

    elif payload.action == VerificationAction.ARCHIVE:
        target_status = SchemeStatus.ARCHIVED

    elif payload.action == VerificationAction.REJECT:
        target_status = SchemeStatus.DRAFT

    scheme.status = target_status
    scheme.updated_at = datetime.datetime.utcnow()

    rec = VerificationRecord(
        scheme_id=scheme_id,
        verification_status=target_status,
        notes=payload.notes,
        source_reviewed=payload.source_reviewed
    )
    db.add(rec)

    audit_action = AuditAction.PUBLISH_SCHEME if payload.action == VerificationAction.PUBLISH else AuditAction.VERIFY_SCHEME
    db.add(AuditLog(
        action=audit_action,
        target_entity="Scheme",
        target_id=scheme_id,
        payload={"action": payload.action, "new_status": target_status, "notes": payload.notes}
    ))

    db.commit()
    db.refresh(rec)
    return rec

@router.get("/verification/schemes/{scheme_id}/history", response_model=list[VerificationRecordResponse])
def get_scheme_verification_history(scheme_id: str, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found.")
    return db.query(VerificationRecord).filter(VerificationRecord.scheme_id == scheme_id).all()
