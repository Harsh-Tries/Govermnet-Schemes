from enum import Enum
from typing import Any
from pydantic import BaseModel, Field

class AssistantIntent(str, Enum):
    SCHEME_SEARCH = "SCHEME_SEARCH"
    ELIGIBILITY_CHECK = "ELIGIBILITY_CHECK"
    SCHEME_DETAILS = "SCHEME_DETAILS"
    BENEFIT_QUERY = "BENEFIT_QUERY"
    DOCUMENT_QUERY = "DOCUMENT_QUERY"
    APPLICATION_GUIDANCE = "APPLICATION_GUIDANCE"
    PROFILE_UPDATE = "PROFILE_UPDATE"
    COMPARE_SCHEMES = "COMPARE_SCHEMES"
    WHY_NOT_ELIGIBLE = "WHY_NOT_ELIGIBLE"
    GENERAL_GOVERNMENT_SCHEME_QUERY = "GENERAL_GOVERNMENT_SCHEME_QUERY"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED"

class IntentDetectionResult(BaseModel):
    intent: AssistantIntent
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    reasoning: str | None = None

class EntityExtractionResult(BaseModel):
    entities: dict[str, Any] = Field(default_factory=dict)
    extracted_scheme_names: list[str] = Field(default_factory=list)
    unrecognized_parameters: list[str] = Field(default_factory=list)

class AssistantQueryRequest(BaseModel):
    conversation_id: str | None = None
    query: str
    user_id: str | None = None
    profile_override: dict[str, Any] | None = None

class SchemeSummaryDTO(BaseModel):
    id: str
    name: str
    short_description: str | None = None
    government_level: str
    official_source: str | None = None
    last_verified_date: str | None = None

class SourceInfoDTO(BaseModel):
    title: str
    url: str
    last_verified: str | None = None

class AssistantQueryResponse(BaseModel):
    message: str
    intent: AssistantIntent
    schemes: list[dict[str, Any]] = Field(default_factory=list)
    eligibility_results: list[dict[str, Any]] = Field(default_factory=list)
    missing_information: list[str] = Field(default_factory=list)
    sources: list[SourceInfoDTO] = Field(default_factory=list)
    requires_clarification: bool = False
    conversation_id: str | None = None
