from typing import Optional
from pydantic import BaseModel, Field

class PatientBase(BaseModel):
    clinic_id: str
    patient_identifier: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=255)
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[str] = Field(default="Other", pattern="^(Male|Female|Other)$")
    phone: Optional[str] = Field(default="")
    address: Optional[str] = ""
    allergies: Optional[str] = ""
    clinical_notes: Optional[str] = ""

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=0, le=150)
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    allergies: Optional[str] = None
    clinical_notes: Optional[str] = None
    patient_identifier: Optional[str] = None

class PatientResponse(PatientBase):
    id: str
    total_visits: int = 0
    last_visit_date: Optional[str] = None
    created_at: str
    updated_at: str
