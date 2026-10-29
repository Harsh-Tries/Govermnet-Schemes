from datetime import datetime
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

        all_categories = set()
        all_departments = set()
        all_benefit_types = set()
        all_education_levels = {"School", "Undergraduate", "Postgraduate", "Diploma", "Vocational/Technical"}

        # 3. Deterministic Evaluation Loop
        for scheme in published_schemes:
            res = DeterministicEligibilityEvaluator.evaluate_scheme(scheme, profile_data, param_map)
            
            # Enrich metadata details for UI cards
            res.beneficiary_types = [b.beneficiary_type.name for b in scheme.beneficiaries if b.beneficiary_type]
            res.categories = [c.category.name for c in scheme.categories if c.category]
            res.category = res.categories[0] if res.categories else (scheme.scheme_type.value if hasattr(scheme.scheme_type, 'value') else "General Welfare")
            res.department = scheme.administering_ministry or "Government of Maharashtra"

            if res.department:
                all_departments.add(res.department)
            for c_name in res.categories:
                all_categories.add(c_name)

            # Benefits info
            res.benefits = [
                {"title": b.title, "amount": b.amount, "unit": b.amount_unit}
                for b in scheme.benefits
            ]
            if scheme.benefits:
                b_first = scheme.benefits[0]
                res.benefit_type = b_first.benefit_type.value if hasattr(b_first.benefit_type, 'value') else str(b_first.benefit_type)
                res.benefit_description = b_first.title
                all_benefit_types.add(res.benefit_type)
            else:
                res.benefit_type = scheme.scheme_type.value if hasattr(scheme.scheme_type, 'value') else "FINANCIAL_ASSISTANCE"
                res.benefit_description = "Government Welfare Assistance"
                all_benefit_types.add(res.benefit_type)

            # Official Application Portal
            if scheme.application_process and scheme.application_process.official_application_url:
                res.official_portal_url = scheme.application_process.official_application_url
            else:
                res.official_portal_url = "https://mahadbt.maharashtra.gov.in/"

            res.short_description = scheme.short_description or (scheme.description[:200] + "..." if scheme.description else "")

            # Generate explanations
            res.explanations = ExplanationGenerator.generate_explanations(res)

            # Build match reasons
            reasons = []
            if res.status == OverallEligibilityStatus.ELIGIBLE:
                for cond in res.satisfied_conditions:
                    param_clean = cond.parameter.replace('_', ' ').title()
                    reasons.append(f"{param_clean} satisfies scheme condition ({cond.operator.value} {cond.required_value})")
            elif res.status == OverallEligibilityStatus.UNKNOWN:
                for missing in res.missing_information:
                    reasons.append(f"Requires confirmation of {missing.replace('_', ' ')}")
            elif res.status == OverallEligibilityStatus.NOT_ELIGIBLE:
                for cond in res.failed_conditions:
                    param_clean = cond.parameter.replace('_', ' ').title()
                    msg = cond.failure_message or f"Does not meet condition ({cond.operator.value} {cond.required_value})"
                    reasons.append(f"{param_clean}: {msg}")
            res.match_reasons = reasons

            # Partition results into collections
            if res.status == OverallEligibilityStatus.ELIGIBLE:
                eligible_schemes.append(res)
            elif res.status == OverallEligibilityStatus.UNKNOWN:
                unknown_schemes.append(res)
            elif res.status == OverallEligibilityStatus.NOT_ELIGIBLE:
                not_eligible_schemes.append(res)

        # 4. Recommended schemes ranking
        # Prioritize confirmed eligible schemes matching citizen's occupation and category
        user_occ = str(profile_data.get("occupation_type") or "").upper()
        user_cat = str(profile_data.get("caste_category") or "").upper()

        def recommendation_score(s: SchemeEvaluationResult) -> int:
            score = 0
            if s.status == OverallEligibilityStatus.ELIGIBLE:
                score += 100
            elif s.status == OverallEligibilityStatus.UNKNOWN:
                score += 20
            
            s_name_lower = s.scheme_name.lower()
            s_dept_lower = (s.department or "").lower()

            # Occupation match
            if user_occ == "STUDENT" and any(k in s_name_lower for k in ["scholarship", "shikshan", "shishyavrutti", "education", "vasatgruh", "fees"]):
                score += 50
            if user_occ == "FARMER" and any(k in s_name_lower for k in ["shetkari", "kisan", "krishi", "crop", "farm"]):
                score += 50

            # Caste category match
            if user_cat and user_cat in s_name_lower.upper():
                score += 40

            return score

        recommended = sorted(
            [s for s in eligible_schemes if s.status == OverallEligibilityStatus.ELIGIBLE],
            key=recommendation_score,
            reverse=True
        )[:5]

        # Mark recommended flag
        for s in recommended:
            s.is_recommended = True

        total_eval = len(eligible_schemes) + len(unknown_schemes) + len(not_eligible_schemes)

        return MatchingResponse(
            total_schemes_evaluated=total_eval,
            eligible_count=len(eligible_schemes),
            not_eligible_count=len(not_eligible_schemes),
            unknown_count=len(unknown_schemes),
            eligible=eligible_schemes,
            unknown=unknown_schemes,
            not_eligible=not_eligible_schemes,
            eligible_schemes=eligible_schemes,
            unknown_schemes=unknown_schemes,
            not_eligible_schemes=not_eligible_schemes,
            recommended_schemes=recommended,
            categories=sorted(list(all_categories)),
            departments=sorted(list(all_departments)),
            benefit_types=sorted(list(all_benefit_types)),
            education_levels=sorted(list(all_education_levels)),
            citizen_summary={
                "age": profile_data.get("age", 21),
                "state_code": profile_data.get("state_code", "IN-MH"),
                "annual_family_income": profile_data.get("annual_family_income", profile_data.get("annual_income", 220000)),
                "occupation_type": profile_data.get("occupation_type", "STUDENT"),
                "caste_category": profile_data.get("caste_category", "OBC"),
                "is_pwd": profile_data.get("is_pwd", False),
                "course_level": profile_data.get("course_level", "UNDERGRADUATE")
            },
            last_evaluated_at=datetime.utcnow().isoformat()
        )
