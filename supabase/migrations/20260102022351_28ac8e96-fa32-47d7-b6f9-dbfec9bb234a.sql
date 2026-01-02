-- Create curriculum_levels table
CREATE TABLE public.curriculum_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  week_start INTEGER,
  week_end INTEGER,
  is_free BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curriculum_levels ENABLE ROW LEVEL SECURITY;

-- Policies for curriculum_levels
CREATE POLICY "Anyone can view curriculum levels"
ON public.curriculum_levels FOR SELECT
USING (true);

CREATE POLICY "Admins can manage curriculum levels"
ON public.curriculum_levels FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create curriculum_modules table
CREATE TABLE public.curriculum_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES public.curriculum_levels(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.patterns(id) ON DELETE SET NULL,
  module_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  why_exists TEXT,
  when_not_to_use TEXT,
  mental_model TEXT,
  pattern_template TEXT,
  confusion_breakers TEXT,
  exit_condition TEXT,
  estimated_hours INTEGER DEFAULT 4,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.curriculum_modules ENABLE ROW LEVEL SECURITY;

-- Policies for curriculum_modules
CREATE POLICY "Anyone can view curriculum modules"
ON public.curriculum_modules FOR SELECT
USING (true);

CREATE POLICY "Admins can manage curriculum modules"
ON public.curriculum_modules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create sub_patterns table
CREATE TABLE public.sub_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sub_patterns ENABLE ROW LEVEL SECURITY;

-- Policies for sub_patterns
CREATE POLICY "Anyone can view sub patterns"
ON public.sub_patterns FOR SELECT
USING (true);

CREATE POLICY "Admins can manage sub patterns"
ON public.sub_patterns FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_curriculum_progress table
CREATE TABLE public.user_curriculum_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id UUID REFERENCES public.curriculum_modules(id) ON DELETE CASCADE,
  checkpoint_passed BOOLEAN DEFAULT false,
  checkpoint_passed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.user_curriculum_progress ENABLE ROW LEVEL SECURITY;

-- Policies for user_curriculum_progress
CREATE POLICY "Users can view own curriculum progress"
ON public.user_curriculum_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own curriculum progress"
ON public.user_curriculum_progress FOR ALL
USING (auth.uid() = user_id);

-- Add curriculum fields to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS signal TEXT,
ADD COLUMN IF NOT EXISTS why_this_approach TEXT,
ADD COLUMN IF NOT EXISTS what_fails_if_wrong TEXT,
ADD COLUMN IF NOT EXISTS interview_followups TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS practice_tier TEXT DEFAULT 'thinking',
ADD COLUMN IF NOT EXISTS sub_pattern_id UUID REFERENCES public.sub_patterns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_trap_problem BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_curriculum_modules_level ON public.curriculum_modules(level_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_modules_pattern ON public.curriculum_modules(pattern_id);
CREATE INDEX IF NOT EXISTS idx_sub_patterns_module ON public.sub_patterns(module_id);
CREATE INDEX IF NOT EXISTS idx_questions_sub_pattern ON public.questions(sub_pattern_id);
CREATE INDEX IF NOT EXISTS idx_user_curriculum_progress_user ON public.user_curriculum_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_curriculum_progress_module ON public.user_curriculum_progress(module_id);

-- Create trigger for updated_at on curriculum_levels
CREATE TRIGGER update_curriculum_levels_updated_at
BEFORE UPDATE ON public.curriculum_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on curriculum_modules
CREATE TRIGGER update_curriculum_modules_updated_at
BEFORE UPDATE ON public.curriculum_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();