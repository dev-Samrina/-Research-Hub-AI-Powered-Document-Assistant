# backend/app/api/documents.py
import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.services.file_processor import process_document

router = APIRouter(prefix="/documents", tags=["Documents"])

# Ensure uploads directory exists
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=list[DocumentResponse], status_code=201)
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),  # <-- Changed to list
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload multiple PDFs and start background processing"""
    created_docs = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue  # Skip non-PDFs silently, or you can raise an HTTPException

        # 2. Save file to disk
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Create database record
        new_doc = Document(
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            status="processing",
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        # 4. Add background task
        background_tasks.add_task(process_document, db, new_doc.id, file_path)
        created_docs.append(new_doc)

    return created_docs


@router.get("/", response_model=list[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get all documents for the current user"""
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return docs


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document and all its chunks"""

    # 1. Find the document and verify ownership
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 2. Delete the file from disk
    try:
        import os

        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)
    except Exception as e:
        print(f"Warning: Could not delete file: {e}")

    # 3. Delete from database (chunks will cascade delete)
    db.delete(doc)
    db.commit()

    return None
