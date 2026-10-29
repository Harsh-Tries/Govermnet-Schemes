from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import CitizenApplicationStatus

class CitizenApplication(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "citizen_applications"

    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    application_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    application_type: Mapped[str] = mapped_column(String(20), default="FRESH", nullable=False)
    application_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[CitizenApplicationStatus] = mapped_column(SQLEnum(CitizenApplicationStatus), default=CitizenApplicationStatus.SUBMITTED, nullable=False)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    portal_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tracking_method: Mapped[str] = mapped_column(String(50), default="MANUAL", nullable=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_required_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    disbursement_details: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme")
    status_history: Mapped[list["ApplicationStatusHistory"]] = relationship(
        "ApplicationStatusHistory", 
        back_populates="application", 
        cascade="all, delete-orphan",
        order_by="ApplicationStatusHistory.changed_at.desc()"
    )
    documents: Mapped[list["ApplicationDocument"]] = relationship(
        "ApplicationDocument",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationDocument.uploaded_at.desc()"
    )

class ApplicationStatusHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "application_status_history"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("citizen_applications.id", ondelete="CASCADE"), nullable=False)
    old_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(50), default="CITIZEN_MANUAL", nullable=False)  # CITIZEN_MANUAL, ADMIN_VERIFICATION, OFFICIAL_INTEGRATION
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    application: Mapped["CitizenApplication"] = relationship("CitizenApplication", back_populates="status_history")

class ApplicationDocument(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "application_documents"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("citizen_applications.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    application: Mapped["CitizenApplication"] = relationship("CitizenApplication", back_populates="documents")
