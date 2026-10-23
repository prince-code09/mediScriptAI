from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class MedicineItemSchema(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=1)
    strength: Optional[str] = ""
    dosage_form: str = Field(default="Tablet")
    dose: Optional[str] = ""
    frequency: Optional[str] = ""
    duration: Optional[str] = ""
    instructions: Optional[str] = ""
    route: Optional[str] = None

class VitalsSchema(BaseModel):
    bp: Optional[str] = None
    pulse: Optional[str] = None
    temp: Optional[str] = None
    spo2: Optional[str] = None
    weight: Optional[str] = None

class PrescriptionBase(BaseModel):
    clinic_id: str
    patient_id: Optional[str] = None
    prescription_number: str
    date: str
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = "Other"
    patient_phone: Optional[str] = ""
    symptoms: Optional[str] = ""
    duration_of_symptoms: Optional[str] = ""
    clinical_findings: Optional[str] = ""
    diagnosis: Optional[str] = None
    is_diagnosis_confirmed: Optional[bool] = False
    consultation_report: Optional[str] = ""
    raw_transcript: Optional[str] = ""
    vitals: Optional[VitalsSchema] = None
    medicines: List[MedicineItemSchema] = []
    advice: Optional[str] = ""
    follow_up: Optional[str] = ""
    tests: Optional[str] = ""
    source: str = Field(default="manual", pattern="^(manual|voice|ai)$")
    status: str = Field(default="draft", pattern="^(draft|confirmed|deleted)$")
    sync_status: str = Field(default="synced", pattern="^(saved_on_device|sync_pending|synced|sync_failed)$")
    print_language: str = Field(default="en", pattern="^(en|hi|hinglish)$")
    is_deleted: Optional[bool] = False
    deleted_at: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    patient_phone: Optional[str] = None
    symptoms: Optional[str] = None
    duration_of_symptoms: Optional[str] = None
    clinical_findings: Optional[str] = None
    diagnosis: Optional[str] = None
    is_diagnosis_confirmed: Optional[bool] = False
    consultation_report: Optional[str] = ""
    raw_transcript: Optional[str] = ""
    vitals: Optional[VitalsSchema] = None
    medicines: Optional[List[MedicineItemSchema]] = None
    advice: Optional[str] = None
    follow_up: Optional[str] = None
    tests: Optional[str] = None
    print_language: Optional[str] = None
    status: Optional[str] = None

class PrescriptionResponse(PrescriptionBase):
    id: str
    doctor_id: str
    version: int = 1
    confirmed_at: Optional[str] = None
    created_at: str
    updated_at: str

class PrescriptionConfirmRequest(BaseModel):
    confirmation_notes: Optional[str] = None

class PrescriptionReviseRequest(BaseModel):
    reason: str = Field(..., min_length=3)
    updates: PrescriptionUpdate

class PrescriptionAuditLogResponse(BaseModel):
    id: str
    prescription_id: str
    user_id: str
    action: str
    client_operation_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    created_at: str
