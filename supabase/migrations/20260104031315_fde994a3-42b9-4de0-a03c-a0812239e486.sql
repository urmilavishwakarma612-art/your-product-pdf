-- Add new columns to interview_results for enhanced tracking
ALTER TABLE public.interview_results
ADD COLUMN IF NOT EXISTS run_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS paste_detected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS run_before_submit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS code_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS interview_performance_score INTEGER DEFAULT 0;

-- Add mode column to interview_sessions
ALTER TABLE public.interview_sessions
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'interview';

-- Add check constraint for mode values
ALTER TABLE public.interview_sessions
DROP CONSTRAINT IF EXISTS interview_sessions_mode_check;

ALTER TABLE public.interview_sessions
ADD CONSTRAINT interview_sessions_mode_check 
CHECK (mode IN ('practice', 'interview'));