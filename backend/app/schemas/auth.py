# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    """What the user sends when registering"""
    email: EmailStr  # Validates that it's a real email format
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    """What the user sends when logging in"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """What we send back after registration"""
    id: int
    email: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True  # Allows converting SQLAlchemy models to Pydantic

class TokenResponse(BaseModel):
    """What we send back after login"""
    access_token: str
    token_type: str = "bearer"
