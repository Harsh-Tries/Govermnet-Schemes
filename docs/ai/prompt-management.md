# Prompt Management System

## Centralized Prompt Registry (`backend/app/ai/prompts/`)

Prompts are versioned and centralized in dedicated modules:

- `system.py`: `SCHEME_ASSISTANT_PROMPT_V1`
- `intent.py`: `INTENT_CLASSIFICATION_PROMPT`
- `entity_extraction.py`: `ENTITY_EXTRACTION_PROMPT`
- `response_generation.py`: `RESPONSE_GENERATION_PROMPT`

Prompts are not scattered throughout business logic files, enabling isolated prompt engineering and testing.
