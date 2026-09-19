import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import SchemeStatus, AuditAction

class VerificationRecord(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "verification_records"

    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    verification_status: Mapped[SchemeStatus] = mapped_column(SQLEnum(SchemeStatus), nullable=False)
    verification_date: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    reviewer_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_reviewed: Mapped[str | None] = mapped_column(String(500), nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="verification_records")
    reviewer: Mapped["User | None"] = relationship("User")

class SchemeUpdate(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scheme_updates"

    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    changed_field: Mapped[str] = mapped_column(String(100), nullable=False)
    previous_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="updates")

class AuditLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "audit_logs"

    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[AuditAction] = mapped_column(SQLEnum(AuditAction), nullable=False)
    target_entity: Mapped[str] = mapped_column(String(100), nullable=False)
    target_id: Mapped[str] = mapped_column(String(36), nullable=False)
    payload: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
