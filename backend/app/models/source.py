import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import SourceType, SourceStatus

class OfficialSource(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "official_sources"

    url: Mapped[str] = mapped_column(String(500), nullable=False)
    source_type: Mapped[SourceType] = mapped_column(SQLEnum(SourceType), nullable=False)
    authority: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    publication_date: Mapped[datetime.date | None] = mapped_column(DateTime, nullable=True)
    last_checked_date: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[SourceStatus] = mapped_column(SQLEnum(SourceStatus), default=SourceStatus.ACTIVE, nullable=False)

class SchemeSource(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scheme_sources"

    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("official_sources.id", ondelete="CASCADE"), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="sources")
    source: Mapped["OfficialSource"] = relationship("OfficialSource")
