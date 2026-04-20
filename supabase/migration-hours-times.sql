-- Migration: Add time_in / time_out to hours entries so total hours auto-computes
-- Run in Supabase SQL Editor after previous migrations.
-- Stored as text ("HH:MM" 24h) since users don't need timezone semantics here.

ALTER TABLE public.hours ADD COLUMN IF NOT EXISTS time_in text;
ALTER TABLE public.hours ADD COLUMN IF NOT EXISTS time_out text;
