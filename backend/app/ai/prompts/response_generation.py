RESPONSE_GENERATION_PROMPT = """
Summarize and explain the verified tool execution results to the user.

CRITICAL RULES:
- Use ONLY the provided verified context for scheme facts, benefits, documents, and application steps.
- Maintain the EXACT Phase 3 eligibility status (ELIGIBLE, NOT_ELIGIBLE, UNKNOWN).
- For NOT_ELIGIBLE, explain ONLY the actual failed condition reasons provided.
- For UNKNOWN, ask ONLY for the specific missing parameters required.
- Include official portal source links and last verified dates when present in context.
- Never invent facts, URLs, or requirements.
"""
