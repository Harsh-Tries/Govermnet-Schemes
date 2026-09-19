from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import CitizenApplicationStatus

class CitizenApplication(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "citizen_applications"

    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    application_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    application_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[CitizenApplicationStatus] = mapped_column(SQLEnum(CitizenApplicationStatus), default=CitizenApplicationStatus.SUBMITTED, nullable=False)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    portal_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme")
    status_history: Mapped[list["ApplicationStatusHistory"]] = relationship(
        "ApplicationStatusHistory", 
        back_populates="application", 
        cascade="all, delete-orphan",
        order_by="ApplicationStatusHistory.changed_at.desc()"
    )

class ApplicationStatusHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "application_status_history"

    application_id: Mapped[str] = mapped_column(String(36), ForeignKey("citizen_applications.id", ondelete="CASCADE"), nullable=False)
    old_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="CITIZEN_MANUAL", nullable=False) # CITIZEN_MANUAL vs OFFICIAL_INTEGRATION
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    application: Mapped["CitizenApplication"] = relationship("CitizenApplication", back_populates="status_history")
