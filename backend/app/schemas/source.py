import datetime
from pydantic import BaseModel, ConfigDict
from app.enums import SourceType, SourceStatus

class SourceBase(BaseModel):
    url: str
    source_type: SourceType
    authority: str
    title: str
    publication_date: datetime.date | None = None
    status: SourceStatus = SourceStatus.ACTIVE

class SourceCreate(SourceBase):
    pass

class SourceResponse(SourceBase):
    id: str
    last_checked_date: datetime.datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class SchemeSourceCreate(BaseModel):
    source_id: str
    notes: str | None = None

class SchemeSourceResponse(BaseModel):
    id: str
    scheme_id: str
    source_id: str
    notes: str | None = None
    source: SourceResponse | None = None
    model_config = ConfigDict(from_attributes=True)
