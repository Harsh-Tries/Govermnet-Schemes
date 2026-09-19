from abc import ABC, abstractmethod
from typing import Any, Type, TypeVar
from pydantic import BaseModel

T = TypeVar('T', bound=BaseModel)

class LLMProvider(ABC):
    """
    Abstract base class for LLM Providers (OpenAI, Gemini, Mock, etc.)
    Ensures application logic is completely decoupled from specific AI provider APIs.
    """

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
