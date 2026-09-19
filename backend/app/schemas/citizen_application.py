from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict
from app.enums import CitizenApplicationStatus

class ApplicationStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    old_status: str | None = None
    new_status: str
    source: str
    notes: str | None = None
    changed_at: datetime

class CitizenApplicationCreate(BaseModel):
    scheme_id: str
    application_reference: str
    application_date: datetime | None = None
    status: CitizenApplicationStatus = CitizenApplicationStatus.SUBMITTED
    department: str | None = None
    portal_url: str | None = None
    notes: str | None = None

class CitizenApplicationStatusUpdate(BaseModel):
    new_status: CitizenApplicationStatus
    notes: str | None = None
    source: str = "CITIZEN_MANUAL"

class CitizenApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None = None
    scheme_id: str
    application_reference: str
    application_date: datetime | None = None
    status: CitizenApplicationStatus
    department: str | None = None
    portal_url: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    status_history: list[ApplicationStatusHistoryResponse] = []
    scheme_name: str | None = None
