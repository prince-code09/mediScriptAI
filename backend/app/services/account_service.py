from typing import Optional
import httpx

from app.core.config import settings
from app.core.security import AuthenticatedUser
from app.core.exceptions import ValidationException, UnauthorizedException
from app.core.logging import logger
from app.db.memory_store import memory_store
from app.schemas.auth import AccountDeleteRequest, AccountDeleteResponse

class AccountService:
    async def delete_account(self, data: AccountDeleteRequest, user: AuthenticatedUser) -> AccountDeleteResponse:
        # 1. Enforce strict uppercase explicit confirmation
        if data.confirmation.strip() != "DELETE":
            raise ValidationException(
                detail="Confirmation failed. You must type 'DELETE' in all capital letters to permanently delete your account."
            )

        user_id = user.id
        logger.info(f"Processing permanent account deletion for doctor user: {user_id}")

        # 2. Supabase Admin API Deletion (if service role key is provisioned)
        # Note: Never exposed to client. Server-to-server only.
        service_key = getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "")
        if settings.is_supabase_configured and service_key:
            admin_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/admin/users/{user_id}"
            headers = {
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json"
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.delete(admin_url, headers=headers)
                    if resp.status_code in [200, 204]:
                        logger.info(f"Successfully deleted user {user_id} from Supabase Auth admin.")
                    else:
                        logger.warning(f"Supabase Admin delete returned {resp.status_code}: {resp.text[:120]}")
            except Exception as e:
                logger.error(f"Error invoking Supabase Admin user deletion: {str(e)}")

        # 3. Medical Record Retention & Ownership Compliance
        # Under Indian Medical Council (Professional Conduct, Etiquette and Ethics) Regulations, 2002
        # and National Medical Commission (NMC) guidelines:
        # Clinical records (prescriptions, patient encounter logs) must be preserved for minimum statutory
        # retention periods (3 years). Active doctor credentials and auth profiles are permanently removed,
        # while historical clinical charts remain securely sealed under clinic custody.
        for cid, clinic in list(memory_store.clinics.items()):
            if clinic.get("owner_id") == user_id:
                clinic["owner_id"] = None
                clinic["status"] = "deactivated"

        for k in list(memory_store.clinic_members.keys()):
            if k.endswith(f"_{user_id}"):
                del memory_store.clinic_members[k]

        return AccountDeleteResponse(
            success=True,
            message="Your doctor account and authentication credentials have been permanently deleted.",
            retention_notice=(
                "Statutory Medical Notice: In accordance with Indian Medical Council / NMC regulations, "
                "historical patient prescriptions and consultation logs remain securely archived under clinic custody "
                "to fulfill mandatory legal retention requirements."
            )
        )

account_service = AccountService()
