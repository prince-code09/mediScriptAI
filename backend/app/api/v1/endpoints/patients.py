from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.schemas.prescription import PrescriptionResponse
from app.schemas.common import PaginatedResponse
from app.services.patient_service import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=PaginatedResponse[PatientResponse])
async def list_patients(
    clinic_id: str = Query(..., description="Clinic ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None, description="Search by name, phone, or patient ID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """List and search patients registered in the clinic."""
    return await patient_service.list_patients(
        clinic_id=clinic_id,
        user=user,
        page=page,
        page_size=page_size,
        query=q
    )

@router.post("", response_model=PatientResponse)
async def create_patient(
    data: PatientCreate,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Register a new patient with optional demographics and clinical history."""
    return await patient_service.create_patient(data, user)

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str = Path(..., description="Patient UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve detailed clinical profile of a patient."""
    return await patient_service.get_patient(patient_id, user)

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    data: PatientUpdate,
    patient_id: str = Path(..., description="Patient UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Update patient demographic and clinical details."""
    return await patient_service.update_patient(patient_id, data, user)

@router.get("/{patient_id}/prescriptions", response_model=List[PrescriptionResponse])
async def get_patient_prescriptions(
    patient_id: str = Path(..., description="Patient UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
):
    """Retrieve all historical prescriptions for this patient."""
    return await patient_service.get_patient_prescriptions(patient_id, user)
