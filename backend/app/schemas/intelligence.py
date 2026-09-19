import enum
import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict
from app.enums import RuleOperator

class ConditionStatus(str, enum.Enum):
    SATISFIED = "SATISFIED"
    FAILED = "FAILED"
    MISSING = "MISSING"
    INVALID = "INVALID"

class OverallEligibilityStatus(str, enum.Enum):
    ELIGIBLE = "ELIGIBLE"
    NOT_ELIGIBLE = "NOT_ELIGIBLE"
    UNKNOWN = "UNKNOWN"

class ConditionResult(BaseModel):
    parameter: str
    operator: RuleOperator
    required_value: Any
    user_value: Any | None = None
    status: ConditionStatus
    failure_message: str | None = None

class SchemeEvaluationResult(BaseModel):
    scheme_id: str
    scheme_name: str
    status: OverallEligibilityStatus
    satisfied_conditions: list[ConditionResult] = []
    failed_conditions: list[ConditionResult] = []
    missing_information: list[str] = []
    explanations: list[str] = []
    official_source: str | None = None
    last_verified_date: str | None = None
    
    # Metadata details for UI cards
    short_description: str | None = None
    beneficiary_types: list[str] = []
    categories: list[str] = []
    benefits: list[dict] = []

    model_config = ConfigDict(from_attributes=True)

class MatchingResponse(BaseModel):
    eligible_schemes: list[SchemeEvaluationResult] = []
    unknown_schemes: list[SchemeEvaluationResult] = []
    not_eligible_schemes: list[SchemeEvaluationResult] = []

class ProfileCompletenessResponse(BaseModel):
    overall_completeness_pct: float
    provided_parameters: list[str] = []
    missing_parameters: list[str] = []
    scheme_relevant_missing_parameters: list[str] = []
