from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.personalization.recommendation_engine import PersonalizedRecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["Personalization & Recommendations"])

@router.post("/personalized")
def get_personalized_schemes(citizen_profile: Dict[str, Any], limit: int = 10, db: Session = Depends(get_db)):
    """Retrieve personalized scheme recommendations with transparent match explanations."""
    recommendations = PersonalizedRecommendationEngine.get_personalized_recommendations(
        db=db,
        citizen_profile=citizen_profile,
        limit=limit
    )
    return {
        "profile_evaluated": citizen_profile,
        "total_recommendations": len(recommendations),
        "recommendations": recommendations
    }
