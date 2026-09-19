import json
from typing import Type, TypeVar
from pydantic import BaseModel
from app.ai.providers.base import LLMProvider

T = TypeVar('T', bound=BaseModel)

class MockLocalProvider(LLMProvider):
    """
    Deterministic Mock LLM Provider for local development, offline usage, 
    and regression test suites without external API key dependencies.
    """

    async def generate_response(
        self, 
        messages: list[dict[str, str]], 
        system_prompt: str | None = None,
        temperature: float = 0.2
    ) -> str:
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").lower()
                break

        if "scholarship" in last_user_msg or "student" in last_user_msg:
            return "Based on verified government records, we found matching scholarships for students."
        elif "farmer" in last_user_msg or "kisan" in last_user_msg:
            return "Based on verified government records, PM-KISAN provides income support of ₹6,000 per year to eligible farmers."
        elif "document" in last_user_msg:
            return "Required documents include Aadhaar Card, Income Certificate, and Domicile Certificate."
        elif "apply" in last_user_msg:
            return "Applications can be submitted on the official government portal."
        elif "why am i not eligible" in last_user_msg or "not eligible" in last_user_msg:
            return "You do not meet the eligibility requirements for age or annual family income."
        else:
            return "I am the Government Scheme Assistant. How can I help you find eligible schemes today?"

    async def generate_structured_output(
        self, 
        messages: list[dict[str, str]], 
        response_model: Type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0
    ) -> T:
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").lower()
                break

        # Check target response model name
        model_name = response_model.__name__

        if model_name == "IntentDetectionResult":
            intent = "GENERAL_GOVERNMENT_SCHEME_QUERY"
            confidence = 0.95
            if "scholarship" in last_user_msg or "find" in last_user_msg or "schemes" in last_user_msg:
                intent = "SCHEME_SEARCH"
            elif "eligible" in last_user_msg or "qualify" in last_user_msg:
                if "why" in last_user_msg or "not" in last_user_msg:
                    intent = "WHY_NOT_ELIGIBLE"
                else:
                    intent = "ELIGIBILITY_CHECK"
            elif "document" in last_user_msg:
                intent = "DOCUMENT_QUERY"
            elif "apply" in last_user_msg or "how to" in last_user_msg:
                intent = "APPLICATION_GUIDANCE"
            elif "benefit" in last_user_msg:
                intent = "BENEFIT_QUERY"
            elif "compare" in last_user_msg:
                intent = "COMPARE_SCHEMES"

            return response_model(
                intent=intent,
                confidence=confidence,
                reasoning="Mock provider rule-based intent classification."
            )  # type: ignore

        elif model_name == "EntityExtractionResult":
            entities: dict = {}
            if "maharashtra" in last_user_msg:
                entities["state_code"] = "MH"
            elif "madhya pradesh" in last_user_msg or "mp" in last_user_msg:
                entities["state_code"] = "MP"
            elif "karnataka" in last_user_msg:
                entities["state_code"] = "KA"

            if "farmer" in last_user_msg:
                entities["occupation_type"] = "FARMER"
            elif "student" in last_user_msg:
                entities["occupation_type"] = "STUDENT"
            elif "entrepreneur" in last_user_msg:
                entities["occupation_type"] = "ENTREPRENEUR"

            if "2 lakh" in last_user_msg or "200000" in last_user_msg:
                entities["annual_income"] = 200000
            elif "2.5 lakh" in last_user_msg:
                entities["annual_income"] = 250000

            if "21" in last_user_msg:
                entities["age"] = 21
            elif "18" in last_user_msg:
                entities["age"] = 18
            elif "16" in last_user_msg:
                entities["age"] = 16

            return response_model(
                entities=entities,
                extracted_scheme_names=[],
                unrecognized_parameters=[]
            )  # type: ignore

        # Default fallback instantiation
        try:
            return response_model()  # type: ignore
        except Exception:
            # Construct empty dict if default instantiation requires fields
            field_defaults = {}
            for field_name, field in response_model.model_fields.items():
                if field.annotation is str:
                    field_defaults[field_name] = "MOCK_VALUE"
                elif field.annotation is int or field.annotation is float:
                    field_defaults[field_name] = 0
                elif field.annotation is list:
                    field_defaults[field_name] = []
                elif field.annotation is dict:
                    field_defaults[field_name] = {}
                else:
                    field_defaults[field_name] = None
            return response_model(**field_defaults)

    async def generate_embedding(self, text: str) -> list[float]:
        # Return 1536-dimensional mock zero vector
        return [0.0] * 1536
