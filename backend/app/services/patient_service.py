from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import math

from app.core.config import settings
from app.core.security import AuthenticatedUser
from app.core.exceptions import EntityNotFoundException, ForbiddenException
from app.db.memory_store import memory_store
from app.db.supabase_client import supabase_client
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.schemas.prescription import PrescriptionResponse
from app.schemas.common import PaginatedResponse
from app.services.clinic_service import clinic_service

class PatientService:
    async def list_patients(
        self,
        clinic_id: str,
        user: AuthenticatedUser,
        page: int = 1,
        page_size: int = 20,
        query: Optional[str] = None
    ) -> PaginatedResponse[PatientResponse]:
        await clinic_service.verify_clinic_access(clinic_id, user)

        if settings.is_supabase_configured:
            params: Dict[str, Any] = {"clinic_id": f"eq.{clinic_id}"}
            if query:
                params["name"] = f"ilike.*{query}*"
            records = await supabase_client.get("patients", params=params)
            if records is not None:
                total = len(records)
                start = (page - 1) * page_size
                end = start + page_size
                sliced = records[start:end]
                items = [PatientResponse(**r) for r in sliced]
                return PaginatedResponse(
                    items=items,
                    total=total,
                    page=page,
                    page_size=page_size,
                    total_pages=math.ceil(total / page_size) if total > 0 else 1
                )

        # In-memory store
        matching = [
            p for p in memory_store.patients.values()
            if p["clinic_id"] == clinic_id
        ]

        if query:
            q_lower = query.lower().strip()
            matching = [
                p for p in matching
                if q_lower in p["name"].lower()
                or (p.get("phone") and q_lower in p["phone"].lower())
                or (p.get("patient_identifier") and q_lower in p["patient_identifier"].lower())
            ]

        total = len(matching)
        start = (page - 1) * page_size
        end = start + page_size
        items = [PatientResponse(**p) for p in matching[start:end]]
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 1
        )

    async def get_patient(self, patient_id: str, user: AuthenticatedUser) -> PatientResponse:
        if settings.is_supabase_configured:
            records = await supabase_client.get("patients", params={"id": f"eq.{patient_id}"})
            if not records:
                raise EntityNotFoundException("Patient", patient_id)
            patient = records[0]
            await clinic_service.verify_clinic_access(patient["clinic_id"], user)
            return PatientResponse(**patient)

        patient = memory_store.patients.get(patient_id)
        if not patient:
            raise EntityNotFoundException("Patient", patient_id)
        await clinic_service.verify_clinic_access(patient["clinic_id"], user)
        return PatientResponse(**patient)

    async def create_patient(self, data: PatientCreate, user: AuthenticatedUser) -> PatientResponse:
        await clinic_service.verify_clinic_access(data.clinic_id, user)
        now = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        identifier = data.patient_identifier or f"PAT-{len(memory_store.patients) + 1:04d}"

        record = {
            "id": new_id,
            "clinic_id": data.clinic_id,
            "patient_identifier": identifier,
            "name": data.name,
            "age": data.age,
            "gender": data.gender or "Other",
            "phone": data.phone or "",
            "address": data.address or "",
            "allergies": data.allergies or "",
            "clinical_notes": data.clinical_notes or "",
            "total_visits": 0,
            "last_visit_date": None,
            "created_at": now,
            "updated_at": now
        }

        if settings.is_supabase_configured:
            res = await supabase_client.insert("patients", record)
            if res:
                return PatientResponse(**res)

        memory_store.patients[new_id] = record
        return PatientResponse(**record)

    async def update_patient(self, patient_id: str, data: PatientUpdate, user: AuthenticatedUser) -> PatientResponse:
        existing = await self.get_patient(patient_id, user)
        now = datetime.now(timezone.utc).isoformat()

        if settings.is_supabase_configured:
            update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
            update_data["updated_at"] = now
            res = await supabase_client.update("patients", patient_id, update_data)
            if res:
                return PatientResponse(**res)

        patient = memory_store.patients[patient_id]
        for k, v in data.model_dump(exclude_unset=True).items():
            if v is not None:
                patient[k] = v
        patient["updated_at"] = now
        return PatientResponse(**patient)

    async def get_patient_prescriptions(self, patient_id: str, user: AuthenticatedUser) -> List[PrescriptionResponse]:
        patient = await self.get_patient(patient_id, user)
        if settings.is_supabase_configured:
            records = await supabase_client.get("prescriptions", params={"patient_id": f"eq.{patient_id}"})
            if records is not None:
                return [PrescriptionResponse(**r) for r in records]

        results = [
            PrescriptionResponse(**rx)
            for rx in memory_store.prescriptions.values()
            if rx.get("patient_id") == patient_id
        ]
        results.sort(key=lambda x: x.date, reverse=True)
        return results

patient_service = PatientService()
