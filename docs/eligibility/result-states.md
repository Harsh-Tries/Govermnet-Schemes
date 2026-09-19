# Result States & Explanations

## Overall Scheme Result States

Every scheme evaluated by the engine is assigned one of three overall eligibility states:

1. **`ELIGIBLE`**:
   - Every mandatory rule and rule group evaluates to `SATISFIED`.
   - The citizen satisfies all eligibility conditions required by the scheme.

2. **`NOT_ELIGIBLE`**:
   - At least one mandatory rule or rule group evaluates to `FAILED`.
   - The citizen explicitly fails a requirement (e.g. age exceed limit, state domicile mismatch).

3. **`UNKNOWN`**:
   - No mandatory rules failed, but one or more required parameters were missing from the citizen profile.
   - Or, the scheme lacks published structured rule groups.
   - **Critical Constraint**: Missing data MUST NEVER be penalized as `NOT_ELIGIBLE`.

## Deterministic Explanations

Explanations are structured line items using strict markers:

- `✓ [Parameter Name]: Satisfies [Operator] [Required Value] (User Value: [User Value])`
- `✗ [Parameter Name]: Fails [Operator] [Required Value] (User Value: [User Value])`
- `? [Parameter Name]: Missing required profile parameter.`

Zero natural language generation (LLM) is used to synthesize explanations, guaranteeing auditability and zero hallucination risk.
