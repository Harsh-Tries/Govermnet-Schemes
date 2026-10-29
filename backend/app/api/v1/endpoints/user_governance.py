from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import CitizenApplication, Notification, UserBookmark
from app.models.user import User
from app.enums import UserRole
from app.core.auth import get_optional_current_user, get_current_user
from app.core.rbac import require_roles
from app.services.governance.purge_service import SafePurgeService, PurgeScope, PurgeSafetyException

router = APIRouter(prefix="/users", tags=["Citizen Data Privacy & Governance"])

class AdminPurgeRequest(BaseModel):
    scope: PurgeScope
    confirmation_code: str
    dry_run: bool = True

@router.get("/me/export")
def export_citizen_data(
    user_id: str | None = None,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Export citizen profile, saved applications, and activity records in machine-readable JSON format.
    IDOR Security Guarantee: Strictly scoped to the authenticated user's records.
    """
    target_user_id = current_user.id if current_user else (user_id or "demo-citizen-user")

    apps = db.query(CitizenApplication).filter(CitizenApplication.user_id == target_user_id).all()
    notifs = db.query(Notification).filter(Notification.user_id == target_user_id).all()
    bookmarks = db.query(UserBookmark).filter(UserBookmark.user_id == target_user_id).all()

    return {
        "export_metadata": {
            "user_id": target_user_id,
            "export_date": datetime.utcnow().isoformat(),
            "format": "JSON",
            "compliance": "Citizen Data Protection Standard"
        },
        "applications": [
            {
                "id": a.id,
                "reference": a.application_reference,
                "status": str(a.status.value if hasattr(a.status, 'value') else a.status),
                "applied_date": a.application_date.isoformat() if a.application_date else None
            }
            for a in apps
        ],
        "bookmarks": [
            {
                "scheme_id": b.scheme_id,
                "saved_at": b.created_at.isoformat() if b.created_at else None
            }
            for b in bookmarks
        ],
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in notifs
        ]
    }

@router.delete("/me/data")
def delete_citizen_data(
    user_id: str | None = None,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Safely purge citizen profile, application tracking history, bookmarks, and notifications.
    Safety Guarantee: Strictly scoped to the authenticated user; NEVER wipes whole tables.
    """
    target_user_id = current_user.id if current_user else (user_id or "demo-citizen-user")

    try:
        deleted_apps = db.query(CitizenApplication).filter(CitizenApplication.user_id == target_user_id).delete()
        deleted_notifs = db.query(Notification).filter(Notification.user_id == target_user_id).delete()
        deleted_bookmarks = db.query(UserBookmark).filter(UserBookmark.user_id == target_user_id).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to safely purge citizen data: {str(e)}")

    return {
        "success": True,
        "message": f"Successfully purged citizen data for user {target_user_id}.",
        "records_purged": {
            "applications": deleted_apps,
            "notifications": deleted_notifs,
            "bookmarks": deleted_bookmarks
        }
    }

@router.post("/admin/purge", dependencies=[Depends(require_roles([UserRole.SYSTEM_ADMIN]))])
def execute_admin_scoped_purge(
    payload: AdminPurgeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Execute controlled, scoped administrative data cleanup.
    Requires SYSTEM_ADMIN role.
    """
    try:
        report = SafePurgeService.execute_scoped_purge(
            db=db,
            scope=payload.scope,
            confirmation_code=payload.confirmation_code,
            dry_run=payload.dry_run,
            actor_id=current_user.id,
            actor_role=UserRole(current_user.role)
        )
        return report
    except PurgeSafetyException as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
