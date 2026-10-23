from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "MediScript Clinical API"
    version: str = "1.0.0"
    supabase_configured: bool = False
    ai_provider: str = "none"

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
