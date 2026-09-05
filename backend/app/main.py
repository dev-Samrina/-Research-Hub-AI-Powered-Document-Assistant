# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- ADD THIS IMPORT

from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router

app = FastAPI(title="Research Hub API")

# --- ADD THIS CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],  # Allow your frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],  # Allow all headers (like Authorization)
)
# -----------------------------------

app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)


@app.get("/")
def read_root():
    return {"message": "Research Hub Backend is running!"}
