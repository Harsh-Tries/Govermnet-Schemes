# Scheme Matching Engine

## Overview

The `SchemeMatchingEngine` evaluates all `PUBLISHED` schemes in the database against a citizen's profile.

## Pipeline Architecture

1. **Pre-filtering**: Fetches all schemes with status `PUBLISHED` and eager-loads associated `rule_groups`, `rules`, and `sources`.
2. **Metadata Lookup**: Pre-loads parameter taxonomy metadata (`EligibilityParameter`) for type validation.
3. **Batch Evaluation**: Calls `DeterministicEligibilityEvaluator.evaluate_scheme()` for each published scheme.
4. **Explanation Formatting**: Passes each evaluation result through `ExplanationGenerator.generate_explanations()`.
5. **Grouping**: Segregates scheme results into:
   - `eligible`
   - `unknown`
   - `not_eligible`

## API Contract

`POST /api/v1/eligibility/match`

### Request Body:
```json
{
  "profile": {
    "age": 20,
    "state_code": "MP",
    "annual_income": 220000,
    "occupation_type": "STUDENT",
    "caste_category": "OBC",
    "is_pwd": false
  }
}
```

### Response Body:
```json
{
  "total_schemes_evaluated": 5,
  "eligible_count": 2,
  "not_eligible_count": 1,
  "unknown_count": 2,
  "eligible": [...],
  "unknown": [...],
  "not_eligible": [...]
}
```
