-- Add test_cases column to questions table for LeetCode-style examples
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS test_cases jsonb DEFAULT '[]'::jsonb;

-- Add example test cases structure:
-- [
--   {
--     "input": "nums = [2,7,11,15], target = 9",
--     "output": "[0,1]",
--     "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
--   }
-- ]

COMMENT ON COLUMN public.questions.test_cases IS 'LeetCode-style test cases with input, output, and optional explanation';