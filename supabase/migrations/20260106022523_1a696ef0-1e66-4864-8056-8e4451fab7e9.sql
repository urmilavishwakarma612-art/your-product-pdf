-- AI Tutor Sessions (for session memory & replay)
CREATE TABLE public.tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  question_id UUID REFERENCES questions,
  pattern_id UUID REFERENCES patterns,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  session_type TEXT CHECK (session_type IN ('hint', 'coaching', 'debug', 'custom')),
  user_skill_level TEXT DEFAULT 'intermediate',
  total_messages INTEGER DEFAULT 0,
  hints_given INTEGER DEFAULT 0,
  problem_solved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tutor Messages (conversation history)
CREATE TABLE public.tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES tutor_sessions NOT NULL,
  role TEXT CHECK (role IN ('user', 'tutor')),
  content TEXT NOT NULL,
  message_type TEXT, -- 'hint', 'question', 'explanation', 'code_highlight', 'diagram'
  code_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Mistake Tracker
CREATE TABLE public.user_mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_id UUID REFERENCES patterns,
  question_id UUID REFERENCES questions,
  mistake_type TEXT,
  description TEXT,
  occurrence_count INTEGER DEFAULT 1,
  last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tutor_guidance_given TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning Insights (weekly analytics)
CREATE TABLE public.learning_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pattern_id UUID REFERENCES patterns,
  week_start DATE,
  problems_attempted INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  avg_time_with_tutor INTEGER,
  avg_time_without_tutor INTEGER,
  hint_effectiveness_score REAL,
  struggling_areas JSONB,
  improved_areas JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pattern_id, week_start)
);

-- Add skill level and tutor preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS skill_level TEXT DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS tutor_preferences JSONB DEFAULT '{"hint_style": "balanced", "show_diagrams": true, "auto_coaching": true}'::jsonb;

-- Enable RLS on all new tables
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_sessions
CREATE POLICY "Users can view own tutor sessions"
ON public.tutor_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tutor sessions"
ON public.tutor_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutor sessions"
ON public.tutor_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for tutor_messages
CREATE POLICY "Users can view messages from own sessions"
ON public.tutor_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM tutor_sessions 
  WHERE tutor_sessions.id = tutor_messages.session_id 
  AND tutor_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in own sessions"
ON public.tutor_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM tutor_sessions 
  WHERE tutor_sessions.id = tutor_messages.session_id 
  AND tutor_sessions.user_id = auth.uid()
));

-- RLS Policies for user_mistakes
CREATE POLICY "Users can view own mistakes"
ON public.user_mistakes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mistakes"
ON public.user_mistakes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mistakes"
ON public.user_mistakes FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for learning_insights
CREATE POLICY "Users can view own insights"
ON public.learning_insights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own insights"
ON public.learning_insights FOR ALL
USING (auth.uid() = user_id);