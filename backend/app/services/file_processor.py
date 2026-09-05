# backend/app/services/file_processor.py
import os
from sqlalchemy.orm import Session
from fastembed import TextEmbedding
from langchain_text_splitters import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader
from app.models.document import Document
from app.models.chunk import Chunk

# Initialize the embedding model ONCE (keeps it fast)
embed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")


def process_document(db: Session, doc_id: int, file_path: str):
    """Background task to chunk, embed, and save a PDF"""
    try:
        print(f"⚙️ Starting background processing for document {doc_id}...")

        # 1. Read the PDF
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()

        # 2. Chunk the text
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_text(text)

        # 3. Generate embeddings
        embeddings = list(embed_model.embed(chunks))

        # 4. Save chunks to database
        for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
            new_chunk = Chunk(
                document_id=doc_id,
                chunk_index=i,
                content=chunk_text,
                embedding=embedding,
            )
            db.add(new_chunk)

        # 5. Update document status to 'ready'
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "ready"
            doc.total_chunks = len(chunks)

        db.commit()
        print(f"✅ Document {doc_id} processed successfully! ({len(chunks)} chunks)")

    except Exception as e:
        db.rollback()
        print(f"❌ Error processing document {doc_id}: {e}")
        # Update status to failed
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.status = "failed"
        db.commit()
