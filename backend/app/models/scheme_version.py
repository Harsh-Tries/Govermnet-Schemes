import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.base import Base

class SchemeVersion(Base):
    __tablename__ = "scheme_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheme_id = Column(String(36), ForeignKey("schemes.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False, default=1)
    
    effective_from = Column(DateTime, default=datetime.utcnow, nullable=False)
    effective_to = Column(DateTime, nullable=True)

    eligibility_snapshot = Column(JSON, nullable=True)
    benefits_snapshot = Column(JSON, nullable=True)
    documents_snapshot = Column(JSON, nullable=True)
    application_snapshot = Column(JSON, nullable=True)

    source = Column(String(255), nullable=True)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    change_summary = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    scheme = relationship("Scheme", backref="versions")
