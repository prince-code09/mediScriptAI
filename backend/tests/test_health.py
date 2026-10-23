from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "MediScript" in data["service"]
    assert "version" in data
    # Ensure no credentials or connection strings are exposed in health response
    assert "password" not in data
    assert "secret" not in data
    assert "key" not in data

def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "MediScript Clinical API is running" in data["message"]
