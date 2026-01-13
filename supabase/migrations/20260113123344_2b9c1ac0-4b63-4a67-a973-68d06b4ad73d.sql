-- Create DSA Jobs table for latest job listings
CREATE TABLE public.dsa_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo TEXT,
  role TEXT NOT NULL,
  about_job TEXT,
  description TEXT NOT NULL,
  eligibility TEXT,
  skills TEXT[] DEFAULT '{}',
  experience TEXT,
  education TEXT,
  location TEXT,
  job_type TEXT NOT NULL DEFAULT 'full-time',
  apply_link TEXT NOT NULL,
  tags TEXT[] DEFAULT ARRAY['DSA'],
  status TEXT NOT NULL DEFAULT 'active',
  is_featured BOOLEAN DEFAULT false,
  posted_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dsa_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can view active jobs)
CREATE POLICY "Anyone can view active jobs" 
ON public.dsa_jobs 
FOR SELECT 
USING (status = 'active');

-- Create policy for admin full access
CREATE POLICY "Admins can manage all jobs" 
ON public.dsa_jobs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dsa_jobs_updated_at
BEFORE UPDATE ON public.dsa_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better search performance
CREATE INDEX idx_dsa_jobs_status ON public.dsa_jobs(status);
CREATE INDEX idx_dsa_jobs_company ON public.dsa_jobs(company_name);
CREATE INDEX idx_dsa_jobs_job_type ON public.dsa_jobs(job_type);
CREATE INDEX idx_dsa_jobs_tags ON public.dsa_jobs USING GIN(tags);