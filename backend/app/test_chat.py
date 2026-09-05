# backend/app/test_chat.py
import httpx

BASE_URL = "http://127.0.0.1:8000"

print("🧪 Testing Chat Endpoint...\n")

# 1. Login to get a token
print("1️⃣ Logging in...")
login_response = httpx.post(
    f"{BASE_URL}/auth/login",
    json={"email": "test@example.com", "password": "password123"},
)
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get list of documents
print("2️⃣ Getting documents...")
docs_response = httpx.get(f"{BASE_URL}/documents/", headers=headers)
docs = docs_response.json()

if not docs:
    print("❌ No documents found. Please upload a document first!")
else:
    print(f"✅ Found {len(docs)} document(s)")
    for doc in docs:
        print(f"   - ID {doc['id']}: {doc['filename']} ({doc['status']})")

    # 3. Ask a question about the documents
    print("\n3️⃣ Asking a question...")
    question = "What is this document about?"  # Change this to something specific!

    chat_response = httpx.post(
        f"{BASE_URL}/chat/ask",
        headers=headers,
        json={
            "question": question,
            "document_ids": [docs[0]["id"]],  # Search only the first document
        },
    )

    if chat_response.status_code == 200:
        result = chat_response.json()
        print(f"\n❓ Question: {question}")
        print(f"\n✨ Answer:\n{result['answer']}\n")

        print(f"📚 Sources ({len(result['sources'])}):")
        for i, source in enumerate(result["sources"], 1):
            print(
                f"   {i}. {source['filename']} (chunk {source['chunk_index']}, similarity: {source['similarity_score']:.2%})"
            )
            print(f"      Preview: {source['content'][:100]}...")
    else:
        print(f"❌ Chat failed: {chat_response.text}")
