-- Add spaced repetition columns to user_progress
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ease_factor REAL NOT NULL DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval_days INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient querying of due reviews
CREATE INDEX IF NOT EXISTS idx_user_progress_next_review 
ON public.user_progress(user_id, next_review_at) 
WHERE next_review_at IS NOT NULL;