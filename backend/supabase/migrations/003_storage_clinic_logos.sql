-- ==============================================================================
-- MediScript Database Migration: 003_storage_clinic_logos.sql
-- Description: Sets up optional Supabase Storage bucket and access policies
--              for clinic logos. Fully backward-compatible and non-destructive.
-- ==============================================================================

-- 1. Create storage bucket for clinic logos if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'clinic-logos',
    'clinic-logos',
    true,
    2097152, -- 2 MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Public read access for prescription printing and pharmacy verification
DROP POLICY IF EXISTS "Clinic logos are publicly readable" ON storage.objects;
CREATE POLICY "Clinic logos are publicly readable"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'clinic-logos');

-- 4. Policy: Authenticated clinic owners can upload and update their clinic logo
DROP POLICY IF EXISTS "Clinic owners can upload clinic logo" ON storage.objects;
CREATE POLICY "Clinic owners can upload clinic logo"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'clinic-logos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Clinic owners can update their clinic logo" ON storage.objects;
CREATE POLICY "Clinic owners can update their clinic logo"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'clinic-logos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Clinic owners can delete their clinic logo" ON storage.objects;
CREATE POLICY "Clinic owners can delete their clinic logo"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'clinic-logos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
