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
    
    # Metadata details for UI cards & filters
    short_description: str | None = None
    department: str | None = None
    category: str | None = None
    beneficiary_types: list[str] = []
    categories: list[str] = []
    benefits: list[dict] = []
    education_levels: list[str] = []
    benefit_type: str | None = None
    benefit_description: str | None = None
    official_portal_url: str | None = None
    is_recommended: bool = False
    match_reasons: list[str] = []

    model_config = ConfigDict(from_attributes=True)

class MatchingResponse(BaseModel):
    total_schemes_evaluated: int = 0
    eligible_count: int = 0
    not_eligible_count: int = 0
    unknown_count: int = 0

    # Primary collections for frontend
    eligible: list[SchemeEvaluationResult] = []
    unknown: list[SchemeEvaluationResult] = []
    not_eligible: list[SchemeEvaluationResult] = []

    # Backward compatibility aliases
    eligible_schemes: list[SchemeEvaluationResult] = []
    unknown_schemes: list[SchemeEvaluationResult] = []
    not_eligible_schemes: list[SchemeEvaluationResult] = []

    # High-relevance recommended subset
    recommended_schemes: list[SchemeEvaluationResult] = []

    # Available taxonomies for multi-dimensional filters
    categories: list[str] = []
    departments: list[str] = []
    benefit_types: list[str] = []
    education_levels: list[str] = []

    # Metadata
    citizen_summary: dict[str, Any] | None = None
    last_evaluated_at: str | None = None

class ProfileCompletenessResponse(BaseModel):
    overall_completeness_pct: float
    provided_parameters: list[str] = []
    missing_parameters: list[str] = []
    scheme_relevant_missing_parameters: list[str] = []
