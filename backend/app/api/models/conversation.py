# backend/app/models/conversation.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    sources = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship back to session
    session = relationship("ChatSession", back_populates="conversations")
