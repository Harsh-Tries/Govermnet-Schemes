# Database Infrastructure & Migrations
## Indian Government Scheme & Scholarship Assistant

> **Phase 1 Scaffolding**: Database schemas and migration scripts will be executed in **Phase 2**.

---

### Directory Layout

```
database/
├── README.md                          # Database architecture summary
├── migrations/                        # Alembic migration scripts
│   ├── env.py
│   └── versions/                      # Schema version files
└── seeds/                             # Baseline taxonomy & reference seeds
    ├── 01_states.sql                  # Indian States & UTs reference data
    ├── 02_categories.sql              # Scheme taxonomy categories
    ├── 03_beneficiary_types.sql       # Beneficiary group taxonomy
    └── 04_sample_verified_schemes.sql # Verified scheme reference records
```

---

### Planned Database Extensions & Features

1. **Relational Schema**: Managed via Alembic migrations supporting 16 canonical entities.
2. **JSONB Rule Indexing**: GIN indexes on `eligibility_rules.target_value` for fast attribute query matching.
3. **`pgvector` Integration**: Enabled in Phase 3 for semantic similarity vector search on policy document chunks.
