from fastapi.testclient import TestClient

CLINIC_ID = "c1111111-1111-1111-1111-111111111111"

def test_list_patients(client: TestClient, auth_headers: dict):
    response = client.get(f"/api/v1/patients?clinic_id={CLINIC_ID}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2
    assert any(p["name"] == "Ramesh Kumar Verma" for p in data["items"])

def test_patient_search_by_name(client: TestClient, auth_headers: dict):
    response = client.get(f"/api/v1/patients?clinic_id={CLINIC_ID}&q=Sunita", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Sunita Devi"

def test_create_patient(client: TestClient, auth_headers: dict):
    payload = {
        "clinic_id": CLINIC_ID,
        "name": "Anil Thakur",
        "age": 52,
        "gender": "Male",
        "phone": "+91 98160 55443",
        "address": "Village Darlaghat",
        "allergies": "Sulfa drugs",
        "clinical_notes": "Type 2 Diabetic on Metformin"
    }
    response = client.post("/api/v1/patients", json=payload, headers=auth_headers)
    assert response.status_code == 200
    created = response.json()
    assert created["name"] == "Anil Thakur"
    assert created["age"] == 52
    assert "id" in created

def test_cross_clinic_access_denied(client: TestClient, other_doctor_headers: dict):
    # Dr. Verma belongs to a different clinic and attempts to access Dr. Sharma's patients
    response = client.get(f"/api/v1/patients?clinic_id={CLINIC_ID}", headers=other_doctor_headers)
    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "FORBIDDEN"
