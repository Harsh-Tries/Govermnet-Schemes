# Rule Evaluation & Comparison Logic

## Supported Operators

The deterministic evaluator supports 10 comparative operators defined in `app.enums.RuleOperator`:

| Operator | Symbol / Enum | Evaluation Rule |
| :--- | :--- | :--- |
| `EQUALS` | `==` | `user_value == required_value` |
| `NOT_EQUALS` | `!=` | `user_value != required_value` |
| `GREATER_THAN` | `>` | `user_value > required_value` |
| `GREATER_THAN_OR_EQUAL` | `>=` | `user_value >= required_value` |
| `LESS_THAN` | `<` | `user_value < required_value` |
| `LESS_THAN_OR_EQUAL` | `<=` | `user_value <= required_value` |
| `IN` | `IN` | `user_value in required_value_list` |
| `NOT_IN` | `NOT_IN` | `user_value not in required_value_list` |
| `BETWEEN` | `BETWEEN` | `min <= user_value <= max` |
| `CONTAINS` | `CONTAINS` | `required_value in user_value` |

## Nested Tree Evaluation Logic

Rule groups contain zero or more direct `rules` and zero or more nested `child_groups`. Group logical operators can be `AND` or `OR`.

### AND Group Logic
- Evaluates direct rules and child groups.
- If **any** direct rule or child group status is `FAILED` -> Group Status = `FAILED`.
- Else if **any** direct rule or child group status is `MISSING` -> Group Status = `MISSING`.
- Else -> Group Status = `SATISFIED`.

### OR Group Logic
- Evaluates direct rules and child groups.
- If **at least one** direct rule or child group status is `SATISFIED` -> Group Status = `SATISFIED`.
- Else if **all** direct rules and child groups are `FAILED` -> Group Status = `FAILED`.
- Else (no satisfied, at least one missing) -> Group Status = `MISSING`.
