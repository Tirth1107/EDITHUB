import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VideoPlayer } from './VideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Search, Filter, Clock, Play, Eye, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoData {
  id: string;
  video_id: string;
  name: string;
  description?: string;
  video_link: string;
  streamable_url?: string;
  streamable_shortcode?: string;
  thumbnail_url?: string;
  duration?: number;
  expires_at?: string;
  created_at: string;
  group_id: string;
  groups?: {
    name: string;
    access_code: string;
  };
}

interface Group {
  id: string;
  name: string;
  access_code: string;
  description?: string;
}

export const VideoGallery: React.FC = () => {
  const { profile, hasModeratorAccess } = useAuth();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [accessCode, setAccessCode] = useState('');
  const [hasGroupAccess, setHasGroupAccess] = useState(false);
  const { toast } = useToast();

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          id, video_id, name, description, video_link, streamable_url, streamable_shortcode,
          thumbnail_url, duration, expires_at, created_at, group_id,
          groups (name, access_code)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadVideos(), loadGroups()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleAccessCode = async () => {
    if (!accessCode.trim()) return;

    const group = groups.find(g => g.access_code === accessCode.trim());
    if (group) {
      setHasGroupAccess(true);
      setSelectedGroup(group.id);
      toast({
        title: "Access Granted",
        description: `Welcome to ${group.name}!`,
      });
    } else {
      toast({
        title: "Invalid Access Code",
        description: "Please check your access code and try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show access code input for non-moderator users without group access
  if (!hasModeratorAccess && !hasGroupAccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Video className="h-12 w-12 mx-auto text-primary mb-4" />
          <CardTitle>Enter Access Code</CardTitle>
          <CardDescription>Enter your group access code to view videos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter access code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAccessCode()}
          />
          <Button onClick={handleAccessCode} className="w-full">
            Access Videos
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (hasModeratorAccess) {
      return matchesSearch && (selectedGroup === 'all' || video.group_id === selectedGroup);
    }
    return matchesSearch && video.group_id === selectedGroup;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <Badge variant="secondary">{video.groups?.name || 'Unknown Group'}</Badge>
              <CardTitle className="text-lg line-clamp-2">{video.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Play className="h-8 w-8" />
              </div>
              <Button onClick={() => setSelectedVideo(video)} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Watch Video
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
};