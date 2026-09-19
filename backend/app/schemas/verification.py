import datetime
from pydantic import BaseModel, ConfigDict
from app.enums import SchemeStatus, VerificationAction, AuditAction

class VerificationRequest(BaseModel):
    action: VerificationAction
    notes: str | None = None
    source_reviewed: str | None = None

class VerificationRecordResponse(BaseModel):
    id: str
    scheme_id: str
    verification_status: SchemeStatus
    verification_date: datetime.datetime
    reviewer_id: str | None = None
    notes: str | None = None
    source_reviewed: str | None = None
    model_config = ConfigDict(from_attributes=True)

class SchemeUpdateResponse(BaseModel):
    id: str
    scheme_id: str
    changed_field: str
    previous_value: str | None = None
    new_value: str | None = None
    changed_by: str | None = None
    reason: str | None = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: str
    user_id: str | None = None
    action: AuditAction
    target_entity: str
    target_id: str
    payload: dict | list | None = None
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)
