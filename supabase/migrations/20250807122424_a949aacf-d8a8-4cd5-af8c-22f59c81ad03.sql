-- Add user roles and authentication system
CREATE TYPE public.user_role AS ENUM ('main_admin', 'admin', 'moderator', 'client');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role IN ('main_admin', 'admin', 'moderator')
));

CREATE POLICY "Admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role IN ('main_admin', 'admin', 'moderator')
));

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role IN ('main_admin', 'admin', 'moderator')
));

CREATE POLICY "Only main admin can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'main_admin'
));

-- Add video expiration and enhanced features
ALTER TABLE public.videos 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN streamable_url TEXT,
ADD COLUMN streamable_shortcode TEXT,
ADD COLUMN duration INTEGER,
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);

-- Update videos table policies for new role system
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.videos;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.videos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.videos;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.videos;

CREATE POLICY "Everyone can view active videos" 
ON public.videos 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can create videos" 
ON public.videos 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role IN ('main_admin', 'admin')
));

CREATE POLICY "Only main admin can update videos" 
ON public.videos 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'main_admin'
));

CREATE POLICY "Only main admin can delete videos" 
ON public.videos 
FOR DELETE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'main_admin'
));

-- Update clients table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.clients;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.clients;

CREATE POLICY "Moderators can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role IN ('main_admin', 'admin', 'moderator')
));

CREATE POLICY "Only main admin can update clients" 
ON public.clients 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'main_admin'
));

CREATE POLICY "Only main admin can delete clients" 
ON public.clients 
FOR DELETE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'main_admin'
));

-- Update groups table policies
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.groups;

CREATE POLICY "Admins can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role IN ('main_admin', 'admin', 'moderator')
));

CREATE POLICY "Only main admin can update groups" 
ON public.groups 
FOR UPDATE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'main_admin'
));

CREATE POLICY "Only main admin can delete groups" 
ON public.groups 
FOR DELETE 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles WHERE role = 'main_admin'
));

-- Create trigger for profile updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert main admin profile
INSERT INTO public.profiles (email, display_name, role) 
VALUES ('joshitirth1107@gmail.com', 'Main Administrator', 'main_admin');

-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    CASE 
      WHEN NEW.email = 'joshitirth1107@gmail.com' THEN 'main_admin'::user_role
      ELSE 'client'::user_role
    END
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to cleanup expired videos
CREATE OR REPLACE FUNCTION public.cleanup_expired_videos()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.videos 
  WHERE expires_at IS NOT NULL AND expires_at <= now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;