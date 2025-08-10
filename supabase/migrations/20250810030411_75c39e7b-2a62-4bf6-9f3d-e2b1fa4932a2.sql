-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS public.videos;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS public.groups;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.admin_codes;

-- Drop the user_role enum if it exists
DROP TYPE IF EXISTS public.user_role;

-- Create role enum
CREATE TYPE public.access_role AS ENUM ('main_admin', 'admin', 'moderator', 'client');

-- Create access_codes table
CREATE TABLE public.access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  role access_role NOT NULL,
  assigned_to_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT, -- Will store the access code of creator
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  access_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  iframe_link TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  added_by TEXT, -- Will store the access code of creator
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  client_code TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_codes
CREATE POLICY "Anyone can read access codes" ON public.access_codes FOR SELECT USING (true);
CREATE POLICY "No one can modify access codes via client" ON public.access_codes FOR ALL USING (false);

-- RLS Policies for groups
CREATE POLICY "Anyone can read groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Anyone can create groups" ON public.groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update groups" ON public.groups FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete groups" ON public.groups FOR DELETE USING (true);

-- RLS Policies for clients
CREATE POLICY "Anyone can read clients" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Anyone can create clients" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update clients" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete clients" ON public.clients FOR DELETE USING (true);

-- RLS Policies for videos
CREATE POLICY "Anyone can read active videos" ON public.videos FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can create videos" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update videos" ON public.videos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete videos" ON public.videos FOR DELETE USING (true);

-- RLS Policies for feedback
CREATE POLICY "Anyone can read feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Anyone can create feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update feedback" ON public.feedback FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete feedback" ON public.feedback FOR DELETE USING (true);

-- Insert the main admin code
INSERT INTO public.access_codes (code, role, assigned_to_email) 
VALUES ('7016565502', 'main_admin', 'admin@upsocial.com');

-- Insert some sample data for testing
INSERT INTO public.groups (name, description, created_by) 
VALUES ('Default Group', 'Default video group', '7016565502');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_access_codes_updated_at
  BEFORE UPDATE ON public.access_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();