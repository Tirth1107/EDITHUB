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
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur"
              />
            </div>
            {hasModeratorAccess && (
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full md:w-48 bg-background/50 backdrop-blur">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {filteredVideos.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVideos.map((video) => {
          const expirationDate = video.expires_at ? new Date(video.expires_at) : null;
          const now = new Date();
          const daysLeft = expirationDate ? Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
          
          return (
            <Card key={video.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="secondary" className="mb-2">{video.groups?.name || 'Unknown Group'}</Badge>
                  {daysLeft !== null && (
                    <Badge 
                      variant={daysLeft <= 0 ? "destructive" : daysLeft <= 3 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2">{video.name}</CardTitle>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:from-primary/10 group-hover:to-primary/20 transition-all">
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Play className="h-12 w-12 text-primary/60" />
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(video.created_at).toLocaleDateString()}
                  </div>
                  {video.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
                
                <Button onClick={() => setSelectedVideo(video)} className="w-full group-hover:shadow-md transition-shadow">
                  <Eye className="h-4 w-4 mr-2" />
                  Watch Video
                </Button>
              </CardContent>
            </Card>
          );
        })}
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