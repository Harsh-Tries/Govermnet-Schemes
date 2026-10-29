from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.services.personalization.ranking_service import SchemeRankingService

class PersonalizedRecommendationEngine:
    @staticmethod
    def get_personalized_recommendations(
        db: Session,
        citizen_profile: Dict[str, Any],
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Two-Stage Personalization:
        Stage 1: Candidate Scheme Retrieval (published boundary).
        Stage 2: Deterministic SchemeRankingService evaluation with verified portals & transparent factors.
        """
        return SchemeRankingService.rank_schemes_for_citizen(
            db=db,
            citizen_profile=citizen_profile,
            limit=limit
        )
