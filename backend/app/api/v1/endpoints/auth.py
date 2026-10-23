from fastapi import APIRouter, Depends, status
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.auth import AccountDeleteRequest, AccountDeleteResponse
from app.services.account_service import account_service

router = APIRouter(prefix="/auth", tags=["Authentication & Account"])

@router.post(
    "/delete-account",
    response_model=AccountDeleteResponse,
    status_code=status.HTTP_200_OK,
    summary="Permanently delete doctor account with medical record retention compliance"
)
async def delete_doctor_account(
    data: AccountDeleteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Securely deletes the authenticated practitioner's account.
    - Requires explicit confirmation 'DELETE'
    - Revokes clinical credentials and removes active login identities
    - Archives historical prescriptions and patient encounter logs in compliance with medical retention guidelines
    """
    return await account_service.delete_account(data, current_user)
