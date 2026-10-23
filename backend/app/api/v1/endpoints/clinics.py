from typing import List
from fastapi import APIRouter, Depends, Path
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.clinic import (
    ClinicCreate,
    ClinicUpdate,
    ClinicLogoUpload,
    ClinicResponse,
    FormatSettingsSchema
)
from app.services.clinic_service import clinic_service

router = APIRouter(prefix="/clinics", tags=["Clinics & Settings"])

@router.get("", response_model=List[ClinicResponse])
async def list_clinics(user: AuthenticatedUser = Depends(get_current_user)):
    """List clinics owned by or accessible to the authenticated doctor."""
    return await clinic_service.list_clinics(user)

@router.post("", response_model=ClinicResponse)
async def create_clinic(
    data: ClinicCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Create a new clinic OPD facility."""
    return await clinic_service.create_clinic(data, user)

@router.get("/{clinic_id}", response_model=ClinicResponse)
async def get_clinic(
    clinic_id: str = Path(..., description="Clinic UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve details for a specific clinic."""
    return await clinic_service.get_clinic(clinic_id, user)

@router.put("/{clinic_id}", response_model=ClinicResponse)
async def update_clinic(
    data: ClinicUpdate,
    clinic_id: str = Path(..., description="Clinic UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Update clinic information and doctor credentials (owner only)."""
    return await clinic_service.update_clinic(clinic_id, data, user)

@router.post("/{clinic_id}/logo", response_model=ClinicResponse)
async def upload_clinic_logo(
    data: ClinicLogoUpload,
    clinic_id: str = Path(..., description="Clinic UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Upload or update clinic branding logo (owner only, max 2MB)."""
    return await clinic_service.upload_logo(clinic_id, data.logo_data, user)

@router.delete("/{clinic_id}/logo", response_model=ClinicResponse)
async def remove_clinic_logo(
    clinic_id: str = Path(..., description="Clinic UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Remove custom clinic logo and revert to default medical icon (owner only)."""
    return await clinic_service.remove_logo(clinic_id, user)

@router.get("/{clinic_id}/format-settings", response_model=FormatSettingsSchema)
async def get_format_settings(
    clinic_id: str = Path(..., description="Clinic UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Get prescription print & layout format preferences for this clinic."""
    return await clinic_service.get_format_settings(clinic_id, user)

@router.put("/{clinic_id}/format-settings", response_model=FormatSettingsSchema)
async def update_format_settings(
    settings_data: FormatSettingsSchema,
    clinic_id: str = Path(..., description="Clinic UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Update prescription print & layout preferences."""
    return await clinic_service.update_format_settings(clinic_id, settings_data, user)
