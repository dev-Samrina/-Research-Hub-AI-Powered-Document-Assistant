# backend/app/test_auth.py
import httpx

BASE_URL = "http://localhost:8000"

print("🧪 Testing Authentication Endpoints...\n")

# Test 1: Register a new user
print("1️⃣ Registering a new user...")
register_response = httpx.post(
    f"{BASE_URL}/auth/register",
    json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
)

# Change this part in test_auth.py:
if register_response.status_code == 201:
    print("✅ Registration successful!")
    print(f"   User: {register_response.json()}\n")
else:
    print(f"❌ Registration failed with status {register_response.status_code}:")
    print(f"   Response text: {register_response.text}\n")  # <-- USE .text HERE

# Test 2: Login with the user
print("2️⃣ Logging in...")
login_response = httpx.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "test@example.com",
        "password": "password123"
    }
)

if login_response.status_code == 200:
    print("✅ Login successful!")
    token = login_response.json()["access_token"]
    print(f"   Token: {token[:50]}...\n")
else:
    print(f"❌ Login failed: {login_response.json()}\n")

# Test 3: Try to register the same email again (should fail)
print("3️⃣ Trying to register duplicate email...")
duplicate_response = httpx.post(
    f"{BASE_URL}/auth/register",
    json={
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
)

if duplicate_response.status_code == 400:
    print("✅ Correctly rejected duplicate email!")
    print(f"   Error: {duplicate_response.json()['detail']}\n")
else:
    print(f"❌ Unexpected response: {duplicate_response.json()}\n")

# Test 4: Try to login with wrong password (should fail)
print("4️⃣ Trying to login with wrong password...")
wrong_password_response = httpx.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "test@example.com",
        "password": "wrongpassword"
    }
)

if wrong_password_response.status_code == 401:
    print("✅ Correctly rejected wrong password!")
    print(f"   Error: {wrong_password_response.json()['detail']}\n")
else:
    print(f"❌ Unexpected response: {wrong_password_response.json()}\n")

print("🎉 All tests completed!")
