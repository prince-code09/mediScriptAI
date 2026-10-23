from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, AuthenticatedUser
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Clinic Analytics"])

@router.get("/weekly-visits")
async def get_weekly_visits(
    clinic_id: str = Query(..., description="Clinic UUID"),
    user: AuthenticatedUser = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """
    Weekly OPD Patient Visits Analytics.
    Returns Monday through Sunday grouped metrics comparing Total Visits with Unique Patients
    to power the dashboard's 3D column chart.
    """
    return await analytics_service.get_weekly_visits(clinic_id, user)
