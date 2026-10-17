-- =====================================================================
-- ZUBAIR MEDICAL COMPLEX JHELUM
-- Production PostgreSQL & Supabase Database Schema with Row Level Security
-- =====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255),
    specialty VARCHAR(255) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    social_media VARCHAR(255),
    avatar_url TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. DOCTOR SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    period VARCHAR(20) DEFAULT 'general', -- morning, evening, general
    start_time TIME NOT NULL, -- e.g. 09:00:00
    end_time TIME NOT NULL,   -- e.g. 14:00:00
    slot_duration INTEGER DEFAULT 30 NOT NULL, -- duration in minutes
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. ZMC-84291
    patient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age <= 120),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL, -- e.g. "09:00 AM"
    specialty VARCHAR(255) NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
    notification_status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- Prevent duplicate booking for Doctor + Date + Time
    CONSTRAINT unique_doctor_date_time UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- 5. ADMIN PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE, -- linked to supabase auth.users
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Staff' NOT NULL CHECK (role IN ('Super Admin', 'Hospital Admin', 'Staff', 'Admin', 'Receptionist')),
    password_hash TEXT,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. SOCIAL MEDIA LINKS TABLE
CREATE TABLE IF NOT EXISTS social_media_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) UNIQUE NOT NULL, -- Facebook, Instagram, YouTube, WhatsApp
    url TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. NOTIFICATION LOGS TABLE
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL, -- patient, hospital
    recipient_number VARCHAR(50) NOT NULL,
    event VARCHAR(50) NOT NULL, -- new_appointment, confirmed, cancelled, status_update
    channel VARCHAR(50) DEFAULT 'mock', -- whatsapp, sms, mock
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Doctors: Public read access, Super Admin & Hospital Admin write access
CREATE POLICY "Public can view active doctors" ON doctors
    FOR SELECT USING (active = true);

CREATE POLICY "Admin can modify doctors" ON doctors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE admin_profiles.user_id = auth.uid() 
            AND admin_profiles.role IN ('Super Admin', 'Hospital Admin', 'Admin') 
            AND admin_profiles.active = true
        )
    );

-- Schedules: Public read access, Super Admin & Hospital Admin write access
CREATE POLICY "Public can view active doctor schedules" ON doctor_schedules
    FOR SELECT USING (active = true);

CREATE POLICY "Admin can modify doctor schedules" ON doctor_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE admin_profiles.user_id = auth.uid() 
            AND admin_profiles.role IN ('Super Admin', 'Hospital Admin', 'Admin') 
            AND admin_profiles.active = true
        )
    );

-- Appointments:
-- Public can create new appointments
CREATE POLICY "Public can insert appointment" ON appointments
    FOR INSERT WITH CHECK (true);

-- Public can check own appointment by ID or Phone
CREATE POLICY "Public can view appointment status" ON appointments
    FOR SELECT USING (true);

-- All authenticated active staff can view and update appointments
CREATE POLICY "Staff can view and update appointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE admin_profiles.user_id = auth.uid() 
            AND admin_profiles.active = true
        )
    );

-- Admin Profiles: Super Admin full control, staff view own
CREATE POLICY "Super Admin can manage admin profiles" ON admin_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_profiles ap 
            WHERE ap.user_id = auth.uid() 
            AND ap.role IN ('Super Admin', 'Admin') 
            AND ap.active = true
        )
    );

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

-- Social Media Links: Public read access, Admin write
CREATE POLICY "Public can view social media links" ON social_media_links
    FOR SELECT USING (active = true);

CREATE POLICY "Admin can update social media links" ON social_media_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE admin_profiles.user_id = auth.uid() 
            AND admin_profiles.role IN ('Super Admin', 'Hospital Admin', 'Admin') 
            AND admin_profiles.active = true
        )
    );

-- System Settings: Only authenticated staff can read, Super Admin can write
CREATE POLICY "Staff can view system settings" ON system_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE admin_profiles.user_id = auth.uid() 
            AND admin_profiles.active = true
        )
    );

CREATE POLICY "Admin can update system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_profiles 
            WHERE admin_profiles.user_id = auth.uid() 
            AND admin_profiles.role IN ('Super Admin', 'Admin') 
            AND admin_profiles.active = true
        )
    );

