from datetime import datetime
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter(tags=["Health Checks"])

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Basic service health check endpoint."""
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }

@router.get("/health/live", status_code=status.HTTP_200_OK)
def liveness_check():
    """Liveness check for container orchestration probes."""
    return {
        "status": "LIVE",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness probe verifying core dependency health (database connectivity).
    Distinguishes READY (200 OK) vs DEGRADED (503 Service Unavailable).
    Does not expose sensitive connection strings or internal credentials.
    """
    checks = {
        "database": False,
        "configuration": True
    }

    # Verify Database connectivity
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False

    is_ready = checks["database"]
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "READY" if is_ready else "DEGRADED",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": checks
        }
    )
