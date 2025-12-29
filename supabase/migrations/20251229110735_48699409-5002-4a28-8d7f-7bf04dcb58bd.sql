-- Create topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage topics" 
ON public.topics 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view topics" 
ON public.topics 
FOR SELECT 
USING (true);

-- Add topic_id column to patterns table
ALTER TABLE public.patterns ADD COLUMN topic_id UUID REFERENCES public.topics(id);

-- Create trigger for updated_at
CREATE TRIGGER update_topics_updated_at
BEFORE UPDATE ON public.topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();