# Controlled Intent Taxonomy & Entity Extraction

## Intent Enum (`app.schemas.ai.AssistantIntent`)

The system enforces a controlled taxonomy of 11 intent enum values:

1. `SCHEME_SEARCH`: Search for matching schemes or scholarships.
2. `ELIGIBILITY_CHECK`: Determine eligibility status for a scheme or profile.
3. `SCHEME_DETAILS`: Fetch full scheme details and benefits.
4. `BENEFIT_QUERY`: Fetch financial/non-financial benefit details.
5. `DOCUMENT_QUERY`: Fetch mandatory and conditional required documents.
6. `APPLICATION_GUIDANCE`: Fetch application modes, portal URLs, and step-by-step instructions.
7. `PROFILE_UPDATE`: Update socio-demographic parameters.
8. `COMPARE_SCHEMES`: Compare attributes of multiple schemes.
9. `WHY_NOT_ELIGIBLE`: Explain specific failed conditions from Phase 3.
10. `GENERAL_GOVERNMENT_SCHEME_QUERY`: General guidance questions.
11. `CLARIFICATION_REQUIRED`: Prompt user for missing parameters.

## Entity Validation
All extracted entities are validated against `EligibilityParameter` metadata in the database. Dynamic parameters created by LLMs are rejected.
