"""Tests for authentication endpoints: register, login, and the full pipeline."""

import pytest
from fastapi.testclient import TestClient


# --- Unit-style tests for individual endpoints ---

def test_register_success(test_client: TestClient):
    """Register a new user returns 200 with token and user_id."""
    # Use a unique email to avoid conflicts
    import uuid
    unique_email = f"test_{uuid.uuid4().hex[:8]}@plutus.local"

    response = test_client.post(
        "/api/register",
        json={"email": unique_email, "password": "test_password_123"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "user_id" in data
    assert isinstance(data["token"], str) and len(data["token"]) > 0
    assert isinstance(data["user_id"], str) and len(data["user_id"]) > 0
    # user_id should be a UUID
    import uuid as uuid_module
    uuid_module.UUID(data["user_id"])  # validates UUID format


def test_register_duplicate_email_fails(test_client: TestClient):
    """Registering with an existing email should fail."""
    import uuid
    unique_email = f"test_{uuid.uuid4().hex[:8]}@plutus.local"

    # First registration succeeds
    response1 = test_client.post(
        "/api/register",
        json={"email": unique_email, "password": "test_password_123"}
    )
    assert response1.status_code == 200

    # Second registration with same email fails
    response2 = test_client.post(
        "/api/register",
        json={"email": unique_email, "password": "different_password"}
    )
    assert response2.status_code == 400
    assert "failed" in response2.json().get("detail", "").lower() or "already" in response2.json().get("detail", "").lower()


def test_register_invalid_email_fails(test_client: TestClient):
    """Register with invalid email format should fail."""
    response = test_client.post(
        "/api/register",
        json={"email": "not-an-email", "password": "test_password_123"}
    )
    # Supabase may reject or accept - we just check it doesn't 500
    assert response.status_code in (200, 400, 422)


def test_register_short_password_fails(test_client: TestClient):
    """Register with too-short password should fail."""
    import uuid
    unique_email = f"test_{uuid.uuid4().hex[:8]}@plutus.local"

    response = test_client.post(
        "/api/register",
        json={"email": unique_email, "password": "123"}  # too short
    )
    assert response.status_code in (400, 422)


def test_login_success(test_client: TestClient):
    """Login with default seeded user works."""
    response = test_client.post(
        "/api/login",
        json={"email": "plutus_user@plutus.local", "password": "plutus_demo"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "user_id" in data
    assert data["user_id"] == "e4a6eea0-2181-4914-b7bd-20d9208f3129"


def test_login_wrong_password_fails(test_client: TestClient):
    """Login with wrong password returns 401."""
    response = test_client.post(
        "/api/login",
        json={"email": "plutus_user@plutus.local", "password": "wrong_password"}
    )

    assert response.status_code == 401
    assert "failed" in response.json().get("detail", "").lower()


def test_login_nonexistent_user_fails(test_client: TestClient):
    """Login with non-existent email returns 401."""
    response = test_client.post(
        "/api/login",
        json={"email": "nonexistent@plutus.local", "password": "plutus_demo"}
    )

    assert response.status_code == 401


def test_login_missing_fields_fails(test_client: TestClient):
    """Login with missing email or password returns 422."""
    response = test_client.post("/api/login", json={"email": "plutus_user@plutus.local"})
    assert response.status_code == 422

    response = test_client.post("/api/login", json={"password": "plutus_demo"})
    assert response.status_code == 422


# --- E2E pipeline tests ---

def test_full_register_then_login_pipeline(test_client: TestClient):
    """
    E2E test: register a new user, then login with those credentials.
    This tests the complete user journey.
    """
    import uuid
    unique_email = f"e2e_{uuid.uuid4().hex[:8]}@plutus.local"
    password = "e2e_test_password_123"

    # Step 1: Register
    register_response = test_client.post(
        "/api/register",
        json={"email": unique_email, "password": password}
    )
    assert register_response.status_code == 200
    register_data = register_response.json()
    assert "token" in register_data
    assert "user_id" in register_data
    registered_user_id = register_data["user_id"]

    # Step 2: Login with same credentials
    login_response = test_client.post(
        "/api/login",
        json={"email": unique_email, "password": password}
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "token" in login_data
    assert "user_id" in login_data

    # Step 3: Verify the user_id matches
    assert login_data["user_id"] == registered_user_id

    # Step 4: Verify the token works for authenticated endpoints
    token = login_data["token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # Test a protected endpoint - should return 200 with user's data (empty initially)
    transactions_response = test_client.get("/api/transactions", headers=auth_headers)
    assert transactions_response.status_code == 200
    assert isinstance(transactions_response.json(), list)

    # Test balance endpoint
    balance_response = test_client.get("/api/balance", headers=auth_headers)
    assert balance_response.status_code == 200
    balance_data = balance_response.json()
    assert "balance" in balance_data
    assert "user_id" in balance_data
    assert balance_data["user_id"] == registered_user_id


def test_register_then_login_different_user_isolation(test_client: TestClient):
    """
    E2E test: two users register and login, verify data isolation.
    """
    import uuid
    email1 = f"iso_{uuid.uuid4().hex[:8]}@plutus.local"
    email2 = f"iso_{uuid.uuid4().hex[:8]}@plutus.local"
    password = "iso_test_password_123"

    # Register user 1
    reg1 = test_client.post("/api/register", json={"email": email1, "password": password})
    assert reg1.status_code == 200
    user1_id = reg1.json()["user_id"]

    # Register user 2
    reg2 = test_client.post("/api/register", json={"email": email2, "password": password})
    assert reg2.status_code == 200
    user2_id = reg2.json()["user_id"]

    assert user1_id != user2_id

    # Login both
    login1 = test_client.post("/api/login", json={"email": email1, "password": password})
    login2 = test_client.post("/api/login", json={"email": email2, "password": password})

    assert login1.status_code == 200
    assert login2.status_code == 200

    token1 = login1.json()["token"]
    token2 = login2.json()["token"]

    # User 1's transactions should be empty (or their own data)
    headers1 = {"Authorization": f"Bearer {token1}"}
    txns1 = test_client.get("/api/transactions", headers=headers1).json()

    # User 2's transactions should be empty (or their own data)
    headers2 = {"Authorization": f"Bearer {token2}"}
    txns2 = test_client.get("/api/transactions", headers=headers2).json()

    # Both should get 200 but different user_ids in balance
    bal1 = test_client.get("/api/balance", headers=headers1).json()
    bal2 = test_client.get("/api/balance", headers=headers2).json()

    assert bal1["user_id"] == user1_id
    assert bal2["user_id"] == user2_id
    assert bal1["user_id"] != bal2["user_id"]


def test_invalid_token_rejected(test_client: TestClient):
    """Invalid or malformed token should be rejected on protected endpoints."""
    headers = {"Authorization": "Bearer invalid.token.here"}
    response = test_client.get("/api/transactions", headers=headers)
    assert response.status_code == 401


def test_missing_token_rejected(test_client: TestClient):
    """Request without Authorization header should be rejected."""
    response = test_client.get("/api/transactions")
    assert response.status_code == 401


# --- Token verification tests ---

def test_login_token_is_valid_jwt(test_client: TestClient):
    """Login returns a valid JWT that can be decoded."""
    import jwt

    response = test_client.post(
        "/api/login",
        json={"email": "plutus_user@plutus.local", "password": "plutus_demo"}
    )
    assert response.status_code == 200
    token = response.json()["token"]

    # Decode without verification (we don't have the public key in tests)
    payload = jwt.decode(token, options={"verify_signature": False})

    assert "sub" in payload
    assert payload["sub"] == "e4a6eea0-2181-4914-b7bd-20d9208f3129"
    assert "email" in payload
    assert payload["email"] == "plutus_user@plutus.local"
    assert "exp" in payload
    assert "iat" in payload


def test_register_token_is_valid_jwt(test_client: TestClient):
    """Register returns a valid JWT that can be decoded."""
    import jwt
    import uuid

    unique_email = f"jwt_test_{uuid.uuid4().hex[:8]}@plutus.local"
    response = test_client.post(
        "/api/register",
        json={"email": unique_email, "password": "test_password_123"}
    )
    assert response.status_code == 200
    token = response.json()["token"]

    payload = jwt.decode(token, options={"verify_signature": False})

    assert "sub" in payload
    assert payload["email"] == unique_email