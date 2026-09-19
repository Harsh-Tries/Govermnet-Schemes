# Deterministic Eligibility Engine Architecture

## Overview

The **Eligibility & Scheme Intelligence Engine** is the core decision engine of the Indian Government Scheme Assistant. It deterministically computes whether a citizen's socio-demographic profile matches structured eligibility rule sets for published government schemes and scholarships.

```
                    USER PROFILE
                         │
                         ▼
              ┌─────────────────────┐
              │ PROFILE VALIDATOR   │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ ELIGIBILITY ENGINE  │
              │                     │
              │ AND / OR Rules      │
              │ Comparisons         │
              │ Conditions          │
              │ Missing Data        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ SCHEME EVALUATION   │
              │                     │
              │ ELIGIBLE            │
              │ NOT_ELIGIBLE        │
              │ UNKNOWN             │
              └─────────────────────┘
```

## Architectural Design Principles

1. **Strict Determinism**: Zero LLM or black-box non-deterministic inference for eligibility decisions. All evaluations follow explicit boolean & comparative mathematical logic.
2. **Tri-State Classification**:
   - **`ELIGIBLE`**: All required conditions satisfied.
   - **`NOT_ELIGIBLE`**: At least one definitive condition check failed.
   - **`UNKNOWN`**: Crucial profile parameters missing; impossible to render a definitive yes/no without making assumptions.
3. **No False Negatives via Missing Data**: Missing information produces `UNKNOWN`, never `NOT_ELIGIBLE`.
4. **Verifiable Explanations**: Every evaluation generates clear line-by-line explanations with standard status markers (`✓`, `✗`, `?`).
5. **Multi-Attribute Rule Trees**: Supports recursive tree structures of AND/OR logical operator groups.

## Module Structure

- **`RuleValidator`** (`backend/app/services/eligibility/validator.py`): Validates parameter definitions, operator compatibility, and type boundaries.
- **`DeterministicEligibilityEvaluator`** (`backend/app/services/eligibility/evaluator.py`): Executes condition comparisons and tree logic over rules and rule groups.
- **`ExplanationGenerator`** (`backend/app/services/eligibility/explanation.py`): Formats deterministic line-item explanations for citizen UX.
- **`ProfileCompletenessService`** (`backend/app/services/eligibility/completeness.py`): Computes profile completeness percentages and missing parameter prompt lists.
- **`SchemeMatchingEngine`** (`backend/app/services/eligibility/matching.py`): Pre-filters published schemes and executes batch scheme evaluations.
