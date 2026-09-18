# Test Suite Scaffold
## Indian Government Scheme & Scholarship Assistant

> **Phase 1 Scaffolding**: Automated unit and integration test suites will be implemented in **Phase 2**.

---

### Planned Test Suite Structure

```
tests/
├── README.md
├── unit/
│   ├── test_rules_engine.py          # Deterministic rules evaluation test cases
│   ├── test_profile_validation.py     # Pydantic schema validation tests
│   └── test_taxonomy_router.py       # Taxonomy matching unit tests
├── integration/
│   ├── test_scheme_api.py            # FastAPI REST endpoint integration tests
│   ├── test_eligibility_flow.py      # End-to-end profile matching tests
│   └── test_admin_verification.py    # Auditor workflow tests
└── fixtures/
    ├── sample_profiles.json          # Mock citizen profiles for test cases
    └── sample_rules.json             # Structured JSON rules test data
```

---

### Deterministic Engine Test Strategy

The Deterministic Engine test suite will enforce 100% test coverage over all boolean and numeric operators (`EQ`, `GT`, `GTE`, `LT`, `LTE`, `IN`, `CONTAINS`) using edge-case profile matrices (e.g., exact boundary income caps, age limits, multi-caste arrays).
