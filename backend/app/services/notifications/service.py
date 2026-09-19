from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationPreference
from app.enums import NotificationCategory, NotificationChannel

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        user_id: str | None,
        category: NotificationCategory,
        title: str,
        message: str,
        action_url: str | None = None,
        channel: NotificationChannel = NotificationChannel.IN_APP
    ) -> Notification:
        """Create and dispatch notification record."""
        notification = Notification(
            user_id=user_id,
            category=category.value if hasattr(category, 'value') else category,
            channel=channel.value if hasattr(channel, 'value') else channel,
            title=title,
            message=message,
            action_url=action_url,
            is_read=False
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def get_user_notifications(db: Session, user_id: str | None = None) -> List[Notification]:
        """Fetch notifications for citizen user or system broadcast."""
        query = db.query(Notification)
        if user_id:
            query = query.filter((Notification.user_id == user_id) | (Notification.user_id == None))
        return query.order_by(Notification.created_at.desc()).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: str) -> Notification | None:
        """Mark notification as read."""
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if notif:
            notif.is_read = True
            db.commit()
            db.refresh(notif)
        return notif
