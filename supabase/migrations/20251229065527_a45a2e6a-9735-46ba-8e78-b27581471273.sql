-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Allow anyone to view company logos
CREATE POLICY "Public can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow admins to upload company logos
CREATE POLICY "Admins can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update company logos
CREATE POLICY "Admins can update company logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete company logos
CREATE POLICY "Admins can delete company logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Anyone can view companies
CREATE POLICY "Anyone can view companies"
ON public.companies FOR SELECT
USING (true);

-- Admins can manage companies
CREATE POLICY "Admins can manage companies"
ON public.companies FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));