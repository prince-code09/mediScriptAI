from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.ai import (
    SpeechParseRequest,
    SpeechParseResponse,
    RefinePrescriptionRequest,
    RefinePrescriptionResponse
)
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["AI Voice & Refine"])

@router.post("/parse-speech", response_model=SpeechParseResponse)
async def parse_speech(
    request: SpeechParseRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Parse natural doctor dictation into structured prescription fields.
    Adheres strictly to healthcare safety rules:
    - Never fabricates normal vitals or unmentioned symptoms
    - Never silently infers diagnoses
    - Flags ambiguities for clinician review
    """
    return await ai_service.parse_speech(request)

@router.post("/refine", response_model=RefinePrescriptionResponse)
async def refine_prescription(
    request: RefinePrescriptionRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Refine with AI — Correction Workflow.
    Interprets natural language correction commands (e.g. 'Age 48 kar do, baaki sab same')
    and returns a proposed modification review box without auto-committing.
    """
    return await ai_service.refine_prescription(request)
