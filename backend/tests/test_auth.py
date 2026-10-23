from fastapi.testclient import TestClient

def test_missing_auth_token_rejected(client: TestClient):
    # Attempting to access protected clinic without Authorization header
    response = client.get("/api/v1/clinics")
    assert response.status_code == 401
    data = response.json()
    assert data["code"] == "MISSING_TOKEN"

def test_malformed_token_rejected(client: TestClient):
    response = client.get(
        "/api/v1/clinics",
        headers={"Authorization": "Bearer not-a-valid-jwt-token"}
    )
    assert response.status_code == 401
    data = response.json()
    assert data["code"] in ["MALFORMED_TOKEN", "INVALID_TOKEN"]

def test_valid_token_accepted(client: TestClient, auth_headers: dict):
    response = client.get("/api/v1/clinics", headers=auth_headers)
    assert response.status_code == 200
    clinics = response.json()
    assert isinstance(clinics, list)
    assert len(clinics) >= 1
    assert clinics[0]["doctor_name"] == "Dr. Rajesh Sharma"

def test_delete_account_requires_auth(client: TestClient):
    response = client.post("/api/v1/auth/delete-account", json={"confirmation": "DELETE"})
    assert response.status_code == 401

def test_delete_account_requires_exact_confirmation(client: TestClient, auth_headers: dict):
    # Lowercase or wrong string rejected
    response = client.post(
        "/api/v1/auth/delete-account",
        json={"confirmation": "delete"},
        headers=auth_headers
    )
    assert response.status_code in [400, 422]

def test_delete_account_success_with_retention_notice(client: TestClient, auth_headers: dict):
    response = client.post(
        "/api/v1/auth/delete-account",
        json={"confirmation": "DELETE"},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "deleted" in data["message"].lower()
    assert "retention" in data["retention_notice"].lower()
