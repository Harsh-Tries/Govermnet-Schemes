from pydantic import BaseModel, ConfigDict

class StateBase(BaseModel):
    code: str
    name: str
    type: str = "STATE"

class StateResponse(StateBase):
    model_config = ConfigDict(from_attributes=True)

class DistrictBase(BaseModel):
    name: str
    state_code: str

class DistrictResponse(DistrictBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class CategoryBase(BaseModel):
    code: str
    name: str
    description: str | None = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class BeneficiaryBase(BaseModel):
    code: str
    name: str
    description: str | None = None

class BeneficiaryCreate(BeneficiaryBase):
    pass

class BeneficiaryResponse(BeneficiaryBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class ProfessionBase(BaseModel):
    code: str
    name: str
    description: str | None = None

class ProfessionCreate(ProfessionBase):
    pass

class ProfessionResponse(ProfessionBase):
    id: str
    model_config = ConfigDict(from_attributes=True)
