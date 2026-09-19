from sqlalchemy import String, Text, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import ApplicationMode

class ApplicationProcess(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "application_processes"

    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), unique=True, nullable=False)
    application_mode: Mapped[ApplicationMode] = mapped_column(SQLEnum(ApplicationMode), default=ApplicationMode.ONLINE, nullable=False)
    official_application_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    authority: Mapped[str | None] = mapped_column(String(255), nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="application_process")
    steps: Mapped[list["ApplicationStep"]] = relationship("ApplicationStep", back_populates="process", cascade="all, delete-orphan", order_by="ApplicationStep.step_number")

class ApplicationStep(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "application_steps"

    process_id: Mapped[str] = mapped_column(String(36), ForeignKey("application_processes.id", ondelete="CASCADE"), nullable=False)
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)

    process: Mapped["ApplicationProcess"] = relationship("ApplicationProcess", back_populates="steps")
