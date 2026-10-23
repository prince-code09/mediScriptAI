-- ==============================================================================
-- MediScript Database Row Level Security (RLS) Policies
-- Migration: 002_rls_policies.sql
-- Description: Strict clinic-isolated authorization rules for healthcare data.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Helper Function: Check Clinic Membership
-- Verifies whether the authenticated user owns or is a member of the clinic.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_clinic_member(check_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.clinics WHERE id = check_clinic_id AND owner_id = auth.uid()
        UNION ALL
        SELECT 1 FROM public.clinic_members WHERE clinic_id = check_clinic_id AND user_id = auth.uid()
    );
$$;

-- Helper Function: Check Clinic Owner
CREATE OR REPLACE FUNCTION public.is_clinic_owner(check_clinic_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.clinics WHERE id = check_clinic_id AND owner_id = auth.uid()
    );
$$;

-- ------------------------------------------------------------------------------
-- Enable Row Level Security on All Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Clinics Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Clinics viewable by owner and members" ON public.clinics;
CREATE POLICY "Clinics viewable by owner and members"
    ON public.clinics
    FOR SELECT
    TO authenticated
    USING (public.is_clinic_member(id));

DROP POLICY IF EXISTS "Clinics creatable by authenticated doctors" ON public.clinics;
CREATE POLICY "Clinics creatable by authenticated doctors"
    ON public.clinics
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Clinics updatable by owner only" ON public.clinics;
CREATE POLICY "Clinics updatable by owner only"
    ON public.clinics
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Clinics deletable by owner only" ON public.clinics;
CREATE POLICY "Clinics deletable by owner only"
    ON public.clinics
    FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 2. Clinic Members Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members viewable by clinic members" ON public.clinic_members;
CREATE POLICY "Members viewable by clinic members"
    ON public.clinic_members
    FOR SELECT
    TO authenticated
    USING (public.is_clinic_member(clinic_id));

DROP POLICY IF EXISTS "Members manageable by clinic owner" ON public.clinic_members;
CREATE POLICY "Members manageable by clinic owner"
    ON public.clinic_members
    FOR ALL
    TO authenticated
    USING (public.is_clinic_owner(clinic_id))
    WITH CHECK (public.is_clinic_owner(clinic_id));

-- ------------------------------------------------------------------------------
-- 3. Patients Policies
-- Protected health information: only accessible within authorized clinic
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Patients viewable by clinic members" ON public.patients;
CREATE POLICY "Patients viewable by clinic members"
    ON public.patients
    FOR SELECT
    TO authenticated
    USING (public.is_clinic_member(clinic_id));

DROP POLICY IF EXISTS "Patients insertable by clinic members" ON public.patients;
CREATE POLICY "Patients insertable by clinic members"
    ON public.patients
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_clinic_member(clinic_id));

DROP POLICY IF EXISTS "Patients updatable by clinic members" ON public.patients;
CREATE POLICY "Patients updatable by clinic members"
    ON public.patients
    FOR UPDATE
    TO authenticated
    USING (public.is_clinic_member(clinic_id))
    WITH CHECK (public.is_clinic_member(clinic_id));

-- ------------------------------------------------------------------------------
-- 4. Prescriptions Policies
-- Clinical drafts and confirmed prescriptions
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Prescriptions viewable by clinic members" ON public.prescriptions;
CREATE POLICY "Prescriptions viewable by clinic members"
    ON public.prescriptions
    FOR SELECT
    TO authenticated
    USING (public.is_clinic_member(clinic_id));

DROP POLICY IF EXISTS "Prescriptions insertable by clinic doctors" ON public.prescriptions;
CREATE POLICY "Prescriptions insertable by clinic doctors"
    ON public.prescriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_clinic_member(clinic_id) AND doctor_id = auth.uid());

DROP POLICY IF EXISTS "Prescriptions updatable by clinic members" ON public.prescriptions;
CREATE POLICY "Prescriptions updatable by clinic members"
    ON public.prescriptions
    FOR UPDATE
    TO authenticated
    USING (public.is_clinic_member(clinic_id))
    WITH CHECK (public.is_clinic_member(clinic_id));

-- ------------------------------------------------------------------------------
-- 5. Prescription Audit Logs Policies
-- Append-only audit trail: strictly immutable
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Audit logs viewable by clinic members" ON public.prescription_audit_logs;
CREATE POLICY "Audit logs viewable by clinic members"
    ON public.prescription_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.prescriptions p
            WHERE p.id = prescription_id AND public.is_clinic_member(p.clinic_id)
        )
    );

DROP POLICY IF EXISTS "Audit logs insertable by creator" ON public.prescription_audit_logs;
CREATE POLICY "Audit logs insertable by creator"
    ON public.prescription_audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.prescriptions p
            WHERE p.id = prescription_id AND public.is_clinic_member(p.clinic_id)
        )
    );

-- Note: No UPDATE or DELETE policies are created on public.prescription_audit_logs,
-- ensuring the audit history remains strictly immutable.

-- ------------------------------------------------------------------------------
-- 6. Synchronization Queue Policies
-- Idempotent queue for offline-first sync operations
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Sync items viewable by owner" ON public.sync_queue;
CREATE POLICY "Sync items viewable by owner"
    ON public.sync_queue
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Sync items insertable by owner" ON public.sync_queue;
CREATE POLICY "Sync items insertable by owner"
    ON public.sync_queue
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() AND public.is_clinic_member(clinic_id));

DROP POLICY IF EXISTS "Sync items updatable by owner" ON public.sync_queue;
CREATE POLICY "Sync items updatable by owner"
    ON public.sync_queue
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
