from abc import ABC, abstractmethod
from typing import Any, Type, TypeVar
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

class LLMConfigurationError(Exception):
    """Raised when an LLM provider is misconfigured or lacks mandatory credentials."""
    pass

class LLMExecutionError(Exception):
    """Raised when an LLM provider encounters a runtime execution or network failure."""
    pass

class LLMProvider(ABC):
    """
    Abstract base class for LLM Providers (OpenAI, Gemini, Mock, etc.)
    Ensures application logic is completely decoupled from specific AI provider APIs.
    """

    provider_name: str = "base"
    is_mock: bool = False

    @abstractmethod
    async def generate_response(
        self, 
        messages: list[dict[str, str]], 
        system_prompt: str | None = None,
        temperature: float = 0.2
    ) -> str:
        """Generate a natural language text completion."""
        pass

    @abstractmethod
    async def generate_structured_output(
        self, 
        messages: list[dict[str, str]], 
        response_model: Type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0
    ) -> T:
        """Generate structured Pydantic output strictly validated against response_model schema."""
        pass

    @abstractmethod
    async def generate_embedding(self, text: str) -> list[float]:
        """Generate vector embeddings for semantic search."""
        pass

    def get_provider_info(self) -> dict[str, Any]:
        """Return non-sensitive metadata describing the active provider."""
        return {
            "provider": self.provider_name,
            "is_mock": self.is_mock,
            "status": "CONFIGURED"
        }

    def check_health(self) -> tuple[bool, str]:
        """Check provider configuration health without calling external paid endpoints."""
        return True, "Provider configured"
