from app.services.voice.providers.base import SpeechToTextProvider, STTResult

class MockSTTProvider(SpeechToTextProvider):
    """
    Deterministic Mock STT Provider for local testing and offline voice processing.
    """

    async def transcribe_audio(
        self, 
        audio_bytes: bytes, 
        language_hint: str | None = None
    ) -> STTResult:
        lang = language_hint or "en"
        
        if lang == "hi":
            return STTResult(
                text="छात्रों के लिए कौन सी छात्रवृत्ति योजनाएं उपलब्ध हैं?",
                detected_language="hi",
                confidence=0.96
            )
        elif lang == "mr":
            return STTResult(
                text="माझ्यासाठी कोणत्या शासकीय योजना आहेत?",
                detected_language="mr",
                confidence=0.95
            )
        else:
            return STTResult(
                text="What government scholarship schemes are available for engineering students?",
                detected_language="en",
                confidence=0.98
            )
