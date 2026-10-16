from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List

from app.database import get_db
from app.models import ChatMessage, User
from app.schemas import ChatMessageResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/history/{recipient_id}", response_model=List[ChatMessageResponse])
def get_chat_history(
    recipient_id: int, 
    order_id: int = None,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify the recipient exists
    recipient = db.query(User).filter(User.id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
        
    query = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.recipient_id == recipient_id),
            and_(ChatMessage.sender_id == recipient_id, ChatMessage.recipient_id == current_user.id)
        )
    )
    
    if order_id is not None:
        query = query.filter(ChatMessage.order_id == order_id)
        
    messages = query.order_by(ChatMessage.created_at.asc()).all()
    
    return messages


@router.get("/admin-id")
def get_admin_id(db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        admin = db.query(User).order_by(User.id.asc()).first()
    return {"admin_id": admin.id if admin else 1}


@router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    all_msgs = (
        db.query(ChatMessage)
        .filter(
            or_(
                ChatMessage.sender_id == current_user.id,
                ChatMessage.recipient_id == current_user.id,
            )
        )
        .order_by(ChatMessage.created_at.desc())
        .all()
    )

    conversations = {}
    for msg in all_msgs:
        other_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
        if other_id not in conversations:
            other_user = db.query(User).filter(User.id == other_id).first()
            conversations[other_id] = {
                "user_id": other_id,
                "email": other_user.email if other_user else "Client",
                "role": other_user.role if other_user else "customer",
                "last_message": msg.message,
                "last_message_at": msg.created_at.isoformat() if msg.created_at else None,
                "order_id": msg.order_id,
                "unread": 1 if msg.sender_id != current_user.id else 0,
            }
        elif msg.sender_id != current_user.id:
            conversations[other_id]["unread"] += 1

    return list(conversations.values())


