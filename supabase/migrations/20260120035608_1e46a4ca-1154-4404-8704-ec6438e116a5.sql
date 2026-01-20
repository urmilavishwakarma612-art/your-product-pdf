-- Add columns to tutor_sessions for NexMentor session persistence
ALTER TABLE public.tutor_sessions 
ADD COLUMN IF NOT EXISTS current_step integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_code text,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'python',
ADD COLUMN IF NOT EXISTS leetcode_unlocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS time_spent integer DEFAULT 0;

-- Create index for faster user session lookups
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user_question 
ON public.tutor_sessions(user_id, question_id, created_at DESC);

-- Update RLS policies to allow users to update their own sessions
DROP POLICY IF EXISTS "Users can update own sessions" ON public.tutor_sessions;
CREATE POLICY "Users can update own sessions" 
ON public.tutor_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.tutor_sessions;
CREATE POLICY "Users can insert own sessions" 
ON public.tutor_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own sessions" ON public.tutor_sessions;
CREATE POLICY "Users can view own sessions" 
ON public.tutor_sessions 
FOR SELECT 
USING (auth.uid() = user_id);