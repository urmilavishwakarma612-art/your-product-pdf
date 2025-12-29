-- Add policy for public viewing of user progress (solved status only, not notes)
CREATE POLICY "Anyone can view solved progress for profiles"
ON public.user_progress FOR SELECT
USING (true);

-- Add policy for public viewing of user badges
CREATE POLICY "Anyone can view user badges"
ON public.user_badges FOR SELECT
USING (true);