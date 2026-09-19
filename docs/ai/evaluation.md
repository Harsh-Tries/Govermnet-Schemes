# AI Evaluation & Regression Benchmark

## Evaluation Dataset (`tests/data/evaluation_dataset.json`)

Contains representative queries across all 11 intent types:
- Simple scheme search
- Persona-based search (farmer, student, entrepreneur)
- Deterministic eligibility queries
- Document requirements
- Application process guidance
- Failed eligibility explanations
- Scheme comparisons

## Automated Test Suite (`tests/test_phase4_assistant.py`)

Validates CASE 1 through CASE 9 scenarios, confirming intent accuracy, entity validation, tool execution, Phase 3 integration, and strict `PUBLISHED` scheme retrieval boundaries.
