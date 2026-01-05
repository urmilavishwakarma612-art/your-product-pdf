-- Add gamification fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS streak_freeze_available INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_freeze_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS curriculum_level INTEGER DEFAULT 0;

-- Add communication scoring fields to interview_results
ALTER TABLE interview_results
ADD COLUMN IF NOT EXISTS communication_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS approach_explained BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS brute_approach_explained BOOLEAN DEFAULT false;

-- Create daily challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  challenge_date DATE NOT NULL,
  module_id UUID REFERENCES curriculum_modules,
  question_id UUID REFERENCES questions,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

-- Enable RLS on daily_challenges
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_challenges
CREATE POLICY "Users can view their own daily challenges"
ON public.daily_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily challenges"
ON public.daily_challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily challenges"
ON public.daily_challenges FOR UPDATE
USING (auth.uid() = user_id);

-- Seed Level Badges (0-10) - using 'achievement' type
INSERT INTO badges (name, type, icon, description, requirement) VALUES
('Level 0 Initiate', 'achievement', '🌱', 'Started your DSA journey', '{"level": 0}'),
('Level 1 Explorer', 'achievement', '🔍', 'Completed Level 1 - Linear Thinking', '{"level": 1}'),
('Level 2 Searcher', 'achievement', '🔎', 'Completed Level 2 - Binary Search Mastery', '{"level": 2}'),
('Level 3 Builder', 'achievement', '🏗️', 'Completed Level 3 - Structure-Driven Patterns', '{"level": 3}'),
('Level 4 Thinker', 'achievement', '🧠', 'Completed Level 4 - Recursion & Backtracking', '{"level": 4}'),
('Level 5 Optimizer', 'achievement', '⚡', 'Completed Level 5 - Dynamic Programming Basics', '{"level": 5}'),
('Level 6 Strategist', 'achievement', '♟️', 'Completed Level 6 - Advanced DP', '{"level": 6}'),
('Level 7 Solver', 'achievement', '🎯', 'Completed Level 7 - Graph Fundamentals', '{"level": 7}'),
('Level 8 Advanced', 'achievement', '🚀', 'Completed Level 8 - Advanced Graphs', '{"level": 8}'),
('Level 9 Interview-Ready', 'achievement', '💼', 'Completed Level 9 - System Design Patterns', '{"level": 9}'),
('Level 10 Mastery', 'achievement', '👑', 'Achieved complete DSA mastery', '{"level": 10}')
ON CONFLICT DO NOTHING;

-- Seed Pattern Mastery Badges
INSERT INTO badges (name, type, icon, description, requirement) VALUES
('Two Pointer Master', 'pattern', '👆', 'Mastered Two Pointer pattern with 80%+ accuracy', '{"pattern": "two-pointer", "accuracy": 80}'),
('Sliding Window Master', 'pattern', '🪟', 'Mastered Sliding Window pattern with 80%+ accuracy', '{"pattern": "sliding-window", "accuracy": 80}'),
('Binary Search Master', 'pattern', '🔍', 'Mastered Binary Search pattern with 80%+ accuracy', '{"pattern": "binary-search", "accuracy": 80}'),
('Stack Master', 'pattern', '📚', 'Mastered Stack pattern with 80%+ accuracy', '{"pattern": "stack", "accuracy": 80}'),
('Queue Master', 'pattern', '🚶', 'Mastered Queue pattern with 80%+ accuracy', '{"pattern": "queue", "accuracy": 80}'),
('DP Master', 'pattern', '🧩', 'Mastered Dynamic Programming with 80%+ accuracy', '{"pattern": "dp", "accuracy": 80}'),
('Graph Master', 'pattern', '🕸️', 'Mastered Graph patterns with 80%+ accuracy', '{"pattern": "graph", "accuracy": 80}'),
('Tree Master', 'pattern', '🌳', 'Mastered Tree patterns with 80%+ accuracy', '{"pattern": "tree", "accuracy": 80}')
ON CONFLICT DO NOTHING;

-- Seed Consistency Badges
INSERT INTO badges (name, type, icon, description, requirement) VALUES
('3-Day Streak', 'streak', '🔥', 'Maintained a 3-day practice streak', '{"streak": 3}'),
('7-Day Streak', 'streak', '🔥', 'Maintained a 7-day practice streak', '{"streak": 7}'),
('14-Day Dedication', 'streak', '💪', 'Maintained a 14-day practice streak', '{"streak": 14}'),
('21-Day Discipline', 'streak', '🏆', 'Maintained a 21-day practice streak', '{"streak": 21}'),
('30-Day Consistency', 'streak', '⭐', 'Maintained a 30-day practice streak', '{"streak": 30}')
ON CONFLICT DO NOTHING;

-- Seed Special Badges (using achievement type)
INSERT INTO badges (name, type, icon, description, requirement) VALUES
('First Interview', 'achievement', '🎉', 'Completed first interview simulation', '{"interviews": 1}'),
('No Hint Champion', 'achievement', '💎', 'Solved 10 problems without using hints', '{"no_hint_streak": 10}'),
('Brute Thinker', 'achievement', '🧠', 'Explained brute + optimal approach in interviews', '{"brute_explained": true}'),
('Edge Case Hunter', 'achievement', '🎯', 'Consistently found edge cases in solutions', '{"edge_cases": 10}'),
('Time-Aware Coder', 'achievement', '⏱️', 'Demonstrated optimal time management', '{"time_efficiency": 80}'),
('Clean Communicator', 'achievement', '💬', 'Excellent communication scores in interviews', '{"communication": 80}'),
('Perfect Session', 'achievement', '🌟', 'Achieved 100% in an interview session', '{"perfect_score": true}')
ON CONFLICT DO NOTHING;