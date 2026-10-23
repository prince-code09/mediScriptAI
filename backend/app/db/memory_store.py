"""
MediScript In-Memory Data Store
Provides safe local repository operations during development and unit testing,
mirroring PostgreSQL constraints and relations before Supabase credentials are configured.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import uuid

class MemoryStore:
    def __init__(self):
        self.reset()

    def reset(self):
        now = datetime.now(timezone.utc).isoformat()
        
        # Default Clinic matching frontend mock
        default_clinic_id = "c1111111-1111-1111-1111-111111111111"
        default_doctor_id = "00000000-0000-0000-0000-000000000001"
        
        self.clinics: Dict[str, Dict[str, Any]] = {
            default_clinic_id: {
                "id": default_clinic_id,
                "owner_id": default_doctor_id,
                "name": "Aarogya Seva Polyclinic",
                "doctor_name": "Dr. Rajesh Sharma",
                "qualification": "MBBS, MD (General Medicine)",
                "reg_no": "MCI-48291",
                "address": "Opposite Bus Stand, Main Market Road, Bilaspur, HP - 174001",
                "phone": "+91 98160 12345",
                "email": "dr.sharma@mediscript.in",
                "logo_url": None,
                "format_settings": {
                    "template": "general",
                    "paperSize": "A4",
                    "showClinicLogo": True,
                    "showVitals": True,
                    "showRxHeader": True,
                    "clinicHeaderColor": "#243B64",
                    "printNotes": "Valid for dispensing at any licensed pharmacy in India.",
                    "fontFamily": "sans",
                    "showPatientPhone": True,
                    "showDoctorRegNo": True,
                    "showAdvice": True,
                    "showFollowUp": True,
                    "showDosageInstructions": True,
                    "showSignatureLine": True
                },
                "created_at": now,
                "updated_at": now
            }
        }

        self.clinic_members: Dict[str, Dict[str, Any]] = {
            f"{default_clinic_id}_{default_doctor_id}": {
                "id": str(uuid.uuid4()),
                "clinic_id": default_clinic_id,
                "user_id": default_doctor_id,
                "role": "owner",
                "created_at": now
            }
        }

        # Initial Patients
        self.patients: Dict[str, Dict[str, Any]] = {
            "p1111111-1111-1111-1111-111111111111": {
                "id": "p1111111-1111-1111-1111-111111111111",
                "clinic_id": default_clinic_id,
                "patient_identifier": "MED-001",
                "name": "Ramesh Kumar Verma",
                "age": 45,
                "gender": "Male",
                "phone": "+91 98765 43210",
                "address": "Village Kothipura, Bilaspur",
                "allergies": "Penicillin (rash)",
                "clinical_notes": "Known hypertensive for 3 years, irregular on medications.",
                "total_visits": 3,
                "last_visit_date": "2026-10-20",
                "created_at": now,
                "updated_at": now
            },
            "p2222222-2222-2222-2222-222222222222": {
                "id": "p2222222-2222-2222-2222-222222222222",
                "clinic_id": default_clinic_id,
                "patient_identifier": "MED-002",
                "name": "Sunita Devi",
                "age": 38,
                "gender": "Female",
                "phone": "+91 94180 87654",
                "address": "Ward 4, Ghumarwin",
                "allergies": "None known",
                "clinical_notes": "Mild osteoarthritis bilateral knees.",
                "total_visits": 1,
                "last_visit_date": "2026-10-18",
                "created_at": now,
                "updated_at": now
            }
        }

        # Initial Prescriptions
        self.prescriptions: Dict[str, Dict[str, Any]] = {
            "rx111111-1111-1111-1111-111111111111": {
                "id": "rx111111-1111-1111-1111-111111111111",
                "prescription_number": "MED-2026-0042",
                "clinic_id": default_clinic_id,
                "patient_id": "p1111111-1111-1111-1111-111111111111",
                "doctor_id": default_doctor_id,
                "date": "2026-10-20",
                "patient_name": "Ramesh Kumar Verma",
                "patient_age": 45,
                "patient_gender": "Male",
                "patient_phone": "+91 98765 43210",
                "symptoms": "High grade fever with chills and severe body ache",
                "duration_of_symptoms": "3 days",
                "clinical_findings": "Throat congested, chest clear, soft abdomen",
                "diagnosis": "Acute Upper Respiratory Tract Infection (URTI)",
                "vitals": {
                    "bp": "128/82 mmHg",
                    "pulse": "84 bpm",
                    "temp": "101.4 °F",
                    "spo2": "98%",
                    "weight": "68 kg"
                },
                "medicines": [
                    {
                        "id": "med-1",
                        "name": "Paracetamol",
                        "strength": "650 mg",
                        "dosage_form": "Tablet",
                        "dose": "1 tablet",
                        "frequency": "1-0-1",
                        "duration": "3 days",
                        "instructions": "After meals with warm water",
                        "route": "Oral"
                    },
                    {
                        "id": "med-2",
                        "name": "Azithromycin",
                        "strength": "500 mg",
                        "dosage_form": "Tablet",
                        "dose": "1 tablet",
                        "frequency": "1-0-0",
                        "duration": "3 days",
                        "instructions": "1 hour before breakfast on empty stomach",
                        "route": "Oral"
                    }
                ],
                "advice": "Drink plenty of warm water. Rest well. Gargle with warm salt water thrice daily.",
                "follow_up": "Follow-up in 3 days if fever persists",
                "tests": "CBC with ESR if fever does not subside",
                "source": "voice",
                "status": "confirmed",
                "confirmed_at": now,
                "sync_status": "synced",
                "version": 1,
                "print_language": "en",
                "created_at": now,
                "updated_at": now
            }
        }

        self.audit_logs: List[Dict[str, Any]] = []
        self.sync_queue: Dict[str, Dict[str, Any]] = {}

memory_store = MemoryStore()
