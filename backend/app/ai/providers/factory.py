import os
from typing import Any
from app.ai.providers.base import LLMProvider, LLMConfigurationError
from app.ai.providers.openai_provider import OpenAIProvider
from app.ai.providers.mock_provider import MockLocalProvider

def get_llm_provider() -> LLMProvider:
    """
    Factory function resolving the active LLMProvider based on environment variables.
    Supported: 'mock' (default for local test/dev), 'openai' (production/live).
    Strictly raises LLMConfigurationError if a requested live provider is unconfigured.
    """
    provider_name = os.getenv("LLM_PROVIDER", "mock").strip().lower()

    if provider_name == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or not api_key.strip():
            raise LLMConfigurationError(
                "LLM_PROVIDER is configured as 'openai', but OPENAI_API_KEY is missing or empty. "
                "Set OPENAI_API_KEY or configure LLM_PROVIDER=mock for development/test mode."
            )
        return OpenAIProvider()

    if provider_name in ("mock", "local", "test"):
        return MockLocalProvider()

    raise LLMConfigurationError(
        f"Unsupported LLM_PROVIDER '{provider_name}'. Supported values: 'mock', 'openai'."
    )

def get_active_provider_info() -> dict[str, Any]:
    """Retrieve non-sensitive status metadata about the currently configured provider."""
    provider_name = os.getenv("LLM_PROVIDER", "mock").strip().lower()
    if provider_name == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        has_key = bool(api_key and len(api_key.strip()) >= 8)
        model = os.getenv("OPENAI_MODEL") or os.getenv("OPENAI_MODEL_NAME") or "gpt-4o-mini"
        return {
            "provider": "openai",
            "model": model,
            "is_mock": False,
            "status": "READY" if has_key else "UNCONFIGURED",
            "health_ok": has_key,
            "message": "OpenAI live provider" if has_key else "Missing OPENAI_API_KEY"
        }
    else:
        return {
            "provider": "mock",
            "model": "rule-based-mock",
            "is_mock": True,
            "status": "READY",
            "health_ok": True,
            "message": "Deterministic Mock Provider for testing and local development"
        }
