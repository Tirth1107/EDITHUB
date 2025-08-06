-- Create admin codes table
CREATE TABLE public.admin_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_id TEXT NOT NULL UNIQUE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  video_id TEXT NOT NULL,
  video_link TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (temporarily permissive for development)
CREATE POLICY "Enable read access for all users" ON public.admin_codes FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.videos FOR SELECT USING (true);

-- Admin can manage everything
CREATE POLICY "Enable insert for authenticated users" ON public.admin_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.admin_codes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.admin_codes FOR DELETE USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.groups FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.groups FOR DELETE USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.clients FOR DELETE USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON public.videos FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users" ON public.videos FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_admin_codes_updated_at
  BEFORE UPDATE ON public.admin_codes
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

-- Enable realtime for all tables
ALTER TABLE public.admin_codes REPLICA IDENTITY FULL;
ALTER TABLE public.groups REPLICA IDENTITY FULL;
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.videos REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_codes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;

-- Insert default admin code
INSERT INTO public.admin_codes (code) VALUES ('7016565502');

-- Insert sample data
INSERT INTO public.groups (name, access_code, description) VALUES 
  ('Premium Group', 'PREMIUM2024', 'Premium access group for exclusive content'),
  ('Basic Group', 'BASIC2024', 'Basic access group for general content');

INSERT INTO public.videos (group_id, name, video_id, video_link, description) VALUES 
  ((SELECT id FROM public.groups WHERE access_code = 'PREMIUM2024'), 'Premium Video 1', 'PV001', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'Exclusive premium content'),
  ((SELECT id FROM public.groups WHERE access_code = 'BASIC2024'), 'Basic Video 1', 'BV001', 'https://www.youtube.com/embed/3JZ_D3ELwOQ', 'General access content');