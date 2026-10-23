-- ==============================================================================
-- MediScript Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Core tables, constraints, indexes, and triggers for clinics, 
--              patients, prescriptions, audit logs, and synchronization.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Clinics
-- Represents medical clinics / OPD facilities
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) DEFAULT '',
    reg_no VARCHAR(100) DEFAULT '',
    address TEXT DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    logo_url TEXT,
    format_settings JSONB DEFAULT '{
        "template": "general",
        "paperSize": "A4",
        "showClinicLogo": true,
        "showVitals": true,
        "showRxHeader": true,
        "clinicHeaderColor": "#243B64",
        "printNotes": "Valid for dispensing at any licensed pharmacy in India.",
        "fontFamily": "sans"
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for clinic ownership lookups
CREATE INDEX IF NOT EXISTS idx_clinics_owner ON public.clinics(owner_id);

-- ------------------------------------------------------------------------------
-- 2. Clinic Members
-- Supports clinic membership, multi-doctor OPD, or assistant access
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clinic_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'doctor' CHECK (role IN ('owner', 'doctor', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (clinic_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clinic_members_user ON public.clinic_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_members_clinic ON public.clinic_members(clinic_id);

-- ------------------------------------------------------------------------------
-- 3. Patients
-- Patient demographic and clinical history
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_identifier VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    age INT CHECK (age >= 0 AND age <= 150),
    gender VARCHAR(20) DEFAULT 'Other' CHECK (gender IN ('Male', 'Female', 'Other')),
    phone VARCHAR(50) DEFAULT '',
    address TEXT DEFAULT '',
    allergies TEXT DEFAULT '',
    clinical_notes TEXT DEFAULT '',
    total_visits INT DEFAULT 0,
    last_visit_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name_trgm ON public.patients(clinic_id, name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(clinic_id, phone);

-- ------------------------------------------------------------------------------
-- 4. Prescriptions
-- Clinical prescription records (drafts & confirmed)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_number VARCHAR(100) NOT NULL,
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    doctor_id UUID NOT NULL REFERENCES auth.users(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    patient_name VARCHAR(255) NOT NULL,
    patient_age INT,
    patient_gender VARCHAR(20) CHECK (patient_gender IN ('Male', 'Female', 'Other')),
    patient_phone VARCHAR(50) DEFAULT '',
    symptoms TEXT DEFAULT '',
    duration_of_symptoms VARCHAR(100) DEFAULT '',
    clinical_findings TEXT DEFAULT '',
    diagnosis TEXT DEFAULT '',
    vitals JSONB DEFAULT '{}'::jsonb,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    advice TEXT DEFAULT '',
    follow_up VARCHAR(255) DEFAULT '',
    tests TEXT DEFAULT '',
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'voice', 'ai')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed')),
    confirmed_at TIMESTAMPTZ,
    sync_status VARCHAR(50) NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('saved_on_device', 'sync_pending', 'synced', 'sync_failed')),
    version INT NOT NULL DEFAULT 1,
    print_language VARCHAR(20) NOT NULL DEFAULT 'en' CHECK (print_language IN ('en', 'hi', 'hinglish')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic ON public.prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON public.prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON public.prescriptions(date DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(clinic_id, status);

-- ------------------------------------------------------------------------------
-- 5. Prescription Audit Logs
-- Immutable audit log for prescription creation, confirmation, edits, and revisions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prescription_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('create_draft', 'update_draft', 'confirm', 'revise', 'sync')),
    client_operation_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_prescription ON public.prescription_audit_logs(prescription_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.prescription_audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. Synchronization Queue & Idempotency Store
-- Prevents duplicate client operations and ensures idempotent sync
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_operation_id UUID UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('patient', 'prescription')),
    entity_id UUID NOT NULL,
    operation VARCHAR(50) NOT NULL CHECK (operation IN ('create', 'update', 'confirm')),
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'conflict')),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_op_id ON public.sync_queue(client_operation_id);
CREATE INDEX IF NOT EXISTS idx_sync_clinic ON public.sync_queue(clinic_id);

-- ------------------------------------------------------------------------------
-- Triggers for automatic `updated_at` timestamps
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clinics_updated_at ON public.clinics;
CREATE TRIGGER trigger_clinics_updated_at
    BEFORE UPDATE ON public.clinics
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_patients_updated_at ON public.patients;
CREATE TRIGGER trigger_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_prescriptions_updated_at ON public.prescriptions;
CREATE TRIGGER trigger_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
