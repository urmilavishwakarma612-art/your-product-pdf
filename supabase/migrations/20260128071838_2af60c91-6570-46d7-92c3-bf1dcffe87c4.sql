-- =========================================
-- FIX SECURITY ISSUES
-- =========================================

-- 1. Restrict coupons visibility to authenticated users only
-- Drop existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- Create new policy requiring authentication
CREATE POLICY "Authenticated users can view active coupons" 
ON public.coupons 
FOR SELECT 
TO authenticated 
USING (is_active = true);