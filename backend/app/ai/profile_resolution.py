from typing import Any

class ProfileResolver:
    """
    Profile Resolution Service.
    Merges stored user profile, current message entities, and conversation session context
    without mutating the permanent stored user profile.
    """

    @staticmethod
    def resolve_effective_profile(
        stored_profile: dict[str, Any] | None = None,
        extracted_entities: dict[str, Any] | None = None,
        session_context_profile: dict[str, Any] | None = None,
        override_profile: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        """
        Builds a single effective profile dict for Phase 3 rule evaluation.
        Precedence order (highest to lowest):
        1. Query explicitly passed override_profile
        2. Extracted entities from current user message
        3. Temporary session_context_profile established earlier in the conversation
        4. Stored user profile record from DB
        """
        effective: dict[str, Any] = {}

        if stored_profile:
            effective.update({k: v for k, v in stored_profile.items() if v is not None})

        if session_context_profile:
            effective.update({k: v for k, v in session_context_profile.items() if v is not None})

        if extracted_entities:
            effective.update({k: v for k, v in extracted_entities.items() if v is not None})

        if override_profile:
            effective.update({k: v for k, v in override_profile.items() if v is not None})

        return effective
