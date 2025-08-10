import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Video, MessageSquare, Play, Calendar } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { useAccess } from '@/contexts/AccessContext';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  video_id: string;
  name: string;
  description?: string;
  iframe_link: string;
  expires_at?: string;
  created_at: string;
  group_id: string;
  groups?: {
    name: string;
  };
}

interface Feedback {
  id: string;
  timestamp_seconds: number;
  comment: string;
  created_at: string;
}

export const VideoGallery: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { role, accessCode } = useAccess();
  const { toast } = useToast();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      let query = supabase
        .from('videos')
        .select(`
          *,
          groups (
            name
          )
        `)
        .eq('is_active', true);

      if (role === 'client' && accessCode) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('group_id')
          .eq('access_code', accessCode)
          .single();

        if (clientData?.group_id) {
          query = query.eq('group_id', clientData.group_id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const activeVideos = (data || []).filter(video => {
        if (!video.expires_at) return true;
        return new Date(video.expires_at) > new Date();
      });

      setVideos(activeVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('video_id', videoId)
        .order('timestamp_seconds', { ascending: true });

      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error loading feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Videos Available</h3>
          <p className="text-muted-foreground">
            {role === 'client' ? 'No videos have been assigned to your group yet.' : 'No videos have been uploaded yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{video.name}</CardTitle>
              <Badge variant="secondary">{video.groups?.name || 'Unknown Group'}</Badge>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {video.description}
                </p>
              )}
              
              <Button
                onClick={() => {
                  setSelectedVideo(video);
                  loadFeedback(video.id);
                }}
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Video
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          feedback={feedback}
          onClose={() => {
            setSelectedVideo(null);
            setFeedback([]);
          }}
          canAddFeedback={role === 'client'}
          onAddFeedback={(timestamp, comment) => {
            if (accessCode) {
              const timestampSeconds = parseInt(timestamp) || 0;
              supabase
                .from('feedback')
                .insert({
                  video_id: selectedVideo.id,
                  client_code: accessCode,
                  timestamp_seconds: timestampSeconds,
                  comment,
                })
                .then(() => {
                  loadFeedback(selectedVideo.id);
                  toast({
                    title: "Feedback Added",
                    description: "Your feedback has been recorded",
                  });
                });
            }
          }}
        />
      )}
    </div>
  );
};