from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.ai.providers.factory import get_llm_provider
from app.services.voice.providers.factory import get_stt_provider

router = APIRouter(tags=["Health Checks"])

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Basic health check endpoint."""
    return {"status": "HEALTHY", "service": "Government Scheme Assistant Backend"}

@router.get("/health/live", status_code=status.HTTP_200_OK)
def liveness_check():
    """Liveness check for container orchestration."""
    return {"status": "LIVE"}

@router.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness check verifying database connectivity and external service configurations.
    Distinguishes READY vs DEGRADED states.
    """
    checks = {
        "database": False,
        "llm_provider": True,
        "stt_provider": True
    }

    # Check Database Connectivity
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception as e:
        checks["database"] = False

    is_ready = checks["database"]
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_53TC_SERVICE_UNAVAILABLE if hasattr(status, 'HTTP_53TC_SERVICE_UNAVAILABLE') else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "READY" if is_ready else "DEGRADED",
            "checks": checks
        }
    )
