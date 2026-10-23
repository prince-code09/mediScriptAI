from fastapi import APIRouter
from app.api.v1.endpoints.clinics import router as clinics_router
from app.api.v1.endpoints.patients import router as patients_router
from app.api.v1.endpoints.prescriptions import router as prescriptions_router
from app.api.v1.endpoints.ai import router as ai_router
from app.api.v1.endpoints.sync import router as sync_router
from app.api.v1.endpoints.analytics import router as analytics_router
from app.api.v1.endpoints.auth import router as auth_router

api_router = APIRouter()

api_router.include_router(clinics_router)
api_router.include_router(patients_router)
api_router.include_router(prescriptions_router)
api_router.include_router(ai_router)
api_router.include_router(sync_router)
api_router.include_router(analytics_router)
api_router.include_router(auth_router)
