import os
from app.services.voice.providers.base import SpeechToTextProvider
from app.services.voice.providers.whisper_provider import WhisperProvider
from app.services.voice.providers.mock_stt_provider import MockSTTProvider

def get_stt_provider() -> SpeechToTextProvider:
    provider_name = os.getenv("STT_PROVIDER", "mock").lower()
    if provider_name == "whisper" and os.getenv("OPENAI_API_KEY"):
        return WhisperProvider()
    return MockSTTProvider()
