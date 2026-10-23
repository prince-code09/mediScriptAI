from fastapi.testclient import TestClient

CLINIC_ID = "c1111111-1111-1111-1111-111111111111"

def test_create_prescription_draft(client: TestClient, auth_headers: dict):
    payload = {
        "clinic_id": CLINIC_ID,
        "prescription_number": "TEST-RX-001",
        "date": "2026-10-22",
        "patient_name": "Kavita Sen",
        "patient_age": 29,
        "patient_gender": "Female",
        "symptoms": "Acute Migraine headache with photophobia",
        "diagnosis": "Classic Migraine",
        "medicines": [
            {
                "name": "Naproxen",
                "strength": "500 mg",
                "dosage_form": "Tablet",
                "dose": "1 tablet",
                "frequency": "SOS",
                "duration": "As needed",
                "instructions": "Take at onset of headache"
            }
        ],
        "advice": "Rest in a quiet dark room. Avoid bright screen exposure.",
        "follow_up": "Review after 1 week if frequent",
        "status": "draft"
    }
    response = client.post("/api/v1/prescriptions", json=payload, headers=auth_headers)
    assert response.status_code == 200
    rx = response.json()
    assert rx["status"] == "draft"
    assert rx["version"] == 1
    assert len(rx["medicines"]) == 1
    assert rx["patient_name"] == "Kavita Sen"

def test_explicit_confirmation_workflow(client: TestClient, auth_headers: dict):
    # 1. Create Draft
    create_payload = {
        "clinic_id": CLINIC_ID,
        "prescription_number": "CONFIRM-RX-002",
        "date": "2026-10-22",
        "patient_name": "Prem Singh",
        "patient_age": 60,
        "patient_gender": "Male",
        "symptoms": "Productive cough and mild fever",
        "medicines": [
            {
                "name": "Amoxicillin & Clavulanate",
                "strength": "625 mg",
                "dosage_form": "Tablet",
                "dose": "1 tablet",
                "frequency": "1-0-1",
                "duration": "5 days",
                "instructions": "After food"
            }
        ]
    }
    create_resp = client.post("/api/v1/prescriptions", json=create_payload, headers=auth_headers)
    assert create_resp.status_code == 200
    rx_id = create_resp.json()["id"]
    assert create_resp.json()["status"] == "draft"

    # 2. Confirm Prescription
    confirm_resp = client.post(
        f"/api/v1/prescriptions/{rx_id}/confirm",
        json={"confirmation_notes": "Examined in OPD and confirmed"},
        headers=auth_headers
    )
    assert confirm_resp.status_code == 200
    confirmed = confirm_resp.json()
    assert confirmed["status"] == "confirmed"
    assert confirmed["confirmed_at"] is not None

    # 3. Direct silent edit on confirmed prescription is rejected with 409 Conflict
    direct_edit_resp = client.put(
        f"/api/v1/prescriptions/{rx_id}",
        json={"symptoms": "Silent modification attempt"},
        headers=auth_headers
    )
    assert direct_edit_resp.status_code == 409
    assert direct_edit_resp.json()["code"] == "CONFLICT"

    # 4. Authorized Revision via /revise endpoint succeeds and increments version
    revise_resp = client.post(
        f"/api/v1/prescriptions/{rx_id}/revise",
        json={
            "reason": "Patient reported stomach upset; added gastro-protective agent",
            "updates": {
                "advice": "Take medications strictly with food. Stay hydrated."
            }
        },
        headers=auth_headers
    )
    assert revise_resp.status_code == 200
    revised = revise_resp.json()
    assert revised["version"] == 2
    assert "strictly with food" in revised["advice"]

    # 5. Check Audit Log
    audit_resp = client.get(f"/api/v1/prescriptions/{rx_id}/audit", headers=auth_headers)
    assert audit_resp.status_code == 200
    audit_logs = audit_resp.json()
    assert len(audit_logs) >= 3  # create_draft, confirm, revise
    actions = [log["action"] for log in audit_logs]
    assert "confirm" in actions
    assert "revise" in actions
