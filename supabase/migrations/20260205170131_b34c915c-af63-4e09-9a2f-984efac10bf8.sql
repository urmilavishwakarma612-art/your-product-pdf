-- Create table for launch offer settings
CREATE TABLE public.launch_offer_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT 'Launch Offer Ends In',
  description text,
  end_date timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.launch_offer_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "Admins can manage launch offer settings"
ON public.launch_offer_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active settings
CREATE POLICY "Anyone can view active launch offer settings"
ON public.launch_offer_settings
FOR SELECT
USING (is_active = true);

-- Insert default offer (7 days from now)
INSERT INTO public.launch_offer_settings (title, description, end_date, is_active)
VALUES ('Launch Offer Ends In', 'Special launch pricing - 50% off all plans!', now() + interval '7 days', true);