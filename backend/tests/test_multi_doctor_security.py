import pytest
from fastapi.testclient import TestClient

CLINIC_A_ID = "c1111111-1111-1111-1111-111111111111"

def test_doctor_a_can_upload_and_remove_clinic_logo(client: TestClient, auth_headers: dict):
    # 1. Upload valid logo as Doctor A (owner of Clinic A)
    logo_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    resp = client.post(
        f"/api/v1/clinics/{CLINIC_A_ID}/logo",
        json={"logo_data": logo_data},
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["logo_url"] == logo_data

    # 2. Re-fetch clinic to confirm persistence
    get_resp = client.get(f"/api/v1/clinics/{CLINIC_A_ID}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["logo_url"] == logo_data

    # 3. Remove logo as Doctor A
    del_resp = client.delete(f"/api/v1/clinics/{CLINIC_A_ID}/logo", headers=auth_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["logo_url"] is None

    # Verify removal persisted
    get_after_del = client.get(f"/api/v1/clinics/{CLINIC_A_ID}", headers=auth_headers)
    assert get_after_del.json()["logo_url"] is None

def test_doctor_b_cannot_tamper_with_doctor_a_logo(client: TestClient, other_doctor_headers: dict):
    # Doctor B attempts to upload logo to Doctor A's clinic -> Denied 403 Forbidden
    logo_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    resp = client.post(
        f"/api/v1/clinics/{CLINIC_A_ID}/logo",
        json={"logo_data": logo_data},
        headers=other_doctor_headers
    )
    assert resp.status_code == 403
    assert resp.json()["code"] == "FORBIDDEN"

    # Doctor B attempts to delete Doctor A's clinic logo -> Denied 403 Forbidden
    del_resp = client.delete(f"/api/v1/clinics/{CLINIC_A_ID}/logo", headers=other_doctor_headers)
    assert del_resp.status_code == 403
    assert del_resp.json()["code"] == "FORBIDDEN"

def test_invalid_logo_data_rejected(client: TestClient, auth_headers: dict):
    # Plain text or non-image format is rejected
    resp = client.post(
        f"/api/v1/clinics/{CLINIC_A_ID}/logo",
        json={"logo_data": "not-a-valid-image-data-uri"},
        headers=auth_headers
    )
    assert resp.status_code == 422
    assert "VALIDATION" in resp.json()["code"]

def test_multi_doctor_independent_clinic_creation_and_isolation(
    client: TestClient, 
    auth_headers: dict, 
    other_doctor_headers: dict
):
    # 1. Doctor B creates their own independent clinic
    b_clinic_payload = {
        "name": "Shivalik Community Clinic",
        "doctor_name": "Dr. Sunita Verma",
        "qualification": "MBBS, DNB (Family Medicine)",
        "reg_no": "DMC-98765",
        "address": "Sector 3, Solan, HP",
        "phone": "+91 94180 11223",
        "email": "dr.verma@otherclinic.in"
    }
    create_resp = client.post("/api/v1/clinics", json=b_clinic_payload, headers=other_doctor_headers)
    assert create_resp.status_code == 200
    b_clinic_id = create_resp.json()["id"]
    assert create_resp.json()["doctor_name"] == "Dr. Sunita Verma"

    # 2. Doctor B uploads logo to their own clinic -> Allowed
    b_logo = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="
    logo_resp = client.post(
        f"/api/v1/clinics/{b_clinic_id}/logo",
        json={"logo_data": b_logo},
        headers=other_doctor_headers
    )
    assert logo_resp.status_code == 200
    assert logo_resp.json()["logo_url"] == b_logo

    # 3. Doctor A cannot access Doctor B's clinic details
    a_get_resp = client.get(f"/api/v1/clinics/{b_clinic_id}", headers=auth_headers)
    assert a_get_resp.status_code == 403
    assert a_get_resp.json()["code"] == "FORBIDDEN"

    # 4. Doctor A cannot modify or delete Doctor B's logo
    a_del_resp = client.delete(f"/api/v1/clinics/{b_clinic_id}/logo", headers=auth_headers)
    assert a_del_resp.status_code == 403
    assert a_del_resp.json()["code"] == "FORBIDDEN"

def test_doctor_b_cannot_access_or_modify_doctor_a_prescriptions(
    client: TestClient,
    auth_headers: dict,
    other_doctor_headers: dict
):
    # 1. Doctor A creates prescription draft
    rx_payload = {
        "clinic_id": CLINIC_A_ID,
        "prescription_number": "RX-DOC-A-001",
        "date": "2026-10-23",
        "patient_name": "Private Patient A",
        "patient_age": 40,
        "patient_gender": "Male",
        "symptoms": "Confidential patient symptom",
        "medicines": [
            {
                "name": "Paracetamol",
                "strength": "650 mg",
                "dosage_form": "Tablet",
                "dose": "1 tablet",
                "frequency": "1-0-1",
                "duration": "3 days",
                "instructions": "After meals"
            }
        ]
    }
    create_rx = client.post("/api/v1/prescriptions", json=rx_payload, headers=auth_headers)
    assert create_rx.status_code == 200
    rx_id = create_rx.json()["id"]

    # 2. Doctor B attempts to view Doctor A's prescription -> Denied 403 Forbidden
    view_rx = client.get(f"/api/v1/prescriptions/{rx_id}", headers=other_doctor_headers)
    assert view_rx.status_code == 403
    assert view_rx.json()["code"] == "FORBIDDEN"

    # 3. Doctor B attempts to update Doctor A's prescription -> Denied 403 Forbidden
    update_rx = client.put(
        f"/api/v1/prescriptions/{rx_id}",
        json={"symptoms": "Unauthorized modification attempt"},
        headers=other_doctor_headers
    )
    assert update_rx.status_code == 403
    assert update_rx.json()["code"] == "FORBIDDEN"

    # 4. Doctor B attempts to confirm Doctor A's prescription -> Denied 403 Forbidden
    confirm_rx = client.post(
        f"/api/v1/prescriptions/{rx_id}/confirm",
        json={"confirmation_notes": "Unauthorized confirmation"},
        headers=other_doctor_headers
    )
    assert confirm_rx.status_code == 403
    assert confirm_rx.json()["code"] == "FORBIDDEN"
