from app.schemas.intelligence import SchemeEvaluationResult, OverallEligibilityStatus, ConditionStatus

class ExplanationGenerator:
    """
    Deterministic explanation layer converting rule condition evaluation results 
    into clear human-readable explanations without LLM reliance.
    """

    @staticmethod
    def generate_explanations(result: SchemeEvaluationResult) -> list[str]:
        explanations: list[str] = []

        if result.status == OverallEligibilityStatus.ELIGIBLE:
            explanations.append("✓ You appear eligible for this scheme!")
            for cond in result.satisfied_conditions:
                display_param = cond.parameter.replace('_', ' ').capitalize()
                explanations.append(f"✓ {display_param} requirement satisfied ({cond.user_value})")

        elif result.status == OverallEligibilityStatus.NOT_ELIGIBLE:
            explanations.append("✗ Current profile does not satisfy the requirements:")
            for cond in result.failed_conditions:
                display_param = cond.parameter.replace('_', ' ').capitalize()
                if cond.failure_message:
                    explanations.append(f"✗ {cond.failure_message}")
                else:
                    explanations.append(f"✗ {display_param} requirement failed: required {cond.operator.value} {cond.required_value}, your profile indicates {cond.user_value}")

            # Optionally list satisfied rules for context
            for cond in result.satisfied_conditions:
                display_param = cond.parameter.replace('_', ' ').capitalize()
                explanations.append(f"✓ {display_param} requirement satisfied")

        elif result.status == OverallEligibilityStatus.UNKNOWN:
            if result.missing_information and "Structured eligibility rules are unavailable." in result.missing_information:
                explanations.append("? Structured eligibility rules are unavailable for this scheme.")
                explanations.append("Please inspect the official source portal for authoritative guidelines.")
            else:
                explanations.append("? Eligibility cannot yet be determined due to missing profile information:")
                for param in result.missing_information:
                    display_param = param.replace('_', ' ').capitalize()
                    explanations.append(f"? {display_param} is required to evaluate eligibility")

                for cond in result.satisfied_conditions:
                    display_param = cond.parameter.replace('_', ' ').capitalize()
                    explanations.append(f"✓ {display_param} requirement already satisfied")

        return explanations
