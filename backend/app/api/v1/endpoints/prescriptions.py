from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path, Body
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionUpdate,
    PrescriptionResponse,
    PrescriptionConfirmRequest,
    PrescriptionReviseRequest,
    PrescriptionAuditLogResponse
)
from app.schemas.common import PaginatedResponse
from app.services.prescription_service import prescription_service

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.get("", response_model=PaginatedResponse[PrescriptionResponse])
async def list_prescriptions(
    clinic_id: str = Query(..., description="Clinic UUID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status (draft, confirmed)"),
    patient_id: Optional[str] = Query(None, description="Filter by patient UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """List prescriptions for the clinic with pagination and optional status filter."""
    return await prescription_service.list_prescriptions(
        clinic_id=clinic_id,
        user=user,
        page=page,
        page_size=page_size,
        status=status,
        patient_id=patient_id
    )

@router.post("", response_model=PrescriptionResponse)
async def create_draft(
    data: PrescriptionCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Create a new prescription draft.
    Begins in 'draft' status awaiting explicit doctor review and confirmation.
    """
    return await prescription_service.create_draft(data, user)

@router.get("/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(
    prescription_id: str = Path(..., description="Prescription UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve full prescription record."""
    return await prescription_service.get_prescription(prescription_id, user)

@router.put("/{prescription_id}", response_model=PrescriptionResponse)
async def update_draft(
    data: PrescriptionUpdate,
    prescription_id: str = Path(..., description="Prescription UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Update an existing prescription draft.
    Cannot be used on already confirmed prescriptions (use /revise instead).
    """
    return await prescription_service.update_draft(prescription_id, data, user)

@router.post("/{prescription_id}/confirm", response_model=PrescriptionResponse)
async def confirm_prescription(
    prescription_id: str = Path(..., description="Prescription UUID"),
    request: Optional[PrescriptionConfirmRequest] = Body(None),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Explicit Clinical Confirmation Endpoint.
    Revalidates the prescription, locks it against silent edits, sets confirmation timestamp,
    and appends an immutable audit event.
    """
    notes = request.confirmation_notes if request else None
    return await prescription_service.confirm_prescription(prescription_id, user, notes)

@router.post("/{prescription_id}/revise", response_model=PrescriptionResponse)
async def revise_prescription(
    request: PrescriptionReviseRequest,
    prescription_id: str = Path(..., description="Prescription UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Create an authorized revision for a confirmed prescription.
    Increments the version counter and records the clinical reason in the audit log.
    """
    return await prescription_service.revise_prescription(
        prescription_id=prescription_id,
        reason=request.reason,
        updates=request.updates,
        user=user
    )

@router.get("/{prescription_id}/audit", response_model=List[PrescriptionAuditLogResponse])
async def get_audit_history(
    prescription_id: str = Path(..., description="Prescription UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve immutable audit trail of actions taken on this prescription."""
    return await prescription_service.get_audit_history(prescription_id, user)
