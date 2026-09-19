from typing import Any
from app.models import Scheme, EligibilityRuleGroup, EligibilityRule, EligibilityParameter
from app.enums import RuleOperator
from app.schemas.intelligence import (
    ConditionStatus, OverallEligibilityStatus, 
    ConditionResult, SchemeEvaluationResult
)
from app.services.eligibility.validator import RuleValidator, RuleValidationError

class DeterministicEligibilityEvaluator:
    """
    Core deterministic eligibility engine executing formal boolean & comparison logic 
    over user profiles against structured scheme rules.
    """

    @staticmethod
    def _extract_profile_value(profile_data: dict, parameter_name: str) -> Any:
        """Helper to extract parameter values from profile dicts or custom attributes."""
        if not profile_data:
            return None

        # Standard field lookup
        if parameter_name in profile_data:
            val = profile_data[parameter_name]
            return val if val is not None else None

        # State code alias lookup
        if parameter_name == "state" and "state_code" in profile_data:
            return profile_data["state_code"]

        # Occupation / Beneficiary type alias lookup
        if parameter_name == "student_status" and "occupation_type" in profile_data:
            if profile_data["occupation_type"] == "STUDENT":
                return True

        if parameter_name == "farmer_status" and "occupation_type" in profile_data:
            if profile_data["occupation_type"] == "FARMER":
                return True

        # Custom attributes lookup
        custom = profile_data.get("custom_attributes")
        if isinstance(custom, dict) and parameter_name in custom:
            return custom[parameter_name]

        return None

    @classmethod
    def evaluate_rule(cls, rule: EligibilityRule, profile_data: dict, param_metadata: EligibilityParameter | None = None) -> ConditionResult:
        param_name = rule.parameter_name
        operator = rule.operator
        req_val = rule.comparison_value
        user_val = cls._extract_profile_value(profile_data, param_name)

        # Rule validation check
        try:
            RuleValidator.validate_rule(param_name, operator, req_val, param_metadata)
        except RuleValidationError as e:
            return ConditionResult(
                parameter=param_name,
                operator=operator,
                required_value=req_val,
                user_value=user_val,
                status=ConditionStatus.INVALID,
                failure_message=str(e)
            )

        # Handle missing information
        if user_val is None:
            return ConditionResult(
                parameter=param_name,
                operator=operator,
                required_value=req_val,
                user_value=None,
                status=ConditionStatus.MISSING,
                failure_message=f"Missing required parameter: '{param_name}'"
            )

        # Comparison logic execution
        satisfied = False
        try:
            if operator == RuleOperator.EQUALS:
                satisfied = (user_val == req_val)
            elif operator == RuleOperator.NOT_EQUALS:
                satisfied = (user_val != req_val)
            elif operator == RuleOperator.GREATER_THAN:
                satisfied = (user_val > req_val)
            elif operator == RuleOperator.GREATER_THAN_OR_EQUAL:
                satisfied = (user_val >= req_val)
            elif operator == RuleOperator.LESS_THAN:
                satisfied = (user_val < req_val)
            elif operator == RuleOperator.LESS_THAN_OR_EQUAL:
                satisfied = (user_val <= req_val)
            elif operator == RuleOperator.IN:
                if isinstance(req_val, (list, tuple, set)):
                    satisfied = user_val in req_val
                else:
                    satisfied = (user_val == req_val)
            elif operator == RuleOperator.NOT_IN:
                if isinstance(req_val, (list, tuple, set)):
                    satisfied = user_val not in req_val
                else:
                    satisfied = (user_val != req_val)
            elif operator == RuleOperator.BETWEEN:
                if isinstance(req_val, (list, tuple)) and len(req_val) == 2:
                    satisfied = (req_val[0] <= user_val <= req_val[1])
            elif operator == RuleOperator.CONTAINS:
                if isinstance(user_val, (list, tuple, str)):
                    satisfied = req_val in user_val
                elif isinstance(req_val, (list, tuple, str)):
                    satisfied = user_val in req_val

        except Exception as e:
            return ConditionResult(
                parameter=param_name,
                operator=operator,
                required_value=req_val,
                user_value=user_val,
                status=ConditionStatus.INVALID,
                failure_message=f"Type comparison error: {str(e)}"
            )

        status = ConditionStatus.SATISFIED if satisfied else ConditionStatus.FAILED
        failure_msg = None if satisfied else (rule.failure_message or f"Parameter '{param_name}' value {user_val} failed condition {operator} {req_val}")

        return ConditionResult(
            parameter=param_name,
            operator=operator,
            required_value=req_val,
            user_value=user_val,
            status=status,
            failure_message=failure_msg
        )

    @classmethod
    def evaluate_rule_group(cls, group: EligibilityRuleGroup, profile_data: dict, param_map: dict | None = None) -> tuple[ConditionStatus, list[ConditionResult]]:
        """
        Recursively evaluates rule groups supporting nested AND/OR tree logic.
        Returns combined group status (SATISFIED, FAILED, MISSING) and flat list of ConditionResults.
        """
        direct_rule_results: list[ConditionResult] = []
        logical_op = (group.logical_operator or "AND").upper()

        # 1. Evaluate direct rules in group
        for rule in group.rules:
            meta = param_map.get(rule.parameter_name) if param_map else None
            res = cls.evaluate_rule(rule, profile_data, meta)
            direct_rule_results.append(res)

        # 2. Evaluate child groups recursively
        child_group_results: list[ConditionResult] = []
        child_statuses: list[ConditionStatus] = []
        for child_grp in getattr(group, "child_groups", []):
            c_status, c_results = cls.evaluate_rule_group(child_grp, profile_data, param_map)
            child_group_results.extend(c_results)
            child_statuses.append(c_status)

        all_results = direct_rule_results + child_group_results
        item_statuses = [r.status for r in direct_rule_results] + child_statuses

        if not item_statuses:
            return ConditionStatus.SATISFIED, all_results

        if logical_op == "OR":
            # OR Logic:
            # - If at least 1 condition is SATISFIED -> SATISFIED
            # - If all conditions are FAILED -> FAILED
            # - If no condition satisfied and at least 1 is MISSING -> MISSING
            if any(s == ConditionStatus.SATISFIED for s in item_statuses):
                return ConditionStatus.SATISFIED, all_results
            elif all(s == ConditionStatus.FAILED for s in item_statuses):
                return ConditionStatus.FAILED, all_results
            elif any(s == ConditionStatus.MISSING for s in item_statuses):
                return ConditionStatus.MISSING, all_results
            else:
                return ConditionStatus.FAILED, all_results

        else: # Default AND Logic
            # AND Logic:
            # - If any required condition fails -> FAILED
            # - If no failure, but 1+ condition is MISSING -> MISSING
            # - If all conditions SATISFIED -> SATISFIED
            if any(s == ConditionStatus.FAILED for s in item_statuses):
                return ConditionStatus.FAILED, all_results
            elif any(s == ConditionStatus.MISSING for s in item_statuses):
                return ConditionStatus.MISSING, all_results
            else:
                return ConditionStatus.SATISFIED, all_results

    @classmethod
    def evaluate_scheme(cls, scheme: Scheme, profile_data: dict, param_map: dict | None = None) -> SchemeEvaluationResult:
        """
        Evaluates a complete Scheme master record against a user profile dict.
        Returns a structured SchemeEvaluationResult schema.
        """
        sources = [s.source.url for s in scheme.sources if s.source]
        official_src = sources[0] if sources else None
        verified_date = scheme.published_at.strftime("%Y-%m-%d") if scheme.published_at else None

        # Check if scheme has explicit rule groups
        if not scheme.rule_groups:
            return SchemeEvaluationResult(
                scheme_id=scheme.id,
                scheme_name=scheme.name,
                status=OverallEligibilityStatus.UNKNOWN,
                satisfied_conditions=[],
                failed_conditions=[],
                missing_information=["Structured eligibility rules are unavailable."],
                explanations=["? Structured eligibility rules are unavailable for this scheme."],
                official_source=official_src,
                last_verified_date=verified_date,
                short_description=scheme.short_description
            )

        # Evaluate top-level rule groups
        group_results: list[ConditionResult] = []
        overall_group_statuses: list[ConditionStatus] = []

        for group in scheme.rule_groups:
            g_status, g_conds = cls.evaluate_rule_group(group, profile_data, param_map)
            overall_group_statuses.append(g_status)
            group_results.extend(g_conds)

        # Separate condition results
        satisfied_conds = [c for c in group_results if c.status == ConditionStatus.SATISFIED]
        failed_conds = [c for c in group_results if c.status == ConditionStatus.FAILED]
        missing_params = list(set([c.parameter for c in group_results if c.status == ConditionStatus.MISSING]))

        # Map to overall status
        if any(s == ConditionStatus.FAILED for s in overall_group_statuses):
            final_status = OverallEligibilityStatus.NOT_ELIGIBLE
        elif any(s == ConditionStatus.MISSING for s in overall_group_statuses):
            final_status = OverallEligibilityStatus.UNKNOWN
        else:
            final_status = OverallEligibilityStatus.ELIGIBLE

        return SchemeEvaluationResult(
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            status=final_status,
            satisfied_conditions=satisfied_conds,
            failed_conditions=failed_conds,
            missing_information=missing_params,
            explanations=[], # Will be populated by ExplanationGenerator
            official_source=official_src,
            last_verified_date=verified_date,
            short_description=scheme.short_description
        )
