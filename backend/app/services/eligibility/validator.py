from typing import Any
from app.enums import ParameterDataType, RuleOperator

class RuleValidationError(ValueError):
    """Custom exception raised when an eligibility rule definition is malformed or invalid."""
    pass

class RuleValidator:
    """
    Validates eligibility rule parameter definitions, data types, operator compatibility, 
    and comparison values before rule execution.
    """

    @staticmethod
    def validate_rule(parameter_name: str, operator: RuleOperator, comparison_value: Any, param_metadata: Any = None) -> bool:
        if not parameter_name or not isinstance(parameter_name, str):
            raise RuleValidationError("Parameter name must be a non-empty string.")

        if comparison_value is None:
            raise RuleValidationError(f"Comparison value for parameter '{parameter_name}' cannot be None.")

        # Determine expected data type from parameter metadata if available
        data_type = param_metadata.data_type if param_metadata else None

        # Operator compatibility & type check
        numeric_ops = [
            RuleOperator.GREATER_THAN, RuleOperator.GREATER_THAN_OR_EQUAL,
            RuleOperator.LESS_THAN, RuleOperator.LESS_THAN_OR_EQUAL, RuleOperator.BETWEEN
        ]

        if operator in numeric_ops:
            if isinstance(comparison_value, bool):
                raise RuleValidationError(f"Numeric operator '{operator}' cannot compare against boolean value '{comparison_value}'.")
            if isinstance(comparison_value, str) and not comparison_value.replace('.', '', 1).isdigit():
                raise RuleValidationError(f"Numeric operator '{operator}' cannot compare against non-numeric string '{comparison_value}'.")

        if data_type == ParameterDataType.INTEGER or data_type == ParameterDataType.FLOAT:
            if operator in [RuleOperator.CONTAINS]:
                raise RuleValidationError(f"Operator '{operator}' is not compatible with numeric parameter '{parameter_name}'.")
            
            if operator in [RuleOperator.EQUALS, RuleOperator.NOT_EQUALS, RuleOperator.GREATER_THAN, RuleOperator.GREATER_THAN_OR_EQUAL, RuleOperator.LESS_THAN, RuleOperator.LESS_THAN_OR_EQUAL]:
                if not isinstance(comparison_value, (int, float)):
                    raise RuleValidationError(f"Numeric parameter '{parameter_name}' requires integer or float comparison value, got '{type(comparison_value).__name__}'.")

            elif operator == RuleOperator.BETWEEN:
                if not isinstance(comparison_value, (list, tuple)) or len(comparison_value) != 2:
                    raise RuleValidationError(f"Operator BETWEEN for parameter '{parameter_name}' requires a 2-element list [min, max].")
                if not (isinstance(comparison_value[0], (int, float)) and isinstance(comparison_value[1], (int, float))):
                    raise RuleValidationError(f"Operator BETWEEN bounds for '{parameter_name}' must be numeric.")

            elif operator in [RuleOperator.IN, RuleOperator.NOT_IN]:
                if not isinstance(comparison_value, (list, tuple)):
                    raise RuleValidationError(f"Operator '{operator}' requires a list of values.")

        elif data_type == ParameterDataType.BOOLEAN:
            if operator not in [RuleOperator.EQUALS, RuleOperator.NOT_EQUALS]:
                raise RuleValidationError(f"Boolean parameter '{parameter_name}' only supports EQUALS or NOT_EQUALS operators.")
            if not isinstance(comparison_value, bool):
                raise RuleValidationError(f"Boolean parameter '{parameter_name}' requires boolean comparison value.")

        elif data_type in [ParameterDataType.STRING, ParameterDataType.ENUM]:
            if operator in [RuleOperator.IN, RuleOperator.NOT_IN]:
                if not isinstance(comparison_value, (list, tuple)):
                    raise RuleValidationError(f"Operator '{operator}' for string parameter '{parameter_name}' requires a list.")

        return True
