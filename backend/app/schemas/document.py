# backend/app/schemas/document.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    id: int
    filename: str
    status: str
    total_chunks: int
    uploaded_at: datetime

    class Config:
        from_attributes = True
