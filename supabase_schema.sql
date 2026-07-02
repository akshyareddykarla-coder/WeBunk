-- ====================================================================
-- WeBunk Master SQL Migration for Supabase
-- Includes 16 tables, relational integrity, auto-updated timestamps,
-- profile synchronization triggers, non-recursive RLS policies, and indexes.
-- Copy and run this in your Supabase SQL Editor.
-- ====================================================================

-- 0. Clean Slate: Drop all old tables and functions to prevent IF NOT EXISTS column mismatches
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_college() CASCADE;

DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.timetable CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.sections CASCADE;
DROP TABLE IF EXISTS public.semesters CASCADE;
DROP TABLE IF EXISTS public.academic_years CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.colleges CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.academic_calendar CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'super_admin')),
    college_id UUID REFERENCES public.colleges(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create branches Table
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, college_id)
);

-- 4. Create departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, college_id)
);

-- 5. Create academic_years Table
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., "2025-2026"
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, college_id)
);

-- 6. Create semesters Table
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create sections Table
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(name, semester_id)
);

-- 8. Create admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    student_id_code TEXT UNIQUE,
    college_email TEXT,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    attendance_requirement INTEGER NOT NULL DEFAULT 75,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create faculty Table
CREATE TABLE IF NOT EXISTS public.faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Create subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES public.semesters(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Create timetable Table
CREATE TABLE IF NOT EXISTS public.timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TEXT NOT NULL, -- e.g., "09:00"
    end_time TEXT NOT NULL,   -- e.g., "09:50"
    room TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Create attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, subject_id, date)
);

-- 14. Create notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('danger', 'warning', 'success', 'info')),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    recipient_student_id UUID REFERENCES public.students(id) ON DELETE CASCADE, -- Null means broadcast
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Create academic_calendar Table
CREATE TABLE IF NOT EXISTS public.academic_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Create holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    holiday_date DATE NOT NULL,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Create announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ====================================================================
-- Enable RLS (Row Level Security) on all tables
-- ====================================================================
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;


-- ====================================================================
-- Helper Functions to bypass recursive policies
-- ====================================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_user_college()
RETURNS UUID SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT college_id FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;


-- ====================================================================
-- RLS Policy Definitions
-- ====================================================================

-- 1. colleges Policies
DROP POLICY IF EXISTS "colleges_select" ON public.colleges;
DROP POLICY IF EXISTS "colleges_all_admin" ON public.colleges;
CREATE POLICY "colleges_select" ON public.colleges FOR SELECT TO authenticated USING (true);
CREATE POLICY "colleges_all_admin" ON public.colleges FOR ALL TO authenticated USING (is_super_admin() OR (is_admin() AND id = get_user_college()));

-- 2. profiles Policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR is_super_admin() OR (is_admin() AND college_id = get_user_college()));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR is_super_admin());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR is_super_admin() OR (is_admin() AND college_id = get_user_college()));
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (is_super_admin() OR (is_admin() AND college_id = get_user_college()));

-- 3. branches Policies
DROP POLICY IF EXISTS "branches_select" ON public.branches;
DROP POLICY IF EXISTS "branches_all_admin" ON public.branches;
CREATE POLICY "branches_select" ON public.branches FOR SELECT TO authenticated USING (college_id = get_user_college());
CREATE POLICY "branches_all_admin" ON public.branches FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());

-- 4. departments Policies
DROP POLICY IF EXISTS "departments_select" ON public.departments;
DROP POLICY IF EXISTS "departments_all_admin" ON public.departments;
CREATE POLICY "departments_select" ON public.departments FOR SELECT TO authenticated USING (college_id = get_user_college());
CREATE POLICY "departments_all_admin" ON public.departments FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());

-- 5. academic_years Policies
DROP POLICY IF EXISTS "academic_years_select" ON public.academic_years;
DROP POLICY IF EXISTS "academic_years_all_admin" ON public.academic_years;
CREATE POLICY "academic_years_select" ON public.academic_years FOR SELECT TO authenticated USING (college_id = get_user_college());
CREATE POLICY "academic_years_all_admin" ON public.academic_years FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());

-- 6. semesters Policies
DROP POLICY IF EXISTS "semesters_select" ON public.semesters;
DROP POLICY IF EXISTS "semesters_all_admin" ON public.semesters;
CREATE POLICY "semesters_select" ON public.semesters FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.branches b WHERE b.id = semesters.branch_id AND b.college_id = get_user_college())
);
CREATE POLICY "semesters_all_admin" ON public.semesters FOR ALL TO authenticated USING (
    is_admin() AND EXISTS (SELECT 1 FROM public.branches b WHERE b.id = semesters.branch_id AND b.college_id = get_user_college())
);

