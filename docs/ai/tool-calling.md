# Controlled Tool Architecture

## Backend Tool Registry (`app.ai.tools.registry.ControlledToolRegistry`)

The LLM cannot execute raw SQL or access the database directly. All backend operations are mediated through strict Pydantic tool schemas:

- `search_schemes`: Keyword and parameter pre-filtering.
- `get_scheme_details`: Eagerly loads scheme benefits, documents, application processes, and sources.
- `evaluate_eligibility`: Invokes Phase 3 `DeterministicEligibilityEvaluator` and `SchemeMatchingEngine`.
- `get_required_documents`: Returns verified `SchemeDocument` records.
- `get_application_process`: Returns verified `ApplicationProcess` steps and portal URLs.
- `compare_schemes`: Compares factual attributes across multiple schemes.
