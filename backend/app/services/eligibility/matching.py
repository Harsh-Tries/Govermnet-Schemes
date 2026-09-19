from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models import Scheme, SchemeCategoryMap, SchemeBeneficiary, SchemeProfession, SchemeState, EligibilityParameter
from app.enums import SchemeStatus, GovernmentLevel
from app.schemas.intelligence import MatchingResponse, SchemeEvaluationResult, OverallEligibilityStatus
from app.services.eligibility.evaluator import DeterministicEligibilityEvaluator
from app.services.eligibility.explanation import ExplanationGenerator

class SchemeMatchingEngine:
    """
    Multi-scheme matching service executing metadata pre-filtering over PUBLISHED schemes, 
    running deterministic rules, and partitioning results into ELIGIBLE, UNKNOWN, and NOT_ELIGIBLE collections.
    """

    @classmethod
    def match_schemes(
        cls, 
        db: Session, 
        profile_data: dict,
        filter_state: str | None = None,
        filter_category_id: str | None = None,
        filter_beneficiary_id: str | None = None,
        filter_profession_id: str | None = None,
        filter_level: GovernmentLevel | None = None,
        include_all_statuses: bool = False
    ) -> MatchingResponse:
        
        # 1. Base Query (PUBLISHED schemes only for public users)
        query = db.query(Scheme)
        if not include_all_statuses:
            query = query.filter(Scheme.status == SchemeStatus.PUBLISHED)

        # 2. Metadata Pre-filtering
        if filter_level:
            query = query.filter(Scheme.government_level == filter_level)

        if filter_category_id:
            query = query.join(SchemeCategoryMap).filter(SchemeCategoryMap.category_id == filter_category_id)

        if filter_beneficiary_id:
            query = query.join(SchemeBeneficiary).filter(SchemeBeneficiary.beneficiary_type_id == filter_beneficiary_id)

        if filter_profession_id:
            query = query.join(SchemeProfession).filter(SchemeProfession.profession_id == filter_profession_id)

        if filter_state:
            query = query.outerjoin(SchemeState).filter(
                or_(
                    Scheme.government_level == GovernmentLevel.CENTRAL,
                    SchemeState.state_code == filter_state
                )
            )

        published_schemes = query.distinct().all()

        # Cache parameter metadata lookup
        params = db.query(EligibilityParameter).all()
        param_map = {p.name: p for p in params}

        eligible_schemes: list[SchemeEvaluationResult] = []
        unknown_schemes: list[SchemeEvaluationResult] = []
        not_eligible_schemes: list[SchemeEvaluationResult] = []

        # 3. Deterministic Evaluation Loop
        for scheme in published_schemes:
            res = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile_data, param_map)
            
            # Enrich metadata details for UI cards
            res.beneficiary_types = [b.beneficiary_type.name for b in scheme.beneficiaries if b.beneficiary_type]
            res.categories = [c.category.name for c in scheme.categories if c.category]
            res.benefits = [
                {"title": b.title, "amount": b.amount, "unit": b.amount_unit}
                for b in scheme.benefits
            ]

            # Generate explanations
            res.explanations = ExplanationGenerator.generate_explanations(res)

            # Partition results into collections
            if res.status == OverallEligibilityStatus.ELIGIBLE:
                eligible_schemes.append(res)
            elif res.status == OverallEligibilityStatus.UNKNOWN:
                unknown_schemes.append(res)
            elif res.status == OverallEligibilityStatus.NOT_ELIGIBLE:
                not_eligible_schemes.append(res)

        return MatchingResponse(
            eligible_schemes=eligible_schemes,
            unknown_schemes=unknown_schemes,
            not_eligible_schemes=not_eligible_schemes
        )
