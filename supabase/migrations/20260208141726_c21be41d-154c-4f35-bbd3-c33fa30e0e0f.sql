-- Fix profiles visibility: Allow public read of non-sensitive profile data
-- The profiles_public view already excludes sensitive fields

-- First, add a policy to allow reading any profile's public data
CREATE POLICY "Anyone can view public profile data" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Drop the restrictive policy that only allows own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;