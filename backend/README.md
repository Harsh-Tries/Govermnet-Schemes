# Backend Service (FastAPI) Scaffold
## Indian Government Scheme & Scholarship Assistant

> **Phase 1 Scaffolding**: Business logic and REST API endpoints will be implemented in **Phase 2**.

---

### Planned Architecture & Module Structure

```
backend/
├── app/
│   ├── main.py                       # FastAPI application entrypoint & middleware
│   ├── config.py                     # Pydantic v2 settings & env validation
│   ├── db/                           # SQLAlchemy v2 session & engine setup
│   │   ├── base.py
│   │   └── session.py
│   ├── core/                         # Core utilities, security, JWT auth
│   └── modules/                      # Domain Feature Modules
│       ├── auth_profile/             # Registration, Login, User Profile endpoints
│       │   ├── models.py
│       │   ├── schemas.py
│       │   ├── router.py
│       │   └── service.py
│       ├── schemes/                  # Scheme catalog & taxonomy endpoints
│       │   ├── models.py
│       │   ├── schemas.py
│       │   ├── router.py
│       │   └── service.py
│       ├── eligibility/              # Deterministic Rules Engine
│       │   ├── evaluator.py          # JSON Rule evaluation engine
│       │   ├── schemas.py
│       │   └── router.py
│       ├── admin/                    # Auditor verification workflow
│       │   ├── router.py
│       │   └── service.py
│       └── ai/                       # Grounded RAG Assistant (Phase 3)
│           ├── rag_engine.py
│           └── router.py
├── requirements.txt                  # Python dependencies
└── pyproject.toml                    # Code formatters & linters (Ruff/Black/Mypy)
```

---

### Core Dependencies for Phase 2

- `fastapi`: Async Web Framework
- `uvicorn`: ASGI Server
- `pydantic`: Schema validation & settings
- `sqlalchemy`: Async ORM for PostgreSQL
- `asyncpg`: Async PostgreSQL driver
- `alembic`: Database migrations
- `python-jose`: JWT token processing
- `passlib`: Password hashing (Bcrypt)
