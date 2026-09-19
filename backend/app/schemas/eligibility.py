from typing import Any
from pydantic import BaseModel, ConfigDict
from app.enums import ParameterDataType, RuleOperator

class ParameterBase(BaseModel):
    name: str
    display_name: str
    data_type: ParameterDataType
    category: str
    description: str | None = None
    allowed_values: Any | None = None
    unit: str | None = None
    is_active: bool = True

class ParameterCreate(ParameterBase):
    pass

class ParameterResponse(ParameterBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class EligibilityRuleBase(BaseModel):
    parameter_name: str
    operator: RuleOperator
    comparison_value: Any
    is_mandatory: bool = True
    failure_message: str | None = None

class EligibilityRuleCreate(EligibilityRuleBase):
    pass

class EligibilityRuleResponse(EligibilityRuleBase):
    id: str
    group_id: str
    model_config = ConfigDict(from_attributes=True)

class RuleGroupBase(BaseModel):
    logical_operator: str = "AND"
    parent_group_id: str | None = None

class RuleGroupCreate(RuleGroupBase):
    rules: list[EligibilityRuleCreate] = []

class RuleGroupResponse(RuleGroupBase):
    id: str
    scheme_id: str
    rules: list[EligibilityRuleResponse] = []
    model_config = ConfigDict(from_attributes=True)
