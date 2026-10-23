from typing import List, Dict, Any
from datetime import datetime, timezone
import uuid

from app.core.config import settings
from app.core.security import AuthenticatedUser
from app.core.logging import logger
from app.db.memory_store import memory_store
from app.db.supabase_client import supabase_client
from app.schemas.sync import (
    SyncBatchRequest,
    SyncBatchResponse,
    SyncOperationResult
)
from app.services.clinic_service import clinic_service

class SyncService:
    async def process_sync_batch(self, request: SyncBatchRequest, user: AuthenticatedUser) -> SyncBatchResponse:
        await clinic_service.verify_clinic_access(request.clinic_id, user)
        now = datetime.now(timezone.utc).isoformat()
        results: List[SyncOperationResult] = []
        synced_count = 0
        ignored_count = 0
        failed_count = 0

        for op in request.operations:
            op_id = op.client_operation_id
            entity_type = op.entity_type
            entity_id = op.entity_id
            operation = op.operation
            payload = op.payload

            # 1. Idempotency Check: check if this client_operation_id was already processed
            already_processed = False
            if settings.is_supabase_configured:
                existing = await supabase_client.get("sync_queue", params={"client_operation_id": f"eq.{op_id}"})
                if existing:
                    already_processed = True
            if not already_processed and op_id in memory_store.sync_queue:
                already_processed = True

            if already_processed:
                results.append(SyncOperationResult(
                    client_operation_id=op_id,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    status="duplicate_ignored",
                    server_timestamp=now,
                    message="Operation already processed idempotently."
                ))
                ignored_count += 1
                continue

            # 2. Process entity operation
            try:
                if entity_type == "patient":
                    if operation in ["create", "update"]:
                        patient_data = {
                            "id": entity_id,
                            "clinic_id": request.clinic_id,
                            "name": payload.get("name", "Unknown Patient"),
                            "age": payload.get("age"),
                            "gender": payload.get("gender", "Other"),
                            "phone": payload.get("phone", ""),
                            "allergies": payload.get("allergies", ""),
                            "clinical_notes": payload.get("clinical_notes", ""),
                            "total_visits": payload.get("total_visits", payload.get("totalVisits", 1)),
                            "last_visit_date": payload.get("last_visit_date", payload.get("lastVisit")),
                            "created_at": payload.get("created_at", payload.get("createdAt", now)),
                            "updated_at": now
                        }
                        if settings.is_supabase_configured:
                            await supabase_client.insert("patients", patient_data)
                        memory_store.patients[entity_id] = patient_data

                elif entity_type == "prescription":
                    if operation == "permanent_delete":
                        if settings.is_supabase_configured:
                            await supabase_client.delete("prescriptions", params={"id": f"eq.{entity_id}"})
                            await supabase_client.insert("prescription_audit_logs", {
                                "prescription_id": entity_id,
                                "user_id": user.id,
                                "action": "permanent_delete",
                                "client_operation_id": op_id,
                                "metadata": {"operation": operation},
                                "created_at": now
                            })
                        memory_store.prescriptions.pop(entity_id, None)
                    else:
                        is_deleted = operation in ["soft_delete", "delete"] or payload.get("is_deleted") or payload.get("isDeleted", False)
                        deleted_at = payload.get("deleted_at") or payload.get("deletedAt") if is_deleted else None
                        if is_deleted and not deleted_at:
                            deleted_at = now
                        rx_status = "deleted" if is_deleted else (payload.get("status") or "draft")

                        # Clean and format prescription payload
                        rx_data = {
                            "id": entity_id,
                            "clinic_id": request.clinic_id,
                            "doctor_id": user.id,
                            "prescription_number": payload.get("prescription_number") or payload.get("prescriptionNumber") or f"MED-{now[:4]}-SYNC",
                            "date": payload.get("date") or now[:10],
                            "patient_id": payload.get("patient_id") or payload.get("patientId"),
                            "patient_name": payload.get("patient_name") or payload.get("patientName", "Patient"),
                            "patient_age": payload.get("patient_age") or payload.get("patientAge"),
                            "patient_gender": payload.get("patient_gender") or payload.get("patientGender", "Other"),
                            "patient_phone": payload.get("patient_phone") or payload.get("patientPhone", ""),
                            "symptoms": payload.get("symptoms", ""),
                            "duration_of_symptoms": payload.get("duration_of_symptoms") or payload.get("durationOfSymptoms", ""),
                            "clinical_findings": payload.get("clinical_findings") or payload.get("clinicalFindings", ""),
                            "diagnosis": payload.get("diagnosis"),
                            "vitals": payload.get("vitals", {}),
                            "medicines": payload.get("medicines", []),
                            "advice": payload.get("advice", ""),
                            "follow_up": payload.get("follow_up") or payload.get("followUp", ""),
                            "tests": payload.get("tests", ""),
                            "source": payload.get("source", "manual"),
                            "status": rx_status,
                            "sync_status": "synced",
                            "version": payload.get("version", 1),
                            "print_language": payload.get("print_language") or payload.get("printLanguage", "en"),
                            "is_deleted": is_deleted,
                            "deleted_at": deleted_at,
                            "created_at": payload.get("created_at") or payload.get("createdAt", now),
                            "updated_at": now
                        }
                        if settings.is_supabase_configured:
                            await supabase_client.insert("prescriptions", rx_data)
                            await supabase_client.insert("prescription_audit_logs", {
                                "prescription_id": entity_id,
                                "user_id": user.id,
                                "action": "sync",
                                "client_operation_id": op_id,
                                "metadata": {"operation": operation, "is_deleted": is_deleted},
                                "created_at": now
                            })
                        memory_store.prescriptions[entity_id] = rx_data
                        memory_store.audit_logs.append({
                            "id": str(uuid.uuid4()),
                            "prescription_id": entity_id,
                            "user_id": user.id,
                            "action": "sync",
                            "client_operation_id": op_id,
                            "metadata": {"operation": operation, "is_deleted": is_deleted},
                            "created_at": now
                        })

                # 3. Record operation into sync_queue
                queue_entry = {
                    "id": str(uuid.uuid4()),
                    "client_operation_id": op_id,
                    "user_id": user.id,
                    "clinic_id": request.clinic_id,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "operation": operation,
                    "payload": payload,
                    "status": "processed",
                    "processed_at": now,
                    "created_at": now
                }
                if settings.is_supabase_configured:
                    await supabase_client.insert("sync_queue", queue_entry)
                memory_store.sync_queue[op_id] = queue_entry

                results.append(SyncOperationResult(
                    client_operation_id=op_id,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    status="synced",
                    server_timestamp=now,
                    message="Successfully synced with cloud database."
                ))
                synced_count += 1

            except Exception as e:
                logger.error(f"Sync operation {op_id} failed: {str(e)}")
                results.append(SyncOperationResult(
                    client_operation_id=op_id,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    status="failed",
                    server_timestamp=now,
                    message=f"Sync error: {str(e)}"
                ))
                failed_count += 1

        return SyncBatchResponse(
            results=results,
            total_processed=len(request.operations),
            synced_count=synced_count,
            ignored_count=ignored_count,
            failed_count=failed_count
        )

sync_service = SyncService()
