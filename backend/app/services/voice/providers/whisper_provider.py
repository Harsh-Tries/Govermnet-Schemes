import os
from app.services.voice.providers.base import SpeechToTextProvider, STTResult

class WhisperProvider(SpeechToTextProvider):
    """OpenAI Whisper API provider implementation."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")

    async def transcribe_audio(
        self, 
        audio_bytes: bytes, 
        language_hint: str | None = None
    ) -> STTResult:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")

        import httpx
        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {"file": ("audio.wav", audio_bytes, "audio/wav")}
            data = {"model": "whisper-1"}
            if language_hint:
                data["language"] = language_hint

            res = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                files=files,
                data=data
            )
            res.raise_for_status()
            resp_data = res.json()
            return STTResult(
                text=resp_data.get("text", ""),
                detected_language=language_hint or "en",
                confidence=0.95
            )
