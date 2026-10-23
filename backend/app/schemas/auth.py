from typing import Optional
from pydantic import BaseModel, Field

class AccountDeleteRequest(BaseModel):
    confirmation: str = Field(..., description="Must be exactly 'DELETE' to confirm irreversible account deletion")
    password: Optional[str] = Field(None, description="Optional current password for credential verification")

class AccountDeleteResponse(BaseModel):
    success: bool
    message: str
    retention_notice: str
