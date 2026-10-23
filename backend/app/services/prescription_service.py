from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import math

from app.core.config import settings
from app.core.security import AuthenticatedUser
from app.core.exceptions import (
    EntityNotFoundException,
    ForbiddenException,
    ValidationException,
    ConflictException
)
from app.db.memory_store import memory_store
from app.db.supabase_client import supabase_client
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    PrescriptionAuditLogResponse,
    MedicineItemSchema
)
from app.schemas.common import PaginatedResponse
from app.services.clinic_service import clinic_service

class PrescriptionService:
    async def list_prescriptions(
        self,
        clinic_id: str,
        user: AuthenticatedUser,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        patient_id: Optional[str] = None
    ) -> PaginatedResponse[PrescriptionResponse]:
        await clinic_service.verify_clinic_access(clinic_id, user)

        if settings.is_supabase_configured:
            params: Dict[str, Any] = {"clinic_id": f"eq.{clinic_id}"}
            if status:
                params["status"] = f"eq.{status}"
            if patient_id:
                params["patient_id"] = f"eq.{patient_id}"
            records = await supabase_client.get("prescriptions", params=params)
            if records is not None:
                total = len(records)
                start = (page - 1) * page_size
                end = start + page_size
                items = [PrescriptionResponse(**r) for r in records[start:end]]
                return PaginatedResponse(
                    items=items,
                    total=total,
                    page=page,
                    page_size=page_size,
                    total_pages=math.ceil(total / page_size) if total > 0 else 1
                )

        matching = [
            rx for rx in memory_store.prescriptions.values()
            if rx["clinic_id"] == clinic_id
        ]
        if status:
            matching = [rx for rx in matching if rx["status"] == status]
        if patient_id:
            matching = [rx for rx in matching if rx.get("patient_id") == patient_id]

        matching.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        total = len(matching)
        start = (page - 1) * page_size
        end = start + page_size
        items = [PrescriptionResponse(**rx) for rx in matching[start:end]]
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 1
        )

    async def get_prescription(self, prescription_id: str, user: AuthenticatedUser) -> PrescriptionResponse:
        if settings.is_supabase_configured:
            records = await supabase_client.get("prescriptions", params={"id": f"eq.{prescription_id}"})
            if records:
                rx = records[0]
                await clinic_service.verify_clinic_access(rx["clinic_id"], user)
                return PrescriptionResponse(**rx)

        rx = memory_store.prescriptions.get(prescription_id)
        if not rx:
            raise EntityNotFoundException("Prescription", prescription_id)
        await clinic_service.verify_clinic_access(rx["clinic_id"], user)
        return PrescriptionResponse(**rx)

    async def create_draft(self, data: PrescriptionCreate, user: AuthenticatedUser) -> PrescriptionResponse:
        await clinic_service.verify_clinic_access(data.clinic_id, user)

        # Enforce that new prescriptions created via draft API start in draft status
        now = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        
        # Ensure medicines have unique IDs
        processed_medicines = []
        for i, m in enumerate(data.medicines):
            med_dict = m.model_dump()
            if not med_dict.get("id"):
                med_dict["id"] = f"med-{i+1}-{uuid.uuid4().hex[:6]}"
            processed_medicines.append(med_dict)

        record = {
            "id": new_id,
            "clinic_id": data.clinic_id,
            "patient_id": data.patient_id,
            "doctor_id": user.id,
            "prescription_number": data.prescription_number or f"MED-{datetime.now().year}-{len(memory_store.prescriptions) + 1:04d}",
            "date": data.date or datetime.now().strftime("%Y-%m-%d"),
            "patient_name": data.patient_name,
            "patient_age": data.patient_age,
            "patient_gender": data.patient_gender or "Other",
            "patient_phone": data.patient_phone or "",
            "symptoms": data.symptoms or "",
            "duration_of_symptoms": data.duration_of_symptoms or "",
            "clinical_findings": data.clinical_findings or "",
            "diagnosis": data.diagnosis,
            "vitals": data.vitals.model_dump() if data.vitals else {},
            "medicines": processed_medicines,
            "advice": data.advice or "",
            "follow_up": data.follow_up or "",
            "tests": data.tests or "",
            "source": data.source or "manual",
            "status": "draft",  # strictly begins as draft
            "confirmed_at": None,
            "sync_status": data.sync_status or "synced",
            "version": 1,
            "print_language": data.print_language or "en",
            "created_at": now,
            "updated_at": now
        }

        if settings.is_supabase_configured:
            res = await supabase_client.insert("prescriptions", record)
            if res:
                await supabase_client.insert("prescription_audit_logs", {
                    "prescription_id": new_id,
                    "user_id": user.id,
                    "action": "create_draft",
                    "metadata": {"source": record["source"]},
                    "created_at": now
                })
                return PrescriptionResponse(**res)

        memory_store.prescriptions[new_id] = record
        memory_store.audit_logs.append({
            "id": str(uuid.uuid4()),
            "prescription_id": new_id,
            "user_id": user.id,
            "action": "create_draft",
            "metadata": {"source": record["source"]},
            "created_at": now
        })
        return PrescriptionResponse(**record)

    async def update_draft(self, prescription_id: str, data: PrescriptionUpdate, user: AuthenticatedUser) -> PrescriptionResponse:
        existing = await self.get_prescription(prescription_id, user)
        
        # Clinical Rule: Cannot silently overwrite a confirmed prescription without formal revision
        if existing.status == "confirmed":
            raise ConflictException(
                detail="This prescription is already confirmed. Use the revision endpoint (/revise) to create an authorized revision with an audit reason."
            )

        now = datetime.now(timezone.utc).isoformat()
        update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
        
        # Do not allow client to change status to confirmed via general update draft endpoint
        if "status" in update_data and update_data["status"] == "confirmed":
            del update_data["status"]

        if "medicines" in update_data and update_data["medicines"] is not None:
            processed = []
            for i, m in enumerate(update_data["medicines"]):
                if isinstance(m, dict):
                    if not m.get("id"):
                        m["id"] = f"med-{i+1}-{uuid.uuid4().hex[:6]}"
                    processed.append(m)
                else:
                    med_dict = m.model_dump()
                    if not med_dict.get("id"):
                        med_dict["id"] = f"med-{i+1}-{uuid.uuid4().hex[:6]}"
                    processed.append(med_dict)
            update_data["medicines"] = processed

        if "vitals" in update_data and update_data["vitals"] is not None:
            update_data["vitals"] = update_data["vitals"] if isinstance(update_data["vitals"], dict) else update_data["vitals"].model_dump()

        update_data["updated_at"] = now

        if settings.is_supabase_configured:
            res = await supabase_client.update("prescriptions", prescription_id, update_data)
            await supabase_client.insert("prescription_audit_logs", {
                "prescription_id": prescription_id,
                "user_id": user.id,
                "action": "update_draft",
                "metadata": {"updated_fields": list(update_data.keys())},
                "created_at": now
            })
            return PrescriptionResponse(**res)

        rx = memory_store.prescriptions[prescription_id]
        for k, v in update_data.items():
            rx[k] = v
        memory_store.audit_logs.append({
            "id": str(uuid.uuid4()),
            "prescription_id": prescription_id,
            "user_id": user.id,
            "action": "update_draft",
            "metadata": {"updated_fields": list(update_data.keys())},
            "created_at": now
        })
        return PrescriptionResponse(**rx)

    async def confirm_prescription(
        self,
        prescription_id: str,
        user: AuthenticatedUser,
        confirmation_notes: Optional[str] = None
    ) -> PrescriptionResponse:
        """
        Explicit clinical confirmation endpoint.
        Revalidates prescription, checks doctor authorization, updates status, and appends audit record.
        """
        existing = await self.get_prescription(prescription_id, user)
        if existing.status == "confirmed":
            return existing  # Already confirmed, idempotent

        if not existing.medicines:
            raise ValidationException(detail="Prescription must contain at least one medicine before confirmation.")

        now = datetime.now(timezone.utc).isoformat()
        confirm_payload = {
            "status": "confirmed",
            "confirmed_at": now,
            "updated_at": now,
            "sync_status": "synced"
        }

        if settings.is_supabase_configured:
            res = await supabase_client.update("prescriptions", prescription_id, confirm_payload)
            if res:
                await supabase_client.insert("prescription_audit_logs", {
                    "prescription_id": prescription_id,
                    "user_id": user.id,
                    "action": "confirm",
                    "metadata": {"notes": confirmation_notes or "Confirmed by attending doctor"},
                    "created_at": now
                })
                return PrescriptionResponse(**res)

        rx = memory_store.prescriptions[prescription_id]
        rx["status"] = "confirmed"
        rx["confirmed_at"] = now
        rx["updated_at"] = now
        rx["sync_status"] = "synced"

        memory_store.audit_logs.append({
            "id": str(uuid.uuid4()),
            "prescription_id": prescription_id,
            "user_id": user.id,
            "action": "confirm",
            "metadata": {"notes": confirmation_notes or "Confirmed by attending doctor"},
            "created_at": now
        })
        return PrescriptionResponse(**rx)

    async def revise_prescription(
        self,
        prescription_id: str,
        reason: str,
        updates: PrescriptionUpdate,
        user: AuthenticatedUser
    ) -> PrescriptionResponse:
        """
        Revises a confirmed prescription.
        Increments the revision version and records the clinical reason in the audit log.
        """
        existing = await self.get_prescription(prescription_id, user)
        now = datetime.now(timezone.utc).isoformat()
        new_version = existing.version + 1

        update_dict = {k: v for k, v in updates.model_dump(exclude_unset=True).items()}
        if "medicines" in update_dict and update_dict["medicines"] is not None:
            processed = []
            for i, m in enumerate(update_dict["medicines"]):
                med_dict = m if isinstance(m, dict) else m.model_dump()
                if not med_dict.get("id"):
                    med_dict["id"] = f"med-{i+1}-{uuid.uuid4().hex[:6]}"
                processed.append(med_dict)
            update_dict["medicines"] = processed

        if "vitals" in update_dict and update_dict["vitals"] is not None:
            update_dict["vitals"] = update_dict["vitals"] if isinstance(update_dict["vitals"], dict) else update_dict["vitals"].model_dump()

        update_dict["version"] = new_version
        update_dict["updated_at"] = now
        # Keep status confirmed or move to draft for re-review
        update_dict["status"] = "confirmed"

        if settings.is_supabase_configured:
            res = await supabase_client.update("prescriptions", prescription_id, update_dict)
            if res:
                await supabase_client.insert("prescription_audit_logs", {
                    "prescription_id": prescription_id,
                    "user_id": user.id,
                    "action": "revise",
                    "metadata": {
                        "reason": reason,
                        "previous_version": existing.version,
                        "new_version": new_version
                    },
                    "created_at": now
                })
                return PrescriptionResponse(**res)

        rx = memory_store.prescriptions[prescription_id]
        for k, v in update_dict.items():
            rx[k] = v
        memory_store.audit_logs.append({
            "id": str(uuid.uuid4()),
            "prescription_id": prescription_id,
            "user_id": user.id,
            "action": "revise",
            "metadata": {
                "reason": reason,
                "previous_version": existing.version,
                "new_version": new_version
            },
            "created_at": now
        })
        return PrescriptionResponse(**rx)

    async def get_audit_history(self, prescription_id: str, user: AuthenticatedUser) -> List[PrescriptionAuditLogResponse]:
        await self.get_prescription(prescription_id, user)
        if settings.is_supabase_configured:
            records = await supabase_client.get("prescription_audit_logs", params={"prescription_id": f"eq.{prescription_id}"})
            if records is not None:
                return [PrescriptionAuditLogResponse(**r) for r in records]

        logs = [
            PrescriptionAuditLogResponse(**l)
            for l in memory_store.audit_logs
            if l["prescription_id"] == prescription_id
        ]
        logs.sort(key=lambda x: x.created_at, reverse=True)
        return logs

prescription_service = PrescriptionService()
