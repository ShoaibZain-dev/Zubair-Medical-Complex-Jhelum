-- =====================================================================
-- ZUBAIR MEDICAL COMPLEX JHELUM
-- Migration: Doctor Management, Storage Bucket, and Multi-Tier Roles
-- =====================================================================

-- 1. Ensure UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Admin Profiles Role Check to support Super Admin, Hospital Admin, and Staff
ALTER TABLE admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_role_check;
ALTER TABLE admin_profiles ADD CONSTRAINT admin_profiles_role_check 
  CHECK (role IN ('Super Admin', 'Hospital Admin', 'Staff', 'Admin', 'Receptionist'));

-- 3. Add optional password_hash column to admin_profiles for unified credentials
ALTER TABLE admin_profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 4. Set up Storage Bucket: doctor-photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public can view doctor photos
DROP POLICY IF EXISTS "Public can view doctor photos" ON storage.objects;
CREATE POLICY "Public can view doctor photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'doctor-photos');

-- Storage RLS: Super Admin and Hospital Admin can upload doctor photos
DROP POLICY IF EXISTS "Admin can upload doctor photos" ON storage.objects;
CREATE POLICY "Admin can upload doctor photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'doctor-photos' AND 
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE admin_profiles.user_id = auth.uid() 
      AND admin_profiles.role IN ('Super Admin', 'Hospital Admin', 'Admin') 
      AND admin_profiles.active = true
    )
  );

-- Storage RLS: Super Admin and Hospital Admin can delete doctor photos
DROP POLICY IF EXISTS "Admin can delete doctor photos" ON storage.objects;
CREATE POLICY "Admin can delete doctor photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'doctor-photos' AND 
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE admin_profiles.user_id = auth.uid() 
      AND admin_profiles.role IN ('Super Admin', 'Hospital Admin', 'Admin') 
      AND admin_profiles.active = true
    )
  );

-- 5. Doctors RLS Policy: Super Admin & Hospital Admin can modify doctors
DROP POLICY IF EXISTS "Admin can modify doctors" ON doctors;
CREATE POLICY "Admin can modify doctors" ON doctors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE admin_profiles.user_id = auth.uid() 
      AND admin_profiles.role IN ('Super Admin', 'Hospital Admin', 'Admin') 
      AND admin_profiles.active = true
    )
  );

-- 6. Doctor Schedules RLS Policy: Super Admin & Hospital Admin can modify schedules
DROP POLICY IF EXISTS "Admin can modify doctor schedules" ON doctor_schedules;
CREATE POLICY "Admin can modify doctor schedules" ON doctor_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles 
      WHERE admin_profiles.user_id = auth.uid() 
      AND admin_profiles.role IN ('Super Admin', 'Hospital Admin', 'Admin') 
      AND admin_profiles.active = true
    )
  );

-- 7. Admin Profiles RLS Policies: Only Super Admin can manage user accounts
DROP POLICY IF EXISTS "Super Admin can manage admin profiles" ON admin_profiles;
CREATE POLICY "Super Admin can manage admin profiles" ON admin_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_profiles ap 
      WHERE ap.user_id = auth.uid() 
      AND ap.role IN ('Super Admin', 'Admin') 
      AND ap.active = true
    )
  );

DROP POLICY IF EXISTS "Staff can view own profile" ON admin_profiles;
CREATE POLICY "Staff can view own profile" ON admin_profiles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM admin_profiles ap 
      WHERE ap.user_id = auth.uid() 
      AND ap.role IN ('Super Admin', 'Admin') 
      AND ap.active = true
    )
  );

-- 8. Prevent Accidental Deletion of the Last Active Super Admin (Database Trigger)
CREATE OR REPLACE FUNCTION prevent_last_super_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.role IN ('Super Admin', 'Admin') AND OLD.active = true) THEN
    IF (SELECT COUNT(*) FROM admin_profiles WHERE role IN ('Super Admin', 'Admin') AND active = true AND id != OLD.id) = 0 THEN
      RAISE EXCEPTION 'Cannot delete or remove the last active Super Admin / Owner account.';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_last_super_admin ON admin_profiles;
CREATE TRIGGER trg_prevent_last_super_admin
  BEFORE DELETE ON admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_super_admin_deletion();
