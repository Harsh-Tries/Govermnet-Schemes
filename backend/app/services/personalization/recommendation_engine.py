from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import Scheme
from app.enums import SchemeStatus
from app.services.eligibility.evaluator import DeterministicEligibilityEvaluator

class PersonalizedRecommendationEngine:
    @staticmethod
    def get_personalized_recommendations(db: Session, citizen_profile: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Two-Stage Personalization:
        Stage 1: Candidate Scheme Retrieval (matching published boundary).
        Stage 2: Deterministic Eligibility Engine evaluation & transparent factor breakdown.
        """
        # Fetch candidate published schemes
        candidates = db.query(Scheme).filter(Scheme.status == SchemeStatus.PUBLISHED).limit(50).all()

        results = []
        for scheme in candidates:
            # Deterministic evaluation using Phase 3 engine
            eval_result = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, citizen_profile)
            
            # Generate transparent match explanation factors
            explanation_factors = []
            
            # Check state match
            if citizen_profile.get("state"):
                explanation_factors.append(f"State criteria evaluated for {citizen_profile['state']}")
            if citizen_profile.get("income"):
                explanation_factors.append(f"Stated income ₹{citizen_profile['income']:,} evaluated against threshold")
            if citizen_profile.get("category"):
                explanation_factors.append(f"Beneficiary category '{citizen_profile['category']}' evaluated")
            if citizen_profile.get("profession"):
                explanation_factors.append(f"Stated occupation '{citizen_profile['profession']}' checked")

            match_score = 0
            if eval_result.status == "ELIGIBLE":
                match_score = 95
            elif eval_result.status == "UNKNOWN":
                match_score = 65
            else:
                match_score = 20

            results.append({
                "scheme_id": scheme.id,
                "scheme_name": scheme.name,
                "slug": scheme.slug,
                "short_description": scheme.short_description,
                "government_level": scheme.government_level.value if scheme.government_level else None,
                "eligibility_status": eval_result.status,
                "match_score": match_score,
                "explanation_factors": explanation_factors,
                "missing_information": eval_result.missing_information,
                "failed_conditions": eval_result.failed_conditions,
                "disclaimer": "Eligibility is determined by the deterministic Phase 3 engine based on published rules."
            })

        # Sort by match score & eligibility status
        results.sort(key=lambda x: (x["eligibility_status"] == "ELIGIBLE", x["match_score"]), reverse=True)
        return results[:limit]
