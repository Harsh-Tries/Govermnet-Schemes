from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict

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
