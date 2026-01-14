
-- Add XP badge type to the constraint
ALTER TABLE public.badges DROP CONSTRAINT IF EXISTS badges_type_check;
ALTER TABLE public.badges ADD CONSTRAINT badges_type_check CHECK (type IN ('streak', 'pattern', 'achievement', 'xp'));
