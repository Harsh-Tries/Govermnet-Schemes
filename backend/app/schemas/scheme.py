import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, model_validator
from app.enums import GovernmentLevel, SchemeType, SchemeStatus
from app.schemas.taxonomy import CategoryResponse, BeneficiaryResponse, ProfessionResponse
from app.schemas.benefit import BenefitResponse
from app.schemas.document import SchemeDocumentResponse
from app.schemas.application import ApplicationProcessResponse
from app.schemas.source import SchemeSourceResponse

class SchemeBase(BaseModel):
    name: str
    short_description: str
    description: str | None = None
    government_level: GovernmentLevel = GovernmentLevel.CENTRAL
    scheme_type: SchemeType = SchemeType.GRANT
    administering_ministry: str | None = None
    funding_ratio: str | None = None

class SchemeCreate(SchemeBase):
    slug: str
    category_ids: list[str] = []
    beneficiary_type_ids: list[str] = []
    profession_ids: list[str] = []
    state_codes: list[str] = []
    district_ids: list[str] = []

class SchemeUpdateSchema(BaseModel):
    name: str | None = None
    short_description: str | None = None
    description: str | None = None
    government_level: GovernmentLevel | None = None
    scheme_type: SchemeType | None = None
    administering_ministry: str | None = None
    funding_ratio: str | None = None
    category_ids: list[str] | None = None
    beneficiary_type_ids: list[str] | None = None
    profession_ids: list[str] | None = None
    state_codes: list[str] | None = None
    district_ids: list[str] | None = None

class SchemeResponse(SchemeBase):
    id: str
    slug: str
    status: SchemeStatus
    created_at: datetime.datetime
    updated_at: datetime.datetime
    published_at: datetime.datetime | None = None

    categories: list[CategoryResponse] = []
    beneficiaries: list[BeneficiaryResponse] = []
    professions: list[ProfessionResponse] = []
    benefits: list[BenefitResponse] = []
    documents: list[SchemeDocumentResponse] = []
    application_process: ApplicationProcessResponse | None = None
    sources: list[SchemeSourceResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def format_associations(cls, data: Any) -> Any:
        if hasattr(data, "categories") and not isinstance(data, dict):
            cats = [c.category for c in getattr(data, "categories", []) if hasattr(c, "category") and c.category]
            bens = [b.beneficiary_type for b in getattr(data, "beneficiaries", []) if hasattr(b, "beneficiary_type") and b.beneficiary_type]
            profs = [p.profession for p in getattr(data, "professions", []) if hasattr(p, "profession") and p.profession]
            return {
                "id": data.id,
                "name": data.name,
                "slug": data.slug,
                "short_description": data.short_description,
                "description": data.description,
                "government_level": data.government_level,
                "scheme_type": data.scheme_type,
                "status": data.status,
                "administering_ministry": data.administering_ministry,
                "funding_ratio": data.funding_ratio,
                "created_at": data.created_at,
                "updated_at": data.updated_at,
                "published_at": data.published_at,
                "categories": cats,
                "beneficiaries": bens,
                "professions": profs,
                "benefits": getattr(data, "benefits", []),
                "documents": getattr(data, "documents", []),
                "application_process": getattr(data, "application_process", None),
                "sources": getattr(data, "sources", [])
            }
        return data

class SchemePublishValidation(BaseModel):
    """
    Contextual validator used before allowing a scheme to transition to PUBLISHED status.
    """
    name: str
    short_description: str
    government_level: GovernmentLevel
    has_categories: bool
    has_beneficiaries: bool
    has_sources: bool
    is_source_verified: bool

    @model_validator(mode="after")
    def validate_publishable(self):
        errors = []
        if not self.name or len(self.name.strip()) < 3:
            errors.append("Valid scheme name is required.")
        if not self.short_description or len(self.short_description.strip()) < 10:
            errors.append("Short description of at least 10 characters is required.")
        if not self.has_categories:
            errors.append("At least one Scheme Category must be mapped before publishing.")
        if not self.has_beneficiaries:
            errors.append("At least one Beneficiary Type must be mapped before publishing.")
        if not self.has_sources:
            errors.append("At least one Official Source must be attached before publishing.")
        if not self.is_source_verified:
            errors.append("Scheme must undergo source verification (SOURCE_VERIFIED or APPROVED) before publication.")

        if errors:
            raise ValueError("; ".join(errors))
        return self
