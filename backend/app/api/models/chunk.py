# backend/app/models/chunk.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.core.database import Base

class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"))
    chunk_index = Column(Integer)
    content = Column(String, nullable=False)
    embedding = Column(Vector(384))  # 384 dimensions for fastembed model

    # Relationship back to document
    document = relationship("Document", back_populates="chunks")
