from typing import Any
from app.models import Scheme
from app.schemas.intelligence import ProfileCompletenessResponse

STANDARD_PROFILE_FIELDS = [
    "age", "gender", "marital_status", "state_code", "district_name", 
    "residency_area", "annual_family_income", "caste_category", 
    "occupation_type", "education_level", "is_pwd", 
    "disability_percentage", "landholding_acres"
]

class ProfileCompletenessService:
    """
    Profile completeness service evaluating provided vs missing profile parameters, 
    and identifying scheme-specific relevant missing fields.
    """

    @staticmethod
    def calculate_completeness(profile_data: dict, candidate_schemes: list[Scheme] = None) -> ProfileCompletenessResponse:
        provided = []
        missing = []

        for field in STANDARD_PROFILE_FIELDS:
            val = profile_data.get(field)
            if val is not None:
                provided.append(field)
            else:
                missing.append(field)

        overall_pct = round((len(provided) / len(STANDARD_PROFILE_FIELDS)) * 100, 1) if STANDARD_PROFILE_FIELDS else 100.0

        # Extract scheme-specific required parameters
        scheme_relevant_missing = set()
        if candidate_schemes:
            for scheme in candidate_schemes:
                for group in getattr(scheme, "rule_groups", []):
                    for rule in getattr(group, "rules", []):
                        param = rule.parameter_name
                        user_val = profile_data.get(param)
                        if user_val is None and param == "state":
                            user_val = profile_data.get("state_code")
                        if user_val is None:
                            scheme_relevant_missing.add(param)

        return ProfileCompletenessResponse(
            overall_completeness_pct=overall_pct,
            provided_parameters=provided,
            missing_parameters=missing,
            scheme_relevant_missing_parameters=sorted(list(scheme_relevant_missing))
        )
