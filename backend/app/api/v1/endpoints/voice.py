from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.voice.providers.factory import get_stt_provider
from app.ai.orchestrator import AIOrchestrator
from app.schemas.ai import AssistantQueryResponse

router = APIRouter(prefix="/voice", tags=["Voice Assistant"])

@router.post("/stt")
async def transcribe_and_query_voice(
    file: UploadFile = File(...),
    language_hint: str | None = Form(None),
    conversation_id: str | None = Form(None),
    execute_query: bool = Form(True),
    db: Session = Depends(get_db)
):
    """
    Voice Audio Transcription and Assistant Query Endpoint.
    Transcribes audio into text and optionally passes transcribed text directly
    into the Phase 4 AI Orchestrator pipeline.
    """
    try:
        audio_bytes = await file.read()
        stt = get_stt_provider()
        stt_result = await stt.transcribe_audio(audio_bytes, language_hint=language_hint)

        assistant_response: AssistantQueryResponse | None = None
        if execute_query and stt_result.text.strip():
            assistant_response = await AIOrchestrator.process_user_query(
                db=db,
                query=stt_result.text,
                conversation_id=conversation_id
            )

        return {
            "transcription": stt_result.text,
            "detected_language": stt_result.detected_language,
            "confidence": stt_result.confidence,
            "assistant_response": assistant_response
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice processing failure: {str(e)}"
        )
