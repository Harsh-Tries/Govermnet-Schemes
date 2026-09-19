# AI Assistant System Architecture

## Architectural Principles

The Phase 4 Conversational AI Assistant layer sits on top of Phase 1 (Foundation/DB), Phase 2 (Knowledge Base), and Phase 3 (Deterministic Eligibility Engine).

```
                         USER
                          │
                          ▼
             ┌────────────────────────┐
             │   CONVERSATIONAL UI    │
             └────────────┬───────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │   AI ORCHESTRATOR      │
             └────────────┬───────────┘
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
      ▼                   ▼                   ▼
┌────────────┐     ┌──────────────┐    ┌──────────────┐
│   Intent   │     │   Retrieval  │    │   Profile    │
│  & Entity  │     │    Service   │    │   Service    │
└─────┬──────┘     └──────┬───────┘    └──────┬───────┘
      │                    │                   │
      └────────────────────┼───────────────────┘
                           ▼
              ┌────────────────────────┐
              │   PHASE 3              │
              │   ELIGIBILITY ENGINE   │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ VERIFIED STRUCTURED    │
              │ RESULT                 │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ RESPONSE GENERATOR     │
              │ + SOURCE GROUNDING     │
              └────────────┬───────────┘
                           │
                           ▼
                        USER
```

### Core Responsibilities
- **LLM**: Language interpretation, intent classification, entity extraction, natural language summary, and citizen communication.
- **Phase 3 Eligibility Engine**: Deterministic calculation of `ELIGIBLE`, `NOT_ELIGIBLE`, or `UNKNOWN`.
- **Phase 2 Knowledge Base**: Source of truth for schemes, benefits, documents, and application steps.
- **Controlled Tool Layer**: Backend access bridge. Prevents LLM from executing raw SQL or arbitrary DB operations.
