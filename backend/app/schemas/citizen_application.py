from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from app.enums import CitizenApplicationStatus

class ApplicationStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    old_status: str | None = None
    new_status: str
    title: str | None = None
    source: str = "CITIZEN_MANUAL"
    notes: str | None = None
    remarks: str | None = None
    created_by: str | None = None
    changed_at: datetime

class ApplicationDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    user_id: str | None = None
    document_name: str
    document_type: str
    mime_type: str | None = None
    file_size: int | None = None
    verification_status: str = "PENDING"
    uploaded_at: datetime
    download_url: str | None = None

class CitizenApplicationCreate(BaseModel):
    scheme_id: str
    application_reference: str = Field(..., min_length=3, max_length=100)
    application_type: str = Field(default="FRESH", pattern="^(FRESH|RENEWAL)$")
    application_date: datetime | None = None
    status: CitizenApplicationStatus = CitizenApplicationStatus.SUBMITTED
    department: str | None = None
    portal_url: str | None = None
    tracking_method: str = "MANUAL"
    notes: str | None = None

class CitizenApplicationUpdate(BaseModel):
    application_type: str | None = None
    department: str | None = None
    portal_url: str | None = None
    notes: str | None = None
    new_status: CitizenApplicationStatus | None = None
    rejection_reason: str | None = None
    action_required_details: str | None = None
    disbursement_details: str | None = None
    status_update_title: str | None = None
    status_update_remarks: str | None = None
    source: str = "CITIZEN_MANUAL"

class CitizenApplicationStatusUpdate(BaseModel):
    new_status: CitizenApplicationStatus
    title: str | None = None
    notes: str | None = None
    remarks: str | None = None
    source: str = "CITIZEN_MANUAL"

class CitizenApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None = None
    scheme_id: str
    application_reference: str
    application_type: str = "FRESH"
    application_date: datetime | None = None
    status: CitizenApplicationStatus
    department: str | None = None
    portal_url: str | None = None
    tracking_method: str = "MANUAL"
    last_synced_at: datetime | None = None
    rejection_reason: str | None = None
    action_required_details: str | None = None
    disbursement_details: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    status_history: list[ApplicationStatusHistoryResponse] = []
    documents: list[ApplicationDocumentResponse] = []
    scheme_name: str | None = None
    scheme_category: str | None = None
    scheme_portal_url: str | None = None
    latest_update: ApplicationStatusHistoryResponse | None = None
    progress_step: int = 1

class ApplicationSummaryResponse(BaseModel):
    total_applications: int = 0
    under_process: int = 0
    approved: int = 0
    action_required: int = 0
    rejected: int = 0
    withdrawn: int = 0
