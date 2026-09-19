from typing import Any

class ClarificationEngine:
    """
    Clarification Service for missing profile parameters.
    Uses Phase 3 UNKNOWN and missing_information results to generate precise,
    non-overwhelming citizen prompts.
    """

    @staticmethod
    def generate_clarification_prompt(scheme_name: str, missing_params: list[str]) -> str:
        if not missing_params:
            return "Could you please clarify your request?"

        formatted_params = [p.replace('_', ' ') for p in missing_params]

        if len(formatted_params) == 1:
            param_str = formatted_params[0]
            return f"To determine your eligibility for **{scheme_name}**, could you please provide your approximate **{param_str}**?"
        else:
            param_list_str = ", ".join([f"**{p}**" for p in formatted_params[:-1]]) + f" and **{formatted_params[-1]}**"
            return f"To accurately evaluate your eligibility for **{scheme_name}**, I need a bit more information. Could you please provide your {param_list_str}?"
