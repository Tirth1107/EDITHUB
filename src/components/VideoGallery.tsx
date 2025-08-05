import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VideoPlayer } from './VideoPlayer';
import { useToast } from '@/hooks/use-toast';
import { Play, Lock, Search } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  thumbnail_url?: string;
  group_id: string;
}

export const VideoGallery: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const { toast } = useToast();

  const checkAccess = () => {
    // TODO: Replace with actual database check
    if (accessCode) {
      setHasAccess(true);
      // Mock videos for demo
      setVideos([
        {
          id: '1',
          title: 'Sample Video 1',
          description: 'A sample video for demonstration',
          file_url: '/sample-video.mp4',
          group_id: '1'
        }
      ]);
      toast({
        title: "Access Granted",
        description: "You now have access to the video library.",
      });
    }
  };

  if (selectedVideo) {
    return (
      <VideoPlayer 
        video={selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
      />
    );
  }

  if (!hasAccess) {
    return (
      <Card className="max-w-md mx-auto bg-card border-border">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <Lock className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Enter Access Code</h2>
            <p className="text-muted-foreground">Enter your access code to view videos</p>
          </div>
          <div className="space-y-4">
            <Input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Enter access code"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Video Library</h1>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search videos..." className="w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => (
          <Card key={video.id} className="bg-card border-border hover:bg-card/80 transition-colors cursor-pointer">
            <CardContent className="p-4" onClick={() => setSelectedVideo(video)}>
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                <Play className="h-12 w-12 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{video.title}</h3>
              {video.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};