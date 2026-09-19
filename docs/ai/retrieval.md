# Scheme Retrieval Layer

## Overview

The `SchemeRetriever` (`backend/app/ai/retrieval.py`) provides structured keyword, state, category, and profession filtering over scheme records.

## Strict Publication Boundary

- **Constraint**: Only schemes with `status == SchemeStatus.PUBLISHED` are accessible to public AI assistant queries.
- `DRAFT`, `UNDER_REVIEW`, `REVERIFICATION_REQUIRED`, and `ARCHIVED` schemes are excluded from retrieval to prevent unverified content from reaching citizens.
