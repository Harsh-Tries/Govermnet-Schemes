import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Conversation, Message
from app.schemas.ai import AssistantQueryRequest, AssistantQueryResponse
from app.ai.orchestrator import AIOrchestrator
from app.ai.providers.factory import get_active_provider_info
from app.ai.providers.base import LLMConfigurationError, LLMExecutionError

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.get("/status")
def get_assistant_status():
    """
    Check the current AI Assistant LLM provider configuration and health status.
    Never exposes API keys or sensitive credentials.
    """
    return get_active_provider_info()

@router.post("/query", response_model=AssistantQueryResponse)
async def query_assistant(req: AssistantQueryRequest, db: Session = Depends(get_db)):
    """
    Main AI Assistant Query Endpoint.
    Executes intent detection, entity extraction, profile resolution, controlled tool execution,
    Phase 3 deterministic eligibility evaluation, and grounded response generation.
    """
    # 1. Input Validation
    clean_query = req.query.strip() if req.query else ""
    if not clean_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty."
        )
    if len(clean_query) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query exceeds maximum allowed length of 1000 characters."
        )

    try:
        conv_id = req.conversation_id
        if not conv_id:
            conv = Conversation(title=clean_query[:40] or "New Scheme Inquiry", user_id=req.user_id)
            db.add(conv)
            db.commit()
            db.refresh(conv)
            conv_id = conv.id

        # Persist user message
        user_msg = Message(conversation_id=conv_id, role="USER", content=clean_query)
        db.add(user_msg)
        db.commit()

        # Execute AI Orchestrator Pipeline
        response = await AIOrchestrator.process_user_query(
            db=db,
            query=clean_query,
            user_id=req.user_id,
            conversation_id=conv_id,
            override_profile=req.profile_override
        )

        # Persist assistant message
        asst_msg = Message(
            conversation_id=conv_id, 
            role="ASSISTANT", 
            content=response.message,
            metadata_json={
                "intent": response.intent.value,
                "sources": [s.model_dump() for s in response.sources],
                "requires_clarification": response.requires_clarification,
                "provider": response.provider_info.get("provider") if response.provider_info else "mock"
            }
        )
        db.add(asst_msg)
        
        # Touch conversation updated_at so it sorts to the top of chat history
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if conv:
            conv.updated_at = datetime.datetime.utcnow()
            db.add(conv)
            
        db.commit()

        response.conversation_id = conv_id
        return response

    except LLMConfigurationError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI Provider Configuration Error: {str(e)}"
        )
    except LLMExecutionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI Provider Service Error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assistant service error: {str(e)}"
        )
