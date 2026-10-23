from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthenticatedUser
from app.schemas.sync import SyncBatchRequest, SyncBatchResponse
from app.services.sync_service import sync_service

router = APIRouter(prefix="/sync", tags=["Offline-First Sync"])

@router.post("/batch", response_model=SyncBatchResponse)
async def process_sync_batch(
    request: SyncBatchRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Idempotent Offline-First Synchronization Endpoint.
    Receives queued local operations, checks client-generated operation UUIDs,
    prevents duplicate executions, and returns cloud sync acknowledgements.
    """
    return await sync_service.process_sync_batch(request, user)
