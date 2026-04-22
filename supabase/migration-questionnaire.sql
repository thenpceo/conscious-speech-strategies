-- Migration: Create questionnaire_submissions table for private services intake
-- Run in Supabase SQL Editor after previous migrations.

CREATE TABLE public.questionnaire_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Identity & contact
  child_name text NOT NULL,
  date_of_birth text,
  parent_name text NOT NULL,
  relationship text,
  email text,
  phone text,
  address text,
  -- Service preferences
  service_type text CHECK (service_type IN ('evaluation', 'therapy', 'both')),
  eval_type text,
  therapy_type text CHECK (therapy_type IN ('individualized', 'group')),
  session_preference text CHECK (session_preference IN ('in_person', 'virtual')),
  has_iep boolean DEFAULT false,
  wants_evaluation boolean DEFAULT false,
  -- Questionnaire sections (JSONB for flexibility)
  pregnancy_birth jsonb DEFAULT '{}'::jsonb,
  medical_health jsonb DEFAULT '{}'::jsonb,
  developmental_milestones jsonb DEFAULT '{}'::jsonb,
  speech_language jsonb DEFAULT '{}'::jsonb,
  social_behavioral jsonb DEFAULT '{}'::jsonb,
  education jsonb DEFAULT '{}'::jsonb,
  family_history jsonb DEFAULT '{}'::jsonb,
  parent_input jsonb DEFAULT '{}'::jsonb,
  -- Metadata
  date_completed date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.questionnaire_submissions ENABLE ROW LEVEL SECURITY;

-- Public insert (no auth required — this is a public form)
CREATE POLICY "Anyone can submit questionnaire" ON public.questionnaire_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Authenticated read questionnaire" ON public.questionnaire_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated update questionnaire" ON public.questionnaire_submissions
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete questionnaire" ON public.questionnaire_submissions
  FOR DELETE TO authenticated USING (true);
