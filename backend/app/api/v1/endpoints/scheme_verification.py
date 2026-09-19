from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Scheme, SchemeVersion, VerificationRecord
from app.enums import SchemeStatus
from app.services.verification.change_detector import SchemeChangeDetectorService

router = APIRouter(prefix="/verification", tags=["Scheme Verification & Freshness"])

@router.get("/queue")
def get_verification_queue(db: Session = Depends(get_db)):
    """Retrieve schemes requiring human verification or review."""
    pending_schemes = db.query(Scheme).filter(
        Scheme.status.in_([
            SchemeStatus.CHANGE_DETECTED,
            SchemeStatus.UNDER_REVIEW,
            SchemeStatus.REVERIFICATION_REQUIRED,
            SchemeStatus.DRAFT
        ])
    ).all()

    results = []
    for s in pending_schemes:
        results.append({
            "id": s.id,
            "name": s.name,
            "slug": s.slug,
            "status": s.status.value,
            "government_level": s.government_level.value if s.government_level else None,
            "updated_at": s.updated_at
        })
    return {"total_pending": len(results), "queue": results}

@router.get("/schemes/{scheme_id}/versions")
def get_scheme_version_history(scheme_id: str, db: Session = Depends(get_db)):
    """Get version history snapshots for a scheme."""
    versions = db.query(SchemeVersion).filter(SchemeVersion.scheme_id == scheme_id).order_by(SchemeVersion.version_number.desc()).all()
    return [
        {
            "id": v.id,
            "version_number": v.version_number,
            "effective_from": v.effective_from,
            "effective_to": v.effective_to,
            "verified_by": v.verified_by,
            "change_summary": v.change_summary
        }
        for v in versions
    ]

@router.post("/schemes/{scheme_id}/approve")
def approve_and_publish_scheme_changes(scheme_id: str, change_summary: str = "Verified and published by content admin", db: Session = Depends(get_db)):
    """Approve pending changes, create a version snapshot, and publish the scheme."""
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    # Create historical version snapshot
    version = SchemeChangeDetectorService.create_version_snapshot(db, scheme_id=scheme_id, change_summary=change_summary)

    # Move to PUBLISHED
    scheme.status = SchemeStatus.PUBLISHED
    scheme.published_at = datetime.utcnow()
    scheme.updated_at = datetime.utcnow()

    # Record verification record
    v_rec = VerificationRecord(
        scheme_id=scheme_id,
        verification_status=SchemeStatus.PUBLISHED,
        notes=change_summary
    )
    db.add(v_rec)
    db.commit()
    db.refresh(scheme)

    return {
        "scheme_id": scheme.id,
        "name": scheme.name,
        "status": scheme.status.value,
        "active_version": version.version_number,
        "published_at": scheme.published_at
    }

@router.get("/freshness")
def get_knowledge_base_freshness_metrics(db: Session = Depends(get_db)):
    """Get overall scheme knowledge freshness dashboard metrics."""
    total_schemes = db.query(Scheme).count()
    published = db.query(Scheme).filter(Scheme.status == SchemeStatus.PUBLISHED).count()
    change_detected = db.query(Scheme).filter(Scheme.status == SchemeStatus.CHANGE_DETECTED).count()
    under_review = db.query(Scheme).filter(Scheme.status == SchemeStatus.UNDER_REVIEW).count()
    archived = db.query(Scheme).filter(Scheme.status == SchemeStatus.ARCHIVED).count()

    return {
        "total_schemes": total_schemes,
        "published": published,
        "change_detected": change_detected,
        "under_review": under_review,
        "archived": archived,
        "freshness_score_percent": round((published / total_schemes * 100) if total_schemes > 0 else 100.0, 1)
    }
