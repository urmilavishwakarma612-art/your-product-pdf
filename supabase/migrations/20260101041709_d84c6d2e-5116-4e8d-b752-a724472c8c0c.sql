-- Add code storage columns to interview_results table
ALTER TABLE public.interview_results 
ADD COLUMN IF NOT EXISTS submitted_code TEXT,
ADD COLUMN IF NOT EXISTS selected_language TEXT DEFAULT 'python',
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_keystroke_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS code_snapshots JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS evaluation_result JSONB;

-- Add index for faster queries on evaluation results
CREATE INDEX IF NOT EXISTS idx_interview_results_evaluation ON public.interview_results USING GIN (evaluation_result);

-- Comment for clarity
COMMENT ON COLUMN public.interview_results.submitted_code IS 'User submitted code for the question';
COMMENT ON COLUMN public.interview_results.selected_language IS 'Programming language used (python, java, cpp, javascript)';
COMMENT ON COLUMN public.interview_results.first_keystroke_at IS 'Timestamp of first keystroke to measure thinking time';
COMMENT ON COLUMN public.interview_results.code_snapshots IS 'Periodic snapshots of code for attempt tracking';
COMMENT ON COLUMN public.interview_results.evaluation_result IS 'AI evaluation result including approach, complexity, quality score';