-- Migration: Add expanded student fields and session goal tracking
-- Run this in Supabase SQL Editor after the base migration

-- New student demographic & contact fields
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS student_number text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS teacher text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS eligibility text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS service_minutes text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS iep_re_eval_date date;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_phone_2 text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_email text;

-- New session_goals fields for therapy tracking
ALTER TABLE public.session_goals ADD COLUMN IF NOT EXISTS target text;
ALTER TABLE public.session_goals ADD COLUMN IF NOT EXISTS performance_level text;
