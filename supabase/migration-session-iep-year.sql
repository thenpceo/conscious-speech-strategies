-- Migration: Stamp sessions with IEP year label for historical grouping
-- Run this in Supabase SQL Editor after migration-student-fields.sql
-- null = current IEP; set to a year label (e.g., "2025-2026") when that IEP is rolled over

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS iep_year text;
