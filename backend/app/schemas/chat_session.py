# backend/app/schemas/chat_session.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"


class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    question: str
    answer: str
    sources: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True
