from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SyncOperationItem(BaseModel):
    client_operation_id: str = Field(..., min_length=1, description="Client-generated unique UUID for idempotency")
    entity_type: str = Field(..., pattern="^(patient|prescription)$")
    entity_id: str = Field(..., min_length=1)
    operation: str = Field(..., pattern="^(create|update|confirm)$")
    payload: Dict[str, Any]

class SyncBatchRequest(BaseModel):
    clinic_id: str
    operations: List[SyncOperationItem]

class SyncOperationResult(BaseModel):
    client_operation_id: str
    entity_type: str
    entity_id: str
    status: str = Field(..., pattern="^(synced|duplicate_ignored|failed|conflict)$")
    server_timestamp: str
    message: Optional[str] = None

class SyncBatchResponse(BaseModel):
    results: List[SyncOperationResult]
    total_processed: int
    synced_count: int
    ignored_count: int
    failed_count: int
