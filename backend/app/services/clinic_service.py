from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from app.core.config import settings
from app.core.security import AuthenticatedUser
from app.core.exceptions import EntityNotFoundException, ForbiddenException, ValidationException
from app.core.logging import logger
from app.db.memory_store import memory_store
from app.db.supabase_client import supabase_client
from app.schemas.clinic import ClinicCreate, ClinicUpdate, ClinicResponse, FormatSettingsSchema

class ClinicService:
    async def verify_clinic_access(self, clinic_id: str, user: AuthenticatedUser, owner_only: bool = False):
        clinic = memory_store.clinics.get(clinic_id)
        if not clinic and settings.is_supabase_configured:
            records = await supabase_client.get("clinics", params={"id": f"eq.{clinic_id}"})
            if records:
                clinic = records[0]

        if not clinic:
            raise EntityNotFoundException(entity="Clinic", entity_id=clinic_id)

        is_owner = clinic.get("owner_id") == user.id
        membership_key = f"{clinic_id}_{user.id}"
        is_member = is_owner or membership_key in memory_store.clinic_members or user.clinic_id == clinic_id

        if owner_only and not is_owner:
            raise ForbiddenException(detail="Only the clinic owner may perform this action.")
        if not is_member:
            raise ForbiddenException(detail="Access denied to clinic records.")
        return True

    async def list_clinics(self, user: AuthenticatedUser) -> List[ClinicResponse]:
        if settings.is_supabase_configured:
            # Supabase PostgREST with user token
            records = await supabase_client.get("clinics")
            if records is not None:
                return [ClinicResponse(**r) for r in records]

        # Memory store: return clinics user owns or is member of
        results = []
        for c in memory_store.clinics.values():
            if c.get("owner_id") == user.id or f"{c['id']}_{user.id}" in memory_store.clinic_members:
                results.append(ClinicResponse(**c))
        return results

    async def get_clinic(self, clinic_id: str, user: AuthenticatedUser) -> ClinicResponse:
        await self.verify_clinic_access(clinic_id, user)
        if settings.is_supabase_configured:
            records = await supabase_client.get("clinics", params={"id": f"eq.{clinic_id}"})
            if records:
                return ClinicResponse(**records[0])

        clinic = memory_store.clinics.get(clinic_id)
        if not clinic:
            raise EntityNotFoundException("Clinic", clinic_id)
        return ClinicResponse(**clinic)

    async def create_clinic(self, data: ClinicCreate, user: AuthenticatedUser) -> ClinicResponse:
        now = datetime.now(timezone.utc).isoformat()
        new_id = str(uuid.uuid4())
        record = {
            "id": new_id,
            "owner_id": user.id,
            "name": data.name,
            "doctor_name": data.doctor_name,
            "qualification": data.qualification or "",
            "reg_no": data.reg_no or "",
            "address": data.address or "",
            "phone": data.phone or "",
            "email": data.email or "",
            "logo_url": data.logo_url,
            "format_settings": data.format_settings.model_dump() if data.format_settings else {
                "template": "general",
                "paperSize": "A4",
                "showClinicLogo": True,
                "showVitals": True,
                "showRxHeader": True,
                "clinicHeaderColor": "#243B64",
                "printNotes": "Valid for dispensing at any licensed pharmacy in India.",
                "fontFamily": "sans"
            },
            "created_at": now,
            "updated_at": now
        }

        if settings.is_supabase_configured:
            res = await supabase_client.insert("clinics", record)
            if res:
                return ClinicResponse(**res)

        memory_store.clinics[new_id] = record
        memory_store.clinic_members[f"{new_id}_{user.id}"] = {
            "id": str(uuid.uuid4()),
            "clinic_id": new_id,
            "user_id": user.id,
            "role": "owner",
            "created_at": now
        }
        return ClinicResponse(**record)

    async def update_clinic(self, clinic_id: str, data: ClinicUpdate, user: AuthenticatedUser) -> ClinicResponse:
        await self.verify_clinic_access(clinic_id, user, owner_only=True)
        now = datetime.now(timezone.utc).isoformat()

        if settings.is_supabase_configured:
            update_data = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
            update_data["updated_at"] = now
            res = await supabase_client.update("clinics", clinic_id, update_data)
            if res:
                return ClinicResponse(**res)

        clinic = memory_store.clinics.get(clinic_id)
        if not clinic:
            raise EntityNotFoundException("Clinic", clinic_id)

        for k, v in data.model_dump(exclude_unset=True).items():
            if v is not None:
                if k == "format_settings" and isinstance(v, dict):
                    clinic["format_settings"] = v
                else:
                    clinic[k] = v
        clinic["updated_at"] = now
        return ClinicResponse(**clinic)

    async def upload_logo(self, clinic_id: str, logo_data: str, user: AuthenticatedUser) -> ClinicResponse:
        await self.verify_clinic_access(clinic_id, user, owner_only=True)
        logo_data = logo_data.strip()
        is_data_uri = logo_data.startswith("data:image/")
        is_url = logo_data.startswith("http://") or logo_data.startswith("https://")

        if not (is_data_uri or is_url):
            raise ValidationException(detail="Logo must be a valid image Data URI or HTTPS URL.")

        if is_data_uri:
            allowed = ("data:image/png", "data:image/jpeg", "data:image/jpg", "data:image/webp")
            if not any(logo_data.startswith(prefix) for prefix in allowed):
                raise ValidationException(detail="Unsupported image format. Allowed formats: PNG, JPEG, WEBP.")
            if len(logo_data) > 2.8 * 1024 * 1024:
                raise ValidationException(detail="Logo file size exceeds 2MB limit.")

        now = datetime.now(timezone.utc).isoformat()
        if settings.is_supabase_configured:
            res = await supabase_client.update("clinics", clinic_id, {"logo_url": logo_data, "updated_at": now})
            if res:
                return ClinicResponse(**res)

        clinic = memory_store.clinics.get(clinic_id)
        if not clinic:
            raise EntityNotFoundException("Clinic", clinic_id)
        clinic["logo_url"] = logo_data
        clinic["updated_at"] = now
        return ClinicResponse(**clinic)

    async def remove_logo(self, clinic_id: str, user: AuthenticatedUser) -> ClinicResponse:
        await self.verify_clinic_access(clinic_id, user, owner_only=True)
        now = datetime.now(timezone.utc).isoformat()
        if settings.is_supabase_configured:
            res = await supabase_client.update("clinics", clinic_id, {"logo_url": None, "updated_at": now})
            if res:
                return ClinicResponse(**res)

        clinic = memory_store.clinics.get(clinic_id)
        if not clinic:
            raise EntityNotFoundException("Clinic", clinic_id)
        clinic["logo_url"] = None
        clinic["updated_at"] = now
        return ClinicResponse(**clinic)

    async def get_format_settings(self, clinic_id: str, user: AuthenticatedUser) -> FormatSettingsSchema:
        clinic = await self.get_clinic(clinic_id, user)
        if clinic.format_settings:
            return clinic.format_settings
        return FormatSettingsSchema()

    async def update_format_settings(self, clinic_id: str, settings_data: FormatSettingsSchema, user: AuthenticatedUser) -> FormatSettingsSchema:
        await self.verify_clinic_access(clinic_id, user, owner_only=False)
        now = datetime.now(timezone.utc).isoformat()

        if settings.is_supabase_configured:
            await supabase_client.update("clinics", clinic_id, {"format_settings": settings_data.model_dump(), "updated_at": now})
            return settings_data

        clinic = memory_store.clinics.get(clinic_id)
        if not clinic:
            raise EntityNotFoundException("Clinic", clinic_id)
        clinic["format_settings"] = settings_data.model_dump()
        clinic["updated_at"] = now
        return settings_data

clinic_service = ClinicService()
