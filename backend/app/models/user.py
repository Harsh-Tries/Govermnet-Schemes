from sqlalchemy import String, Boolean, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin

class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"
    phone_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="CITIZEN", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    profile: Mapped["UserProfile"] = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_profiles"
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    marital_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    state_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    district_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    residency_area: Mapped[str | None] = mapped_column(String(20), nullable=True)
    annual_family_income: Mapped[float | None] = mapped_column(Float, nullable=True)
    caste_category: Mapped[str | None] = mapped_column(String(20), nullable=True)
    occupation_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    education_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_pwd: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    disability_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    landholding_acres: Mapped[float | None] = mapped_column(Float, nullable=True)
    custom_attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="profile")
