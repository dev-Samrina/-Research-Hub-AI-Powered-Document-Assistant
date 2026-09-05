# backend/app/test_rag.py
import os
from dotenv import load_dotenv
import psycopg2
from pgvector.psycopg2 import register_vector
from fastembed import TextEmbedding
from langchain_text_splitters import RecursiveCharacterTextSplitter
from PyPDF2 import PdfReader
import httpx

# Load environment variables
load_dotenv()

# ==========================================
# STEP 1: Initialize our AI Models
# ==========================================
print("🧠 Loading lightweight embedding model...")
embed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# ==========================================
# STEP 2: Connect to Database & Load PDF
# ==========================================
print("🔌 Connecting to PostgreSQL...")
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
register_vector(conn)
cur = conn.cursor()

print("📄 Reading PDF...")
reader = PdfReader("app/sample.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text()

# ==========================================
# STEP 3: Chunking & Embedding
# ==========================================
print("🔪 Splitting text into chunks...")
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
chunks = splitter.split_text(text)
print(f"   -> Created {len(chunks)} chunks.")

print("🔢 Generating vector embeddings...")
embeddings = list(embed_model.embed(chunks))

# ==========================================
# STEP 4: Save to Database
# ==========================================
print("💾 Saving chunks and vectors to database...")
cur.execute("INSERT INTO documents (filename, file_path, status) VALUES (%s, %s, %s) RETURNING id",
            ("sample.pdf", "/app/app/sample.pdf", "ready"))
doc_id = cur.fetchone()[0]

for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
    cur.execute(
        "INSERT INTO chunks (document_id, chunk_index, content, embedding) VALUES (%s, %s, %s, %s)",
        (doc_id, i, chunk, embedding)
    )
conn.commit()
print("✅ Data saved successfully!")

# ==========================================
# STEP 5: Ask a Question (Direct HTTP API Call)
# ==========================================
question = "What is this document about?"
print(f"\n❓ Asking: {question}")

# 1. Convert question to vector
question_embedding = list(embed_model.embed([question]))[0]

# 2. Search database for similar chunks
cur.execute("""
    SELECT content, 1 - (embedding <=> %s::vector) AS similarity
    FROM chunks
    WHERE document_id = %s
    ORDER BY embedding <=> %s::vector
    LIMIT 3
""", (question_embedding, doc_id, question_embedding))

relevant_chunks = cur.fetchall()
context = "\n\n".join([row[0] for row in relevant_chunks])

# 3. Call Groq API directly using httpx (NO SDK NEEDED!)
print("🤖 Generating answer with Llama 3.1...")
groq_api_key = os.getenv("GROQ_API_KEY")

response = httpx.post(
    "https://api.groq.com/openai/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json"
    },
    json={
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "You are a helpful research assistant. Answer the question using ONLY the provided context. If the answer isn't in the context, say 'I don't know'."},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
        ]
    },
    timeout=30.0
)

answer = response.json()["choices"][0]["message"]["content"]

print("\n✨ FINAL ANSWER:")
print(answer)

# Cleanup
cur.close()
conn.close()
