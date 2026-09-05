# backend/app/test_db.py
from app.core.database import engine, SessionLocal
from app.models import User, Document, Chunk

# Test 1: Can we connect to the database?
print("Testing database connection...")
db = SessionLocal()
try:
    # Try a simple query
    user_count = db.query(User).count()
    doc_count = db.query(Document).count()
    chunk_count = db.query(Chunk).count()

    print("✅ Connected successfully!")
    print(f"   Users: {user_count}")
    print(f"   Documents: {doc_count}")
    print(f"   Chunks: {chunk_count}")

except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()
