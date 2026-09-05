# backend/app/api/chat.py
#chat py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chat_session import ChatSession
from app.models.conversation import Conversation
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.chat_session import ChatSessionResponse
from app.services.rag_pipeline import (
    retrieve_relevant_chunks,
    generate_answer,
    get_conversation_history,
)
from app.services.web_search import search_web

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Create a new chat session"""
    session = ChatSession(user_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=list[ChatSessionResponse])
def get_sessions(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get all chat sessions for the current user"""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )
    return sessions


@router.get("/sessions/{session_id}/history")
def get_session_history(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get conversation history for a session"""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    conversations = (
        db.query(Conversation)
        .filter(Conversation.session_id == session_id)
        .order_by(Conversation.created_at.asc())
        .all()
    )

    return [
        {
            "question": conv.question,
            "answer": conv.answer,
            "sources": conv.sources,
            "created_at": conv.created_at.isoformat(),
        }
        for conv in conversations
    ]


@router.post("/ask", response_model=ChatResponse)
def ask_question(
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask a question about uploaded documents with memory and web search"""

    # 1. Create or get session
    if chat_request.session_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == chat_request.session_id,
                ChatSession.user_id == current_user.id,
            )
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = ChatSession(user_id=current_user.id, title=chat_request.question[:50])
        db.add(session)
        db.commit()
        db.refresh(session)

    # 2. Verify user has access to the requested documents
    if chat_request.document_ids:
        user_docs = (
            db.query(Document)
            .filter(
                Document.id.in_(chat_request.document_ids),
                Document.user_id == current_user.id,
                Document.status == "ready",
            )
            .all()
        )

        if len(user_docs) != len(chat_request.document_ids):
            raise HTTPException(
                status_code=403, detail="You don't have access to one or more documents"
            )

    # 3. Retrieve relevant chunks
    relevant_chunks = retrieve_relevant_chunks(
        db=db,
        question=chat_request.question,
        document_ids=chat_request.document_ids,
        top_k=3,
    )

    # 4. Check if we need web search (if similarity is low)
    web_context = None
    used_web_search = False

    if relevant_chunks:
        top_similarity = relevant_chunks[0][1]  # Get similarity of top result
        if top_similarity < 0.7:  # Threshold for triggering web search
            print(f"Low similarity ({top_similarity:.2f}), searching web...")
            web_context = search_web(chat_request.question)
            used_web_search = True
    else:
        # No relevant chunks found, search web
        print("No relevant documents found, searching web...")
        web_context = search_web(chat_request.question)
        used_web_search = True

    # 5. Get conversation history
    conversation_history = get_conversation_history(db, session.id, limit=5)

    # 6. Generate answer with memory
    answer, sources, _ = generate_answer(
        chat_request.question,
        relevant_chunks,
        conversation_history,
        web_context,
        chat_request.model_name,
    )

    # 7. Save conversation
    conversation = Conversation(
        user_id=current_user.id,
        session_id=session.id,
        question=chat_request.question,
        answer=answer,
        sources=[s.dict() for s in sources],
    )
    db.add(conversation)

    # Update session timestamp
    session.updated_at = datetime.utcnow()

    db.commit()

    return ChatResponse(
        answer=answer,
        sources=sources,
        session_id=session.id,
        used_web_search=used_web_search,
    )


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific chat session and all its conversations"""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)  # Cascades to conversations automatically
    db.commit()
    return None
