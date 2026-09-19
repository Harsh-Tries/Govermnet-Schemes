from pydantic import BaseModel, ConfigDict
from app.enums import BenefitType

class BenefitBase(BaseModel):
    benefit_type: BenefitType
    title: str
    description: str
    amount: float | None = None
    amount_unit: str | None = None
    frequency: str | None = None
    conditions: str | None = None

class BenefitCreate(BenefitBase):
    pass

class BenefitResponse(BenefitBase):
    id: str
    scheme_id: str
    model_config = ConfigDict(from_attributes=True)
