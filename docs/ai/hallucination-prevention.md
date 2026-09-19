# Anti-Hallucination Controls & Source Grounding

## Safeguards

1. **Deterministic Eligibility Authority**: The LLM NEVER decides eligibility. All eligibility conclusions are calculated by Phase 3 and preserved verbatim in natural language responses.
2. **Fact Grounding**: Scheme details, benefits, documents, and application steps are supplied in structured context. The LLM is instructed never to fill gaps using internal pre-training knowledge.
3. **Official Citations**: Every scheme response includes official government portal URLs (`official_source`) and verification dates (`last_verified_date`).
4. **Missing Information Policy**: If data is missing or unverified, the assistant explicitly states that official records do not contain it.
