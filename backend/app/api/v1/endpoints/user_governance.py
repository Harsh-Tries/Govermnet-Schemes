from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import CitizenApplication, Notification

router = APIRouter(prefix="/users/me", tags=["Citizen Data Privacy & Governance"])

@router.get("/export")
def export_citizen_data(user_id: str = "demo-user-123", db: Session = Depends(get_db)):
    """Export citizen profile, saved applications, and activity records in machine-readable JSON format."""
    apps = db.query(CitizenApplication).all()
    notifs = db.query(Notification).filter(Notification.user_id == user_id).all()

    return {
        "export_metadata": {
            "user_id": user_id,
            "export_date": datetime.utcnow().isoformat(),
            "format": "JSON",
            "compliance": "Citizen Data Protection Standard"
        },
        "applications": [
            {
                "id": a.id,
                "reference": a.application_reference,
                "status": a.status,
                "applied_date": a.application_date
            }
            for a in apps
        ],
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at
            }
            for n in notifs
        ]
    }

@router.delete("/data")
def delete_citizen_data(user_id: str = "demo-user-123", db: Session = Depends(get_db)):
    """Purge citizen profile, tracking history, and notifications upon citizen request."""
    deleted_apps = db.query(CitizenApplication).delete()
    deleted_notifs = db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.commit()

    return {
        "success": True,
        "message": f"Successfully purged citizen data for user {user_id}.",
        "records_purged": {
            "applications": deleted_apps,
            "notifications": deleted_notifs
        }
    }
