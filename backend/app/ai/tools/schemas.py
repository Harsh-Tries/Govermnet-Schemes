from typing import Any
from pydantic import BaseModel, Field

class SearchSchemesInput(BaseModel):
    query: str | None = None
    state: str | None = None
    category: str | None = None
    profession: str | None = None
    beneficiary_type: str | None = None

class SearchSchemesOutput(BaseModel):
    schemes: list[dict[str, Any]] = Field(default_factory=list)

class GetSchemeDetailsInput(BaseModel):
    scheme_id: str | None = None
    scheme_name: str | None = None

class EvaluateEligibilityInput(BaseModel):
    scheme_id: str | None = None
    profile: dict[str, Any]

class GetRequiredDocumentsInput(BaseModel):
    scheme_id: str

class GetApplicationProcessInput(BaseModel):
    scheme_id: str

class CompareSchemesInput(BaseModel):
    scheme_ids: list[str]
