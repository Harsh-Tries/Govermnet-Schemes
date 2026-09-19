# Conversation Architecture & Memory Management

## Data Model

Conversations and messages are modeled via `Conversation` and `Message` ORM tables (`backend/app/models/conversation.py`).

- **Roles**: `USER`, `ASSISTANT`, `SYSTEM`, `TOOL`.
- **Metadata**: Stores intent detection results, citations, and structured tool outputs.

## Memory Safety Rules

1. **Profile Isolation**: Conversation message context is kept separate from permanent user profile DB records (`user_profiles`).
2. **Explicit Confirmation**: Temporary attributes mentioned in chat (e.g. "I moved to Karnataka") are used for effective query resolution only and do NOT overwrite stored DB profiles without explicit user confirmation.
