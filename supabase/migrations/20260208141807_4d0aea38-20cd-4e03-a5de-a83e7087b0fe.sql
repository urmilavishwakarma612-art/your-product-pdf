-- Add pattern_id to sub_patterns to link sub-patterns to patterns
-- This allows the structure: Level > Module > Pattern > Sub-Pattern > Questions

-- Add pattern_id column
ALTER TABLE public.sub_patterns 
ADD COLUMN IF NOT EXISTS pattern_id uuid REFERENCES public.patterns(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sub_patterns_pattern_id ON public.sub_patterns(pattern_id);

-- Note: We keep module_id for backward compatibility, but pattern_id takes precedence for new structure