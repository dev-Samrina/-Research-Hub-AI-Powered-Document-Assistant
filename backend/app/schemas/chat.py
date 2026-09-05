# backend/app/schemas/chat.py
from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    question: str
    document_ids: List[int]
    session_id: Optional[int] = None  
    model_name: str = "llama-3.1-8b-instant"


class SourceCitation(BaseModel):
    document_id: Optional[int] = None
    filename: Optional[str] = None
    chunk_index: Optional[int] = None
    content: str
    similarity_score: Optional[float] = None
    source_type: str = "document"  # "document" or "web"
    url: Optional[str] = None  # For web sources


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    session_id: int
    used_web_search: bool = False
