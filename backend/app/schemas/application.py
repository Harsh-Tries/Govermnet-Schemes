from pydantic import BaseModel, ConfigDict
from app.enums import ApplicationMode

class StepBase(BaseModel):
    step_number: int
    title: str
    instructions: str

class StepCreate(StepBase):
    pass

class StepResponse(StepBase):
    id: str
    process_id: str
    model_config = ConfigDict(from_attributes=True)

class ApplicationProcessBase(BaseModel):
    application_mode: ApplicationMode = ApplicationMode.ONLINE
    official_application_url: str | None = None
    authority: str | None = None
    instructions: str | None = None

class ApplicationProcessCreate(ApplicationProcessBase):
    steps: list[StepCreate] = []

class ApplicationProcessResponse(ApplicationProcessBase):
    id: str
    scheme_id: str
    steps: list[StepResponse] = []
    model_config = ConfigDict(from_attributes=True)
