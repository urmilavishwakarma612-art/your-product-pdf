-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read email templates" ON public.email_templates;