-- 7. sections Policies
DROP POLICY IF EXISTS "sections_select" ON public.sections;
DROP POLICY IF EXISTS "sections_all_admin" ON public.sections;
CREATE POLICY "sections_select" ON public.sections FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.semesters s JOIN public.branches b ON b.id = s.branch_id WHERE s.id = sections.semester_id AND b.college_id = get_user_college())
);
CREATE POLICY "sections_all_admin" ON public.sections FOR ALL TO authenticated USING (
    is_admin() AND EXISTS (SELECT 1 FROM public.semesters s JOIN public.branches b ON b.id = s.branch_id WHERE s.id = sections.semester_id AND b.college_id = get_user_college())
);

-- 8. admins Policies
DROP POLICY IF EXISTS "admins_select" ON public.admins;
DROP POLICY IF EXISTS "admins_all_admin" ON public.admins;
CREATE POLICY "admins_select" ON public.admins FOR SELECT TO authenticated USING (is_super_admin() OR college_id = get_user_college());
CREATE POLICY "admins_all_admin" ON public.admins FOR ALL TO authenticated USING (is_super_admin() OR (is_admin() AND college_id = get_user_college()));

-- 9. students Policies
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT TO authenticated USING (is_super_admin() OR profile_id = auth.uid() OR (is_admin() AND college_id = get_user_college()));
CREATE POLICY "students_insert" ON public.students FOR INSERT TO authenticated WITH CHECK (is_super_admin() OR profile_id = auth.uid() OR is_admin());
CREATE POLICY "students_update" ON public.students FOR UPDATE TO authenticated USING (is_super_admin() OR profile_id = auth.uid() OR (is_admin() AND college_id = get_user_college()));
CREATE POLICY "students_delete" ON public.students FOR DELETE TO authenticated USING (is_super_admin() OR (is_admin() AND college_id = get_user_college()));

-- 10. faculty Policies
DROP POLICY IF EXISTS "faculty_select" ON public.faculty;
DROP POLICY IF EXISTS "faculty_all_admin" ON public.faculty;
CREATE POLICY "faculty_select" ON public.faculty FOR SELECT TO authenticated USING (college_id = get_user_college());
CREATE POLICY "faculty_all_admin" ON public.faculty FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());

-- 11. subjects Policies
DROP POLICY IF EXISTS "subjects_select" ON public.subjects;
DROP POLICY IF EXISTS "subjects_all_admin" ON public.subjects;
CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated USING (college_id = get_user_college());
CREATE POLICY "subjects_all_admin" ON public.subjects FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());

-- 12. timetable Policies
DROP POLICY IF EXISTS "timetable_select" ON public.timetable;
DROP POLICY IF EXISTS "timetable_all_admin" ON public.timetable;
CREATE POLICY "timetable_select" ON public.timetable FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = timetable.subject_id AND s.college_id = get_user_college())
);
CREATE POLICY "timetable_all_admin" ON public.timetable FOR ALL TO authenticated USING (
    is_admin() AND EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = timetable.subject_id AND s.college_id = get_user_college())
);

-- 13. attendance Policies
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND (s.profile_id = auth.uid() OR (is_admin() AND s.college_id = get_user_college())))
);
CREATE POLICY "attendance_insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND (s.profile_id = auth.uid() OR (is_admin() AND s.college_id = get_user_college())))
);
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND (s.profile_id = auth.uid() OR (is_admin() AND s.college_id = get_user_college())))
);
CREATE POLICY "attendance_delete" ON public.attendance FOR DELETE TO authenticated USING (
    is_admin() AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = attendance.student_id AND s.college_id = get_user_college())
);

-- 14. notifications Policies
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_all_admin" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (
    college_id = get_user_college() AND (
        recipient_student_id IS NULL OR 
        EXISTS (SELECT 1 FROM public.students s WHERE s.id = notifications.recipient_student_id AND s.profile_id = auth.uid()) OR 
        is_admin()
    )
);
CREATE POLICY "notifications_all_admin" ON public.notifications FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());

-- 15. academic_calendar Policies
DROP POLICY IF EXISTS "academic_calendar_select" ON public.academic_calendar;
DROP POLICY IF EXISTS "academic_calendar_all_admin" ON public.academic_calendar;
CREATE POLICY "academic_calendar_select" ON public.academic_calendar FOR SELECT TO authenticated USING (college_id = get_user_college());
CREATE POLICY "academic_calendar_all_admin" ON public.academic_calendar FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());

-- 16. holidays Policies
DROP POLICY IF EXISTS "holidays_select" ON public.holidays;
DROP POLICY IF EXISTS "holidays_all_admin" ON public.holidays;
CREATE POLICY "holidays_select" ON public.holidays FOR SELECT TO authenticated USING (college_id = get_user_college());
CREATE POLICY "holidays_all_admin" ON public.holidays FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());

-- 17. announcements Policies
DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
DROP POLICY IF EXISTS "announcements_all_admin" ON public.announcements;
CREATE POLICY "announcements_select" ON public.announcements FOR SELECT TO authenticated USING (college_id = get_user_college());
CREATE POLICY "announcements_all_admin" ON public.announcements FOR ALL TO authenticated USING (is_admin() AND college_id = get_user_college());


