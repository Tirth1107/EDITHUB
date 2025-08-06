import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoPlayer } from './VideoPlayer';
import { useToast } from '@/hooks/use-toast';
import { Play, Lock, Search, Video as VideoIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Video {
  id: string;
  name: string;
  description?: string;
  video_link: string;
  video_id: string;
  group_id: string;
}

export const VideoGallery: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // If user is logged in via client login, automatically load their videos
    if (user && user.groupId) {
      loadVideos(user.groupId);
      setHasAccess(true);
    }
  }, [user]);

  useEffect(() => {
    // Set up realtime subscription for videos
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos'
        },
        (payload) => {
          console.log('Video update:', payload);
          // Reload videos if user has access
          if (hasAccess && user?.groupId) {
            loadVideos(user.groupId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasAccess, user?.groupId]);

  const loadVideos = async (groupId?: string) => {
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .eq('is_active', true);

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading videos:', error);
        toast({
          title: "Error",
          description: "Failed to load videos.",
          variant: "destructive",
        });
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const checkAccess = async () => {
    if (!accessCode) return;

    try {
      // Check if it's a group access code
      const { data: group, error } = await supabase
        .from('groups')
        .select('*')
        .eq('access_code', accessCode)
        .single();

      if (!error && group) {
        setHasAccess(true);
        loadVideos(group.id);
        toast({
          title: "Access Granted",
          description: `Welcome to ${group.name}!`,
        });
        return;
      }

      toast({
        title: "Access Denied",
        description: "Invalid access code. Please try again.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error checking access:', error);
      toast({
        title: "Error",
        description: "An error occurred while checking access.",
        variant: "destructive",
      });
    }
  };

  const filteredVideos = videos.filter(video =>
    video.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedVideo) {
    return (
      <VideoPlayer 
        video={selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
      />
    );
  }

  // If user is logged in but doesn't have group access, don't show access code form
  if (!hasAccess && !user) {
    return (
      <Card className="max-w-md mx-auto bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <Lock className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Enter Access Code</h2>
            <p className="text-muted-foreground">Enter a group access code to view videos</p>
          </div>
          <div className="space-y-4">
            <Input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter group access code"
              type="password"
            />
            <Button onClick={checkAccess} className="w-full" variant="glow">
              Access Videos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess && user && !user.groupId) {
    return (
      <Card className="max-w-md mx-auto bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <Lock className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">No Access</h2>
            <p className="text-muted-foreground">You don't have access to any video groups. Contact admin for access.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Video Library</h1>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search videos..." 
            className="w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <Card key={video.id} className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer">
            <CardContent className="p-4" onClick={() => setSelectedVideo(video)}>
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                <Play className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{video.name}</h3>
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <VideoIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Videos Found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'No videos match your search.' : 'No videos available in this group.'}
          </p>
        </div>
      )}
    </div>
  );
};