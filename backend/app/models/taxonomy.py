from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class State(Base):
    __tablename__ = "states"
    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(20), default="STATE")

    districts: Mapped[list["District"]] = relationship("District", back_populates="state", cascade="all, delete-orphan")

class District(Base, UUIDMixin):
    __tablename__ = "districts"
    state_code: Mapped[str] = mapped_column(String(10), ForeignKey("states.code", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    state: Mapped["State"] = relationship("State", back_populates="districts")

class SchemeCategory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "scheme_categories"
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

class BeneficiaryType(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "beneficiary_types"
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

class Profession(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "professions"
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
