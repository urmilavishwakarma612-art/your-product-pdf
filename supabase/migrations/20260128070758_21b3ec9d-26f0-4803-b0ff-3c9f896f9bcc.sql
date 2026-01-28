-- =========================================
-- FIX PROFILES TABLE PUBLIC EXPOSURE
-- Create a secure public view for profile data
-- =========================================

-- 1. Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- 2. Create restrictive policy - users can only view their OWN profile from base table
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- 3. Create a public view with only non-sensitive fields for leaderboards/public profiles
-- This view exposes minimal data needed for gamification features
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  username,
  avatar_url,
  total_xp,
  current_level,
  current_streak,
  longest_streak,
  subscription_status,
  created_at
FROM public.profiles;

-- 4. Grant access to the public view for authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- 5. Add index for better RLS performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);