-- ====================================================================
-- Automatically update updated_at Column triggers
-- ====================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_colleges_updated_at ON public.colleges;
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON public.colleges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_branches_updated_at ON public.branches;
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON public.departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_academic_years_updated_at ON public.academic_years;
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_semesters_updated_at ON public.semesters;
CREATE TRIGGER update_semesters_updated_at BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sections_updated_at ON public.sections;
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_faculty_updated_at ON public.faculty;
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON public.subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_timetable_updated_at ON public.timetable;
CREATE TRIGGER update_timetable_updated_at BEFORE UPDATE ON public.timetable FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_academic_calendar_updated_at ON public.academic_calendar;
CREATE TRIGGER update_academic_calendar_updated_at BEFORE UPDATE ON public.academic_calendar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_holidays_updated_at ON public.holidays;
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON public.holidays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON public.announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ====================================================================
-- Profile Sync Trigger (Automatically creates profile record on auth signup)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    role_val TEXT;
    college_name_val TEXT;
    college_uuid UUID;
    full_name_val TEXT;
BEGIN
    -- Extract metadata from raw_user_meta_data
    role_val := COALESCE(new.raw_user_meta_data->>'role', 'student');
    -- Normalize role to match CHECK constraint ('student', 'admin', 'super_admin')
    IF LOWER(role_val) = 'college admin' OR LOWER(role_val) = 'admin' THEN
        role_val := 'admin';
    ELSIF LOWER(role_val) = 'super admin' OR LOWER(role_val) = 'super_admin' THEN
        role_val := 'super_admin';
    ELSE
        role_val := 'student';
    END IF;

    college_name_val := COALESCE(new.raw_user_meta_data->>'college_name', 'Default College');
    full_name_val := COALESCE(new.raw_user_meta_data->>'full_name', 'New User');

    -- Find or create college (robust check first to avoid ON CONFLICT errors)
    IF college_name_val IS NOT NULL AND college_name_val <> '' THEN
        SELECT id INTO college_uuid FROM public.colleges WHERE name = college_name_val LIMIT 1;
        
        IF college_uuid IS NULL THEN
            BEGIN
                INSERT INTO public.colleges (name)
                VALUES (college_name_val)
                RETURNING id INTO college_uuid;
            EXCEPTION WHEN OTHERS THEN
                SELECT id INTO college_uuid FROM public.colleges WHERE name = college_name_val LIMIT 1;
            END;
        END IF;
    END IF;

    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name, role, college_id)
    VALUES (
        new.id,
        new.email,
        full_name_val,
        role_val,
        college_uuid
    );

    -- If student role, automatically seed students table
    IF role_val = 'student' THEN
        INSERT INTO public.students (profile_id, college_id, student_id_code, college_email)
        VALUES (
            new.id, 
            college_uuid,
            new.raw_user_meta_data->>'student_id_code',
            new.raw_user_meta_data->>'college_email'
        );
    -- If admin role, seed admins table
    ELSIF role_val = 'admin' THEN
        INSERT INTO public.admins (profile_id, college_id)
        VALUES (new.id, college_uuid);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger safely without dropping to avoid permission/existence errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;


-- ====================================================================
-- Highly optimized Indexes for high relational query speed
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_branches_college_id ON public.branches(college_id);
CREATE INDEX IF NOT EXISTS idx_departments_college_id ON public.departments(college_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_college_id ON public.academic_years(college_id);
CREATE INDEX IF NOT EXISTS idx_semesters_branch_id ON public.semesters(branch_id);
CREATE INDEX IF NOT EXISTS idx_semesters_academic_year_id ON public.semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_sections_semester_id ON public.sections(semester_id);
CREATE INDEX IF NOT EXISTS idx_admins_profile_id ON public.admins(profile_id);
CREATE INDEX IF NOT EXISTS idx_admins_college_id ON public.admins(college_id);
CREATE INDEX IF NOT EXISTS idx_students_profile_id ON public.students(profile_id);
CREATE INDEX IF NOT EXISTS idx_students_college_id ON public.students(college_id);
CREATE INDEX IF NOT EXISTS idx_faculty_college_id ON public.faculty(college_id);
CREATE INDEX IF NOT EXISTS idx_subjects_college_id ON public.subjects(college_id);
CREATE INDEX IF NOT EXISTS idx_subjects_faculty_id ON public.subjects(faculty_id);
CREATE INDEX IF NOT EXISTS idx_timetable_subject_id ON public.timetable(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_notifications_college_id ON public.notifications(college_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_student_id ON public.notifications(recipient_student_id);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_college_id ON public.academic_calendar(college_id);
CREATE INDEX IF NOT EXISTS idx_holidays_college_id ON public.holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_announcements_college_id ON public.announcements(college_id);
