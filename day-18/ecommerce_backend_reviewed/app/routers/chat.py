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

