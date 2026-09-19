import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, Text
from app.db.base import Base

class GovernmentIntegration(Base):
    __tablename__ = "government_integrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    department = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    base_url = Column(String(512), nullable=False)
    api_version = Column(String(50), default="v1")
    status = Column(String(50), default="ACTIVE") # ACTIVE, MAINTENANCE, INACTIVE
    capabilities = Column(JSON, default=list) # e.g. ["STATUS_LOOKUP", "APPLICATION_SUBMISSION"]
    authentication_type = Column(String(50), default="BEARER_TOKEN") # OAUTH2, API_KEY, BEARER_TOKEN
    last_sync = Column(DateTime, nullable=True)
    sync_status = Column(String(50), default="SUCCESS")
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
