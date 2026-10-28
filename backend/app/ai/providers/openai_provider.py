import os
import json
from typing import Type, TypeVar, Any
from pydantic import BaseModel
from app.ai.providers.base import LLMProvider, LLMConfigurationError, LLMExecutionError

T = TypeVar('T', bound=BaseModel)

class OpenAIProvider(LLMProvider):
    """
    OpenAI API provider implementation with resilient error handling,
    configurable model endpoints, and secret-safe diagnostics.
    """

    provider_name: str = "openai"
    is_mock: bool = False

    def __init__(
        self, 
        api_key: str | None = None, 
        model_name: str = "gpt-4o-mini",
        embedding_model: str = "text-embedding-3-small"
    ):
        self.api_key = api_key if api_key is not None else os.getenv("OPENAI_API_KEY")
        if not self.api_key or not self.api_key.strip():
            raise LLMConfigurationError(
                "OPENAI_API_KEY is not configured. Set the OPENAI_API_KEY environment variable "
                "or specify LLM_PROVIDER=mock for offline development."
            )
        self.model_name = os.getenv("OPENAI_MODEL") or os.getenv("OPENAI_MODEL_NAME") or model_name
        self.embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL") or embedding_model
        self.api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")
        self.timeout_seconds = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "30.0"))

    def check_health(self) -> tuple[bool, str]:
        """Validate configuration presence without leaking secrets or calling paid endpoints."""
        if not self.api_key:
            return False, "OPENAI_API_KEY environment variable is missing"
        if len(self.api_key.strip()) < 8:
            return False, "OPENAI_API_KEY appears invalid or malformed"
        return True, f"OpenAI configured with model '{self.model_name}'"

    def get_provider_info(self) -> dict[str, Any]:
        """Safe non-sensitive metadata for diagnostics and UI status badges."""
        has_key = bool(self.api_key and len(self.api_key.strip()) >= 8)
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "embedding_model": self.embedding_model,
            "is_mock": False,
            "status": "READY" if has_key else "UNCONFIGURED",
            "health_ok": has_key
        }

    async def generate_response(
        self, 
        messages: list[dict[str, str]], 
        system_prompt: str | None = None,
        temperature: float = 0.2
    ) -> str:
        if not self.api_key:
            raise LLMConfigurationError("OPENAI_API_KEY environment variable is not configured.")

        import httpx
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                res = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model_name,
                        "messages": formatted_messages,
                        "temperature": temperature
                    }
                )
                res.raise_for_status()
                data = res.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            raise LLMExecutionError(f"OpenAI API call failed with HTTP status {status_code}.")
        except httpx.TimeoutException:
            raise LLMExecutionError(f"OpenAI API request timed out after {self.timeout_seconds} seconds.")
        except Exception as e:
            raise LLMExecutionError(f"OpenAI request failed: {type(e).__name__}")

    async def generate_structured_output(
        self, 
        messages: list[dict[str, str]], 
        response_model: Type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0
    ) -> T:
        if not self.api_key:
            raise LLMConfigurationError("OPENAI_API_KEY environment variable is not configured.")

        import httpx
        json_schema = response_model.model_json_schema()
        sys_msg = (system_prompt or "") + f"\nRespond ONLY with valid JSON matching this schema:\n{json.dumps(json_schema)}"

        formatted_messages = [{"role": "system", "content": sys_msg}] + messages

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                res = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model_name,
                        "messages": formatted_messages,
                        "temperature": temperature,
                        "response_format": {"type": "json_object"}
                    }
                )
                res.raise_for_status()
                data = res.json()
                raw_json = data["choices"][0]["message"]["content"]
                return response_model.model_validate_json(raw_json)
        except httpx.HTTPStatusError as e:
            status_code = e.response.status_code
            raise LLMExecutionError(f"OpenAI structured output failed with HTTP status {status_code}.")
        except httpx.TimeoutException:
            raise LLMExecutionError(f"OpenAI request timed out after {self.timeout_seconds} seconds.")
        except Exception as e:
            if isinstance(e, LLMExecutionError):
                raise
            raise LLMExecutionError(f"OpenAI structured output parsing failed: {type(e).__name__}")

    async def generate_embedding(self, text: str) -> list[float]:
        if not self.api_key:
            raise LLMConfigurationError("OPENAI_API_KEY environment variable is not configured.")

        import httpx
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                res = await client.post(
                    f"{self.api_base}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.embedding_model,
                        "input": text
                    }
                )
                res.raise_for_status()
                data = res.json()
                return data["data"][0]["embedding"]
        except httpx.HTTPStatusError as e:
            raise LLMExecutionError(f"OpenAI embeddings failed with HTTP status {e.response.status_code}.")
        except Exception as e:
            raise LLMExecutionError(f"OpenAI embedding request failed: {type(e).__name__}")
