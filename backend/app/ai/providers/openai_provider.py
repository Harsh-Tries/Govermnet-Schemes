import os
import json
from typing import Type, TypeVar
from pydantic import BaseModel
from app.ai.providers.base import LLMProvider

T = TypeVar('T', bound=BaseModel)

class OpenAIProvider(LLMProvider):
    """OpenAI API provider implementation using official httpx / openai SDK."""

    def __init__(self, api_key: str | None = None, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model_name = os.getenv("OPENAI_MODEL_NAME") or model_name

    async def generate_response(
        self, 
        messages: list[dict[str, str]], 
        system_prompt: str | None = None,
        temperature: float = 0.2
    ) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not configured.")

        import httpx
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
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

    async def generate_structured_output(
        self, 
        messages: list[dict[str, str]], 
        response_model: Type[T],
        system_prompt: str | None = None,
        temperature: float = 0.0
    ) -> T:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not configured.")

        import httpx
        json_schema = response_model.model_json_schema()
        sys_msg = (system_prompt or "") + f"\nRespond ONLY with valid JSON matching this schema:\n{json.dumps(json_schema)}"

        formatted_messages = [{"role": "system", "content": sys_msg}] + messages

        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.openai.com/v1/chat/completions",
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

    async def generate_embedding(self, text: str) -> list[float]:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not configured.")

        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "text-embedding-3-small",
                    "input": text
                }
            )
            res.raise_for_status()
            data = res.json()
            return data["data"][0]["embedding"]
