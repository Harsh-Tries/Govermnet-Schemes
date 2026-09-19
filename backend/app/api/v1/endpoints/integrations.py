from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import GovernmentIntegration, CitizenApplication, ApplicationStatusHistory
from app.services.integrations.mock_adapter import MockGovernmentAdapter

router = APIRouter(prefix="/integrations", tags=["Government Portal Integrations"])

@router.get("", response_model=list[dict])
def list_government_integrations(db: Session = Depends(get_db)):
    """List all registered government portal integrations."""
    integrations = db.query(GovernmentIntegration).all()
    return [
        {
            "id": i.id,
            "department": i.department,
            "name": i.name,
            "base_url": i.base_url,
            "status": i.status,
            "capabilities": i.capabilities,
            "authentication_type": i.authentication_type,
            "last_sync": i.last_sync
        }
        for i in integrations
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
def register_government_integration(payload: dict, db: Session = Depends(get_db)):
    """Register a new official government portal integration."""
    integration = GovernmentIntegration(
        department=payload.get("department", "Ministry of Social Justice"),
        name=payload.get("name", "National Scholarship Portal"),
        base_url=payload.get("base_url", "https://scholarships.gov.in"),
        capabilities=payload.get("capabilities", ["STATUS_LOOKUP", "APPLICATION_SUBMISSION"]),
        authentication_type=payload.get("authentication_type", "BEARER_TOKEN"),
        status="ACTIVE"
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)
    return {
        "id": integration.id,
        "name": integration.name,
        "department": integration.department,
        "status": integration.status
    }

@router.post("/sync/{application_id}")
def sync_application_status_with_official_portal(application_id: str, db: Session = Depends(get_db)):
    """Synchronize a citizen's application status directly from official government portal adapter."""
    app_rec = db.query(CitizenApplication).filter(CitizenApplication.id == application_id).first()
    if not app_rec:
        raise HTTPException(status_code=404, detail="Citizen application not found")

    adapter = MockGovernmentAdapter(integration_id="mock-1", base_url="https://scholarships.gov.in")
    gov_status_info = adapter.get_application_status(app_rec.application_reference)

    old_st = str(app_rec.status.value if hasattr(app_rec.status, 'value') else app_rec.status)
    new_st = gov_status_info["status"]

    app_rec.status = new_st
    app_rec.updated_at = datetime.utcnow()

    history = ApplicationStatusHistory(
        application_id=app_rec.id,
        old_status=old_st,
        new_status=new_st,
        source="OFFICIAL_GOV_SYNC",
        notes=gov_status_info["notes"]
    )
    db.add(history)
    db.commit()
    db.refresh(app_rec)

    return {
        "application_id": app_rec.id,
        "reference": app_rec.application_reference,
        "old_status": old_st,
        "synced_status": app_rec.status,
        "official_notes": gov_status_info["notes"]
    }
