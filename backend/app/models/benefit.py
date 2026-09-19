from sqlalchemy import String, Text, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import BenefitType

class SchemeBenefit(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scheme_benefits"

    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    benefit_type: Mapped[BenefitType] = mapped_column(SQLEnum(BenefitType), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    amount_unit: Mapped[str | None] = mapped_column(String(50), nullable=True) # e.g. INR/year, Percentage
    frequency: Mapped[str | None] = mapped_column(String(50), nullable=True) # Monthly, One-time, Annual
    conditions: Mapped[str | None] = mapped_column(Text, nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="benefits")
