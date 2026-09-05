# backend/app/test_upload.py
import httpx

BASE_URL = "http://127.0.0.1:8000"

print("🧪 Testing Document Upload...\n")

# 1. Login to get a token
print("1️⃣ Logging in...")
login_response = httpx.post(
    f"{BASE_URL}/auth/login",
    json={"email": "test@example.com", "password": "password123"}
)
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Upload a PDF (we'll use the sample.pdf from earlier)
print("2️⃣ Uploading sample.pdf...")
with open("app/sample.pdf", "rb") as f:
    files = {"file": ("sample.pdf", f, "application/pdf")}
    upload_response = httpx.post(f"{BASE_URL}/documents/upload", headers=headers, files=files)

if upload_response.status_code == 201:
    print("✅ Upload successful!")
    doc = upload_response.json()
    print(f"   Document ID: {doc['id']}, Status: {doc['status']}\n")

    # 3. Wait a few seconds for background task, then check status
    import time
    print("⏳ Waiting 3 seconds for background processing...")
    time.sleep(3)

    print("3️⃣ Checking document status...")
    docs_response = httpx.get(f"{BASE_URL}/documents/", headers=headers)
    if docs_response.status_code == 200:
        docs = docs_response.json()
        for d in docs:
            print(f"   - {d['filename']}: {d['status']} ({d['total_chunks']} chunks)")
else:
    print(f"❌ Upload failed: {upload_response.text}")
