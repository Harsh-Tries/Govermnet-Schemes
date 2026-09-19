from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Conversation, Message
from app.schemas.conversation import (
    ConversationCreate, ConversationResponse,
    MessageCreate, MessageResponse
)

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(data: ConversationCreate, db: Session = Depends(get_db)):
    conv = Conversation(
        title=data.title or "New Scheme Inquiry",
        user_id=data.user_id,
        status="ACTIVE"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv

@router.get("", response_model=list[ConversationResponse])
def list_conversations(user_id: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Conversation)
    if user_id:
        q = q.filter(Conversation.user_id == user_id)
    return q.order_by(Conversation.updated_at.desc()).all()

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@router.post("/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def add_message_to_conversation(conversation_id: str, data: MessageCreate, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = Message(
        conversation_id=conversation_id,
        role=data.role,
        content=data.content,
        metadata_json=data.metadata
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return None
