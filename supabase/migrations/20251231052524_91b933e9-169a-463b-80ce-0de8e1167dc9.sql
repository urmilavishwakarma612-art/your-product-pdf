-- Create interview_sessions table
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('quick', 'full', 'pattern', 'company')),
  time_limit INTEGER NOT NULL, -- in seconds
  pattern_id UUID REFERENCES public.patterns(id),
  company_name TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of question_ids
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interview_results table for per-question results
CREATE TABLE public.interview_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  time_spent INTEGER DEFAULT 0, -- in seconds
  is_solved BOOLEAN DEFAULT false,
  hints_used INTEGER DEFAULT 0,
  skipped BOOLEAN DEFAULT false,
  flagged BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_sessions
CREATE POLICY "Users can view own sessions"
  ON public.interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON public.interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for interview_results
CREATE POLICY "Users can view own results"
  ON public.interview_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.interview_sessions s 
    WHERE s.id = interview_results.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own results"
  ON public.interview_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interview_sessions s 
    WHERE s.id = interview_results.session_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own results"
  ON public.interview_results FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.interview_sessions s 
    WHERE s.id = interview_results.session_id AND s.user_id = auth.uid()
  ));

-- Create indexes
CREATE INDEX idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX idx_interview_sessions_status ON public.interview_sessions(status);
CREATE INDEX idx_interview_results_session_id ON public.interview_results(session_id);

-- Trigger for updated_at
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();