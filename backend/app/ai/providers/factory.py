import os
from app.ai.providers.base import LLMProvider
from app.ai.providers.openai_provider import OpenAIProvider
from app.ai.providers.mock_provider import MockLocalProvider

def get_llm_provider() -> LLMProvider:
    """
    Factory function resolving the active LLMProvider based on environment variables.
    Supported: 'openai', 'gemini', 'mock' (default).
    """
    provider_name = os.getenv("LLM_PROVIDER", "mock").lower()

    if provider_name == "openai" and os.getenv("OPENAI_API_KEY"):
        return OpenAIProvider()
    
    # Default to deterministic mock provider for zero runtime external dependency risk
    return MockLocalProvider()
