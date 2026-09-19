INTENT_CLASSIFICATION_PROMPT = """
Classify the user's intent into exactly ONE of the following controlled intent enum values:

1. SCHEME_SEARCH: User is looking for schemes/scholarships matching a query or persona.
2. ELIGIBILITY_CHECK: User is asking if they qualify or are eligible for schemes.
3. SCHEME_DETAILS: User is asking for comprehensive details about a specific scheme.
4. BENEFIT_QUERY: User is asking what benefits/financial support a scheme provides.
5. DOCUMENT_QUERY: User is asking what documents are required to apply.
6. APPLICATION_GUIDANCE: User is asking how/where to apply.
7. PROFILE_UPDATE: User wants to update their socio-demographic profile.
8. COMPARE_SCHEMES: User wants to compare multiple schemes.
9. WHY_NOT_ELIGIBLE: User is asking why they failed eligibility or were rejected.
10. GENERAL_GOVERNMENT_SCHEME_QUERY: General questions about government scheme processes.
11. CLARIFICATION_REQUIRED: The user's query is ambiguous or unclear.

Respond strictly with structured output.
"""
