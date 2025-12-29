-- Create email_templates table to store customizable email templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text UNIQUE NOT NULL, -- 'granted', 'revoked', 'expiring'
  subject text NOT NULL,
  heading text NOT NULL,
  body_text text NOT NULL,
  cta_text text NOT NULL DEFAULT 'Continue Learning',
  cta_url text NOT NULL DEFAULT 'https://nexalgotrix.com/patterns',
  primary_color text NOT NULL DEFAULT '#f59e0b',
  logo_url text,
  footer_text text DEFAULT 'Master DSA with pattern-based learning.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Anyone can read templates (for edge functions)
CREATE POLICY "Anyone can read email templates"
ON public.email_templates
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (type, subject, heading, body_text, cta_text)
VALUES 
  ('granted', '🎉 Welcome to Nexalgotrix Pro!', 'Welcome to Pro!', 'Congratulations! Your Nexalgotrix Pro subscription is now active. You''ve just unlocked access to our complete DSA mastery curriculum including Phase 2-6 advanced patterns, AI Mentor, and complete solutions.', 'Start Learning Now'),
  ('revoked', 'Your Nexalgotrix Pro Access Has Ended', 'Pro Access Ended', 'Your Nexalgotrix Pro subscription has ended. You''ll continue to have access to all Phase 1 patterns completely free. All your solved questions, notes, and XP are preserved. When you renew, you''ll pick up right where you left off.', 'Renew Pro Access'),
  ('expiring', '⏰ Your Nexalgotrix Pro expires soon!', 'Pro Expiring Soon!', 'Your Nexalgotrix Pro subscription will expire soon. Don''t lose access to the advanced patterns you''ve been working on! Continue Phase 2-6 patterns, keep your AI Mentor access, and maintain your learning streak.', 'Renew Now');