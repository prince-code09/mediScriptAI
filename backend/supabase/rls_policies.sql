-- ==============================================================================
-- MediScript Database Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor (Part 2 of 2)
-- ==============================================================================

-- 1. Helper Functions
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

-- 2. Enable Row Level Security on All Tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- 3. Clinics Policies
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

-- 4. Clinic Members Policies
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

-- 5. Patients Policies
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

-- 6. Prescriptions Policies
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

-- 7. Prescription Audit Logs Policies (Append-only & immutable)
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

-- 8. Synchronization Queue Policies
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
