from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.prescription import MedicineItemSchema, VitalsSchema

class SpeechParseRequest(BaseModel):
    transcript: str = Field(..., min_length=1)
    language: Optional[str] = Field(default="en", pattern="^(en|hi)$")

class ExtractedPrescriptionData(BaseModel):
    patient_name: Optional[str] = None
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    patient_phone: Optional[str] = None
    symptoms: Optional[str] = None
    duration_of_symptoms: Optional[str] = None
    clinical_findings: Optional[str] = None
    diagnosis: Optional[str] = None
    is_diagnosis_confirmed: Optional[bool] = False
    consultation_report: Optional[str] = None
    vitals: Optional[VitalsSchema] = None
    medicines: List[MedicineItemSchema] = []
    advice: Optional[str] = None
    follow_up: Optional[str] = None
    tests: Optional[str] = None

class SpeechParseResponse(BaseModel):
    extracted_data: ExtractedPrescriptionData
    confidence_flags: List[str] = []
    ambiguities: List[str] = []
    provider_used: str = "deterministic_parser"

class ProposedChangeItem(BaseModel):
    field: str
    original_value: Any = None
    proposed_value: Any = None
    explanation: str

class RefinePrescriptionRequest(BaseModel):
    current_prescription: Dict[str, Any]
    doctor_instruction: str = Field(..., min_length=1)
    language: Optional[str] = "en"

class RefinePrescriptionResponse(BaseModel):
    proposed_prescription: Dict[str, Any]
    changes: List[ProposedChangeItem]
    clarification_needed: Optional[str] = None
    provider_used: str = "deterministic_rules"
