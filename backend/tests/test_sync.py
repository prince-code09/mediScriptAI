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

def test_sync_soft_delete_and_list_exclusion(client: TestClient, auth_headers: dict):
    rx_id = str(uuid.uuid4())
    create_op_id = str(uuid.uuid4())
    del_op_id = str(uuid.uuid4())

    # 1. Sync create prescription
    create_payload = {
        "clinic_id": CLINIC_ID,
        "operations": [
            {
                "client_operation_id": create_op_id,
                "entity_type": "prescription",
                "entity_id": rx_id,
                "operation": "create",
                "payload": {
                    "patient_name": "Test Delete Patient",
                    "patient_age": 40,
                    "patient_gender": "Male",
                    "prescription_number": f"TEST-DEL-{rx_id[:6]}",
                    "date": "2026-10-23",
                    "medicines": []
                }
            }
        ]
    }
    resp1 = client.post("/api/v1/sync/batch", json=create_payload, headers=auth_headers)
    assert resp1.status_code == 200

    # Verify present in normal list
    list_resp = client.get(f"/api/v1/prescriptions?clinic_id={CLINIC_ID}", headers=auth_headers)
    assert list_resp.status_code == 200
    rx_ids = [item["id"] for item in list_resp.json()["items"]]
    assert rx_id in rx_ids

    # 2. Sync soft_delete operation
    delete_payload = {
        "clinic_id": CLINIC_ID,
        "operations": [
            {
                "client_operation_id": del_op_id,
                "entity_type": "prescription",
                "entity_id": rx_id,
                "operation": "soft_delete",
                "payload": {
                    "is_deleted": True,
                    "deleted_at": "2026-10-23T12:00:00Z"
                }
            }
        ]
    }
    resp2 = client.post("/api/v1/sync/batch", json=delete_payload, headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["synced_count"] == 1

    # Verify excluded from normal list
    list_resp_after = client.get(f"/api/v1/prescriptions?clinic_id={CLINIC_ID}", headers=auth_headers)
    assert list_resp_after.status_code == 200
    rx_ids_after = [item["id"] for item in list_resp_after.json()["items"]]
    assert rx_id not in rx_ids_after

    # 3. Verify accessible when explicitly querying status=deleted (Recycle Bin)
    del_list_resp = client.get(f"/api/v1/prescriptions?clinic_id={CLINIC_ID}&status=deleted", headers=auth_headers)
    assert del_list_resp.status_code == 200
    del_rx_ids = [item["id"] for item in del_list_resp.json()["items"]]
    assert rx_id in del_rx_ids
