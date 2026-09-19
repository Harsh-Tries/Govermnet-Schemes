import datetime
from sqlalchemy import String, Text, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import GovernmentLevel, SchemeType, SchemeStatus

class Scheme(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "schemes"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    short_description: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    government_level: Mapped[GovernmentLevel] = mapped_column(SQLEnum(GovernmentLevel), default=GovernmentLevel.CENTRAL, nullable=False)
    scheme_type: Mapped[SchemeType] = mapped_column(SQLEnum(SchemeType), default=SchemeType.GRANT, nullable=False)
    status: Mapped[SchemeStatus] = mapped_column(SQLEnum(SchemeStatus), default=SchemeStatus.DRAFT, nullable=False, index=True)
    administering_ministry: Mapped[str | None] = mapped_column(String(255), nullable=True)
    funding_ratio: Mapped[str | None] = mapped_column(String(50), nullable=True)
    published_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    categories: Mapped[list["SchemeCategoryMap"]] = relationship("SchemeCategoryMap", back_populates="scheme", cascade="all, delete-orphan")
    beneficiaries: Mapped[list["SchemeBeneficiary"]] = relationship("SchemeBeneficiary", back_populates="scheme", cascade="all, delete-orphan")
    professions: Mapped[list["SchemeProfession"]] = relationship("SchemeProfession", back_populates="scheme", cascade="all, delete-orphan")
    states: Mapped[list["SchemeState"]] = relationship("SchemeState", back_populates="scheme", cascade="all, delete-orphan")
    districts: Mapped[list["SchemeDistrict"]] = relationship("SchemeDistrict", back_populates="scheme", cascade="all, delete-orphan")

    rule_groups: Mapped[list["EligibilityRuleGroup"]] = relationship("EligibilityRuleGroup", back_populates="scheme", cascade="all, delete-orphan")
    benefits: Mapped[list["SchemeBenefit"]] = relationship("SchemeBenefit", back_populates="scheme", cascade="all, delete-orphan")
    documents: Mapped[list["SchemeDocument"]] = relationship("SchemeDocument", back_populates="scheme", cascade="all, delete-orphan")
    application_process: Mapped["ApplicationProcess"] = relationship("ApplicationProcess", back_populates="scheme", uselist=False, cascade="all, delete-orphan")
    sources: Mapped[list["SchemeSource"]] = relationship("SchemeSource", back_populates="scheme", cascade="all, delete-orphan")
    verification_records: Mapped[list["VerificationRecord"]] = relationship("VerificationRecord", back_populates="scheme", cascade="all, delete-orphan")
    updates: Mapped[list["SchemeUpdate"]] = relationship("SchemeUpdate", back_populates="scheme", cascade="all, delete-orphan")

class SchemeCategoryMap(Base):
    __tablename__ = "scheme_category_maps"
    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), primary_key=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("scheme_categories.id", ondelete="CASCADE"), primary_key=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="categories")
    category: Mapped["SchemeCategory"] = relationship("SchemeCategory")

class SchemeBeneficiary(Base):
    __tablename__ = "scheme_beneficiaries"
    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), primary_key=True)
    beneficiary_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("beneficiary_types.id", ondelete="CASCADE"), primary_key=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="beneficiaries")
    beneficiary_type: Mapped["BeneficiaryType"] = relationship("BeneficiaryType")

class SchemeProfession(Base):
    __tablename__ = "scheme_professions"
    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), primary_key=True)
    profession_id: Mapped[str] = mapped_column(String(36), ForeignKey("professions.id", ondelete="CASCADE"), primary_key=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="professions")
    profession: Mapped["Profession"] = relationship("Profession")

class SchemeState(Base):
    __tablename__ = "scheme_states"
    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), primary_key=True)
    state_code: Mapped[str] = mapped_column(String(10), ForeignKey("states.code", ondelete="CASCADE"), primary_key=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="states")

class SchemeDistrict(Base):
    __tablename__ = "scheme_districts"
    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), primary_key=True)
    district_id: Mapped[str] = mapped_column(String(36), ForeignKey("districts.id", ondelete="CASCADE"), primary_key=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="districts")
