from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/citizen")
def get_citizen_analytics(user_id: str | None = None, db: Session = Depends(get_db)):
    """Get citizen personal activity analytics."""
    return AnalyticsService.get_citizen_activity_metrics(db, user_id=user_id)

@router.get("/admin")
def get_admin_analytics(db: Session = Depends(get_db)):
    """Get administrator platform analytics and missing information distributions."""
    return AnalyticsService.get_admin_dashboard_metrics(db)
