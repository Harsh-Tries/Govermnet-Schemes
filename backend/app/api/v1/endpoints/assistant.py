from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Conversation, Message
from app.schemas.ai import AssistantQueryRequest, AssistantQueryResponse
from app.ai.orchestrator import AIOrchestrator

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.post("/query", response_model=AssistantQueryResponse)
async def query_assistant(req: AssistantQueryRequest, db: Session = Depends(get_db)):
    """
    Main AI Assistant Query Endpoint.
    Executes intent detection, entity extraction, profile resolution, controlled tool execution,
    Phase 3 deterministic eligibility evaluation, and grounded response generation.
    """
    try:
        conv_id = req.conversation_id
        if not conv_id:
            conv = Conversation(title=req.query[:40] or "New Scheme Inquiry", user_id=req.user_id)
            db.add(conv)
            db.commit()
            db.refresh(conv)
            conv_id = conv.id

        # Persist user message
        user_msg = Message(conversation_id=conv_id, role="USER", content=req.query)
        db.add(user_msg)
        db.commit()

        # Execute AI Orchestrator Pipeline
        response = await AIOrchestrator.process_user_query(
            db=db,
            query=req.query,
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
                "requires_clarification": response.requires_clarification
            }
        )
        db.add(asst_msg)
        db.commit()

        response.conversation_id = conv_id
        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Assistant service error: {str(e)}"
        )
