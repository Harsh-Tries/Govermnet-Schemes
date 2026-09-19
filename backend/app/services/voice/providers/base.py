from abc import ABC, abstractmethod
from pydantic import BaseModel

class STTResult(BaseModel):
    text: str
    detected_language: str = "en"
    confidence: float = 1.0

class SpeechToTextProvider(ABC):
    """
    Abstract base class for Speech-To-Text (STT) providers.
    Supports Whisper, Bhashini (NLTM), Mock, etc.
    """

    @abstractmethod
    async def transcribe_audio(
        self, 
        audio_bytes: bytes, 
        language_hint: str | None = None
    ) -> STTResult:
        """Transcribes raw audio bytes into text with language and confidence metadata."""
        pass
