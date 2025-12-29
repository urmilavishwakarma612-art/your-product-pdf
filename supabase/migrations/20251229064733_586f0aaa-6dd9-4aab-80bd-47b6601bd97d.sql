-- Add companies column to questions table
ALTER TABLE public.questions 
ADD COLUMN companies text[] DEFAULT '{}';

-- Add a comment for clarity
COMMENT ON COLUMN public.questions.companies IS 'Array of company names that have asked this question';