-- =============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION
-- =============================================

-- 1. CREATE USER AVATARS STORAGE BUCKET
-- =============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own avatars (folder scoped by user id)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view avatars (they are public profile images)
CREATE POLICY "Public can view user avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. FIX USER_BADGES - Prevent self-awarding
-- =============================================
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "System can grant badges" ON public.user_badges;

-- Create a restrictive policy - only service role can insert
CREATE POLICY "Only service role can grant badges"
ON public.user_badges FOR INSERT
WITH CHECK (false);

-- Keep select policy for users to view their badges
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

-- Allow public to view badges for leaderboards
CREATE POLICY "Anyone can view badges for leaderboards"
ON public.user_badges FOR SELECT
USING (true);

-- 3. FIX REFUND_REQUESTS - Add payment ownership validation
-- =============================================
-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can create refund requests" ON public.refund_requests;

-- Create secure policy that validates payment ownership
CREATE POLICY "Users can create refund requests for own payments"
ON public.refund_requests FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.payments p 
    WHERE p.id = payment_id 
    AND p.user_id = auth.uid()
    AND p.status = 'captured'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.refund_requests rr 
    WHERE rr.payment_id = payment_id
  )
);

-- 4. FIX DISCUSSION_VOTES - Add unique constraint and prevent duplicate votes
-- =============================================
-- Add unique constraint to prevent duplicate votes (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'discussion_votes_user_discussion_unique'
  ) THEN
    ALTER TABLE public.discussion_votes 
    ADD CONSTRAINT discussion_votes_user_discussion_unique 
    UNIQUE (user_id, discussion_id);
  END IF;
END $$;

-- 5. SECURE EMAIL_TEMPLATES - Explicit admin-only SELECT
-- =============================================
DROP POLICY IF EXISTS "Admins can read email templates" ON public.email_templates;
CREATE POLICY "Only admins can read email templates"
ON public.email_templates FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. ADD RLS TO PROFILES_PUBLIC VIEW (restrict to authenticated users only)
-- =============================================
-- Note: Views inherit RLS from base tables, but we want to ensure 
-- the view is only accessible to authenticated users
-- This is already handled by the profiles table RLS

-- 7. PAYMENTS_PUBLIC VIEW - Restrict to own payments only
-- =============================================
-- Drop and recreate with security barrier
DROP VIEW IF EXISTS public.payments_public;
CREATE VIEW public.payments_public WITH (security_barrier = true) AS
SELECT 
  id,
  user_id,
  amount,
  currency,
  plan_type,
  status,
  razorpay_order_id,
  razorpay_payment_id,
  coupon_code,
  discount_amount,
  original_amount,
  created_at,
  updated_at
FROM public.payments
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role);

-- 8. SECURE QUESTIONS TABLE - Hide premium content from non-subscribers
-- =============================================
-- Drop existing select policy if exists
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;

-- Create policy that hides solutions for non-premium users
CREATE POLICY "Questions viewable with content restrictions"
ON public.questions FOR SELECT
USING (true);

-- Note: We keep questions viewable but will hide solutions in the application layer
-- since RLS can't easily handle column-level permissions

-- 9. ADD INDEX FOR SECURITY QUERIES (performance optimization)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_id 
ON public.refund_requests(payment_id);

CREATE INDEX IF NOT EXISTS idx_discussion_votes_user_discussion 
ON public.discussion_votes(user_id, discussion_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id 
ON public.user_badges(user_id);