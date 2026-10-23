from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class FormatSettingsSchema(BaseModel):
    template: str = Field(default="general", pattern="^(general|custom)$")
    paperSize: str = Field(default="A4", pattern="^(A4|A5)$")
    showClinicLogo: bool = True
    showVitals: bool = True
    showRxHeader: bool = True
    clinicHeaderColor: str = "#243B64"
    printNotes: str = "Valid for dispensing at any licensed pharmacy in India."
    fontFamily: Optional[str] = "sans"
    showPatientPhone: Optional[bool] = True
    showDoctorRegNo: Optional[bool] = True
    showAdvice: Optional[bool] = True
    showFollowUp: Optional[bool] = True
    showDosageInstructions: Optional[bool] = True
    showSignatureLine: Optional[bool] = True

class ClinicBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    doctor_name: str = Field(..., min_length=1, max_length=255)
    qualification: Optional[str] = ""
    reg_no: Optional[str] = ""
    address: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    logo_url: Optional[str] = None
    format_settings: Optional[FormatSettingsSchema] = None

class ClinicCreate(ClinicBase):
    pass

class ClinicUpdate(BaseModel):
    name: Optional[str] = None
    doctor_name: Optional[str] = None
    qualification: Optional[str] = None
    reg_no: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    format_settings: Optional[FormatSettingsSchema] = None

class ClinicLogoUpload(BaseModel):
    logo_data: str = Field(..., description="Base64 data URI or image URL of clinic logo (PNG, JPG, WEBP, max 2MB)")

class ClinicResponse(ClinicBase):
    id: str
    owner_id: str
    created_at: str
    updated_at: str
