from sqlalchemy import String, Text, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, UUIDMixin, TimestampMixin
from app.enums import ParameterDataType, RuleOperator

class EligibilityParameter(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "eligibility_parameters"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(150), nullable=False)
    data_type: Mapped[ParameterDataType] = mapped_column(SQLEnum(ParameterDataType), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False) # DEMOGRAPHICS, LOCATION, SOCIOECONOMIC, etc.
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    allowed_values: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class EligibilityRuleGroup(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "eligibility_rule_groups"

    scheme_id: Mapped[str] = mapped_column(String(36), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False)
    logical_operator: Mapped[str] = mapped_column(String(10), default="AND", nullable=False) # AND | OR
    parent_group_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("eligibility_rule_groups.id", ondelete="CASCADE"), nullable=True)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="rule_groups")
    rules: Mapped[list["EligibilityRule"]] = relationship("EligibilityRule", back_populates="group", cascade="all, delete-orphan")
    child_groups: Mapped[list["EligibilityRuleGroup"]] = relationship("EligibilityRuleGroup", back_populates="parent_group", cascade="all, delete-orphan")
    parent_group: Mapped["EligibilityRuleGroup | None"] = relationship("EligibilityRuleGroup", back_populates="child_groups", remote_side="EligibilityRuleGroup.id")

class EligibilityRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "eligibility_rules"

    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("eligibility_rule_groups.id", ondelete="CASCADE"), nullable=False)
    parameter_name: Mapped[str] = mapped_column(String(100), nullable=False)
    operator: Mapped[RuleOperator] = mapped_column(SQLEnum(RuleOperator), nullable=False)
    comparison_value: Mapped[dict | list | str | int | float | bool] = mapped_column(JSON, nullable=False)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failure_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    group: Mapped["EligibilityRuleGroup"] = relationship("EligibilityRuleGroup", back_populates="rules")
