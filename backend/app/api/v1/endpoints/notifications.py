from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.enums import NotificationCategory, NotificationChannel
from app.services.notifications.service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])

@router.get("", response_model=list[dict])
def list_notifications(user_id: str | None = None, db: Session = Depends(get_db)):
    """Fetch notifications for citizen."""
    notifs = NotificationService.get_user_notifications(db, user_id=user_id)
    return [
        {
            "id": n.id,
            "category": n.category,
            "channel": n.channel,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "action_url": n.action_url,
            "created_at": n.created_at
        }
        for n in notifs
    ]

@router.post("", status_code=status.HTTP_201_CREATED)
def send_notification(payload: dict, db: Session = Depends(get_db)):
    """Dispatch notification alert."""
    notif = NotificationService.send_notification(
        db=db,
        user_id=payload.get("user_id"),
        category=payload.get("category", NotificationCategory.APPLICATION_UPDATES),
        title=payload.get("title", "Scheme Update Alert"),
        message=payload.get("message", "Your application status has been updated."),
        action_url=payload.get("action_url"),
        channel=payload.get("channel", NotificationChannel.IN_APP)
    )
    return {
        "id": notif.id,
        "title": notif.title,
        "category": notif.category,
        "is_read": notif.is_read
    }

@router.put("/{id}/read")
def mark_notification_read(id: str, db: Session = Depends(get_db)):
    """Mark notification as read."""
    notif = NotificationService.mark_as_read(db, id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"id": notif.id, "is_read": notif.is_read}