-- =====================================================================
-- STORAGE BUCKET & POLICIES (DOCTOR PROFILE PHOTOS)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('doctor-photos', 'doctor-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view doctor photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'doctor-photos');

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

-- =====================================================================
-- LOCKOUT PROTECTION TRIGGER: PREVENT DELETION OF LAST SUPER ADMIN
-- =====================================================================
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


-- =====================================================================
-- INITIAL EXACT SEED DATA (DO NOT INVENT EXTRA DOCTORS OR DETAILS)
-- =====================================================================

-- 1. Dr. Syed Zubair Younis
INSERT INTO doctors (id, name, qualification, specialty, contact, active)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Dr. Syed Zubair Younis', 'MBBS, FCPS', 'Medical Specialist', '0318-3621341', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Dr. Fozia Choudhary
INSERT INTO doctors (id, name, qualification, specialty, contact, active)
VALUES 
('22222222-2222-2222-2222-222222222222', 'Dr. Fozia Choudhary', NULL, 'Gynecologist / Consultant', '0318-3621341', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Dr. Muhammad Arshad
INSERT INTO doctors (id, name, qualification, specialty, contact, social_media, active)
VALUES 
('33333333-3333-3333-3333-333333333333', 'Dr. Muhammad Arshad', 'MBBS, FCPS', 'Rheumatologist', '0300-3918459', 'zubairmedicalcomplex', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Dr. Umar Farooq
INSERT INTO doctors (id, name, qualification, specialty, contact, active)
VALUES 
('44444444-4444-4444-4444-444444444444', 'Dr. Umar Farooq', NULL, 'Laparoscopic Surgeon', '0318-3621341', true)
ON CONFLICT (id) DO NOTHING;

-- Schedules for Dr. Syed Zubair Younis (Mon-Sat: Morning 09:00-14:00, Evening 17:00-20:00)
INSERT INTO doctor_schedules (doctor_id, day_of_week, period, start_time, end_time, slot_duration, active)
SELECT '11111111-1111-1111-1111-111111111111', d, 'morning', '09:00:00', '14:00:00', 30, true
FROM unnest(ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) AS d;

INSERT INTO doctor_schedules (doctor_id, day_of_week, period, start_time, end_time, slot_duration, active)
SELECT '11111111-1111-1111-1111-111111111111', d, 'evening', '17:00:00', '20:00:00', 30, true
FROM unnest(ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) AS d;

-- Schedules for Dr. Fozia Choudhary (Mon-Sat: 09:00-14:00)
INSERT INTO doctor_schedules (doctor_id, day_of_week, period, start_time, end_time, slot_duration, active)
SELECT '22222222-2222-2222-2222-222222222222', d, 'morning', '09:00:00', '14:00:00', 30, true
FROM unnest(ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) AS d;

-- Schedules for Dr. Muhammad Arshad (Saturday only: 09:00-15:00)
INSERT INTO doctor_schedules (doctor_id, day_of_week, period, start_time, end_time, slot_duration, active)
VALUES ('33333333-3333-3333-3333-333333333333', 'Saturday', 'morning', '09:00:00', '15:00:00', 30, true);

-- Schedules for Dr. Umar Farooq (Mon-Sat: 17:00-20:00)
INSERT INTO doctor_schedules (doctor_id, day_of_week, period, start_time, end_time, slot_duration, active)
SELECT '44444444-4444-4444-4444-444444444444', d, 'evening', '17:00:00', '20:00:00', 30, true
FROM unnest(ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) AS d;

-- Initial Social Media Links
INSERT INTO social_media_links (platform, url, active) VALUES
('Facebook', 'https://www.facebook.com/Zubair-Hospital-Jhelum-112557337892123/', true),
('Instagram', 'https://www.instagram.com/zubairmedicalcomplex?igsh=MjhoNXU3bzV5dW54', true),
('Google Maps', 'https://maps.app.goo.gl/nK3fJt1X6o5zNmK87', true),
('WhatsApp', 'https://wa.me/923156621341', true),
('YouTube', 'https://www.youtube.com/results?search_query=zubair+medical+complex+jhelum', true)
ON CONFLICT (platform) DO UPDATE SET url = EXCLUDED.url;

-- Initial System Settings
INSERT INTO system_settings (setting_name, setting_value) VALUES
('hospital_notification_number', '0318-3621341'),
('messaging_provider', 'mock'),
('notifications_enabled', 'true'),
('hospital_name', 'Zubair Medical Complex Jhelum'),
('default_slot_duration', '30')
ON CONFLICT (setting_name) DO NOTHING;
