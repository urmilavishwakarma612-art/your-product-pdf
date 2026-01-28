-- =========================================
-- ADD PROFILE MANAGEMENT FIELDS
-- =========================================

-- Add basic information fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add academic details fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS college TEXT,
ADD COLUMN IF NOT EXISTS degree TEXT,
ADD COLUMN IF NOT EXISTS cgpa DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- Add work experience as JSONB array
-- Structure: [{ company, role, duration, techStack, type }]
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS work_experience JSONB DEFAULT '[]'::jsonb;

-- Add portfolio URL
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Add profile completion tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;