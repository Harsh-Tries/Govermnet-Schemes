from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, model_validator

class MessageCreate(BaseModel):
    role: str # USER, ASSISTANT, SYSTEM, TOOL
    content: str
    metadata: dict[str, Any] | None = None

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    role: str
    content: str
    metadata: dict[str, Any] | None = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def extract_metadata(cls, data: Any) -> Any:
        # Prevent accessing Base.metadata (SQLAlchemy MetaData registry) instead of metadata_json
        if hasattr(data, "metadata_json"):
            return {
                "id": getattr(data, "id"),
                "conversation_id": getattr(data, "conversation_id"),
                "role": getattr(data, "role"),
                "content": getattr(data, "content"),
                "metadata": getattr(data, "metadata_json"),
                "created_at": getattr(data, "created_at")
            }
        return data

class ConversationCreate(BaseModel):
    title: str | None = "New Scheme Inquiry"
    user_id: str | None = None

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str | None = None
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []
