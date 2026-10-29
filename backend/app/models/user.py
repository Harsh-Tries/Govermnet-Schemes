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
    bookmarks: Mapped[list["UserBookmark"]] = relationship("UserBookmark", back_populates="user", cascade="all, delete-orphan")

class UserBookmark(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_bookmarks"

    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)

    user: Mapped["User"] = relationship("User", back_populates="bookmarks")
    scheme: Mapped["Scheme"] = relationship("Scheme")

class UserProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "user_profiles"
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    marital_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    state_code: Mapped[str | None] = mapped_column(String(10), default="IN-MH", nullable=True)
    district_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    taluka: Mapped[str | None] = mapped_column(String(100), nullable=True)
    village_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    residency_area: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_maharashtra_resident: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    annual_family_income: Mapped[float | None] = mapped_column(Float, nullable=True)
    caste_category: Mapped[str | None] = mapped_column(String(20), nullable=True)
    occupation_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    education_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_pwd: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    disability_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    landholding_acres: Mapped[float | None] = mapped_column(Float, nullable=True)
    beneficiary_categories: Mapped[list | None] = mapped_column(JSON, nullable=True)
    student_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    farmer_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    entrepreneur_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    vulnerable_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    onboarding_step: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="profile")
