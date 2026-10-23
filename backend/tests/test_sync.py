from fastapi.testclient import TestClient
import uuid

CLINIC_ID = "c1111111-1111-1111-1111-111111111111"

def test_idempotent_offline_sync(client: TestClient, auth_headers: dict):
    op_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())

    batch_payload = {
        "clinic_id": CLINIC_ID,
        "operations": [
            {
                "client_operation_id": op_id,
                "entity_type": "patient",
                "entity_id": patient_id,
                "operation": "create",
                "payload": {
                    "name": "Geeta Sharma",
                    "age": 34,
                    "gender": "Female",
                    "phone": "+91 98160 99887",
                    "allergies": "None"
                }
            }
        ]
    }

    # First Sync Attempt -> Should Succeed as 'synced'
    resp1 = client.post("/api/v1/sync/batch", json=batch_payload, headers=auth_headers)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["synced_count"] == 1
    assert data1["ignored_count"] == 0
    assert data1["results"][0]["status"] == "synced"

    # Second Sync Attempt with identical client_operation_id -> Must be 'duplicate_ignored'
    resp2 = client.post("/api/v1/sync/batch", json=batch_payload, headers=auth_headers)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["synced_count"] == 0
    assert data2["ignored_count"] == 1
    assert data2["results"][0]["status"] == "duplicate_ignored"
