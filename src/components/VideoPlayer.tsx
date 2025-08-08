import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Calendar, Clock, ExternalLink, Download } from 'lucide-react';

interface Video {
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

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getExpirationStatus = () => {
    if (!video.expires_at) return null;
    const expirationDate = new Date(video.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return { status: 'expired', text: 'Expired', variant: 'destructive' as const };
    if (daysLeft <= 1) return { status: 'expiring', text: `Expires today`, variant: 'destructive' as const };
    if (daysLeft <= 3) return { status: 'warning', text: `${daysLeft} days left`, variant: 'secondary' as const };
    return { status: 'active', text: `${daysLeft} days left`, variant: 'outline' as const };
  };

  const expirationStatus = getExpirationStatus();
  const videoSrc = video.streamable_url || video.video_link;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-semibold pr-8">{video.name}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{video.groups?.name || 'Unknown Group'}</Badge>
            {expirationStatus && (
              <Badge variant={expirationStatus.variant}>
                <Clock className="w-3 h-3 mr-1" />
                {expirationStatus.text}
              </Badge>
            )}
            {video.duration && (
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(video.duration)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {video.streamable_shortcode ? (
                  <iframe
                    src={`https://streamable.com/e/${video.streamable_shortcode}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : videoSrc ? (
                  <video
                    controls
                    className="w-full h-full"
                    poster={video.thumbnail_url}
                  >
                    <source src={videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <p>Video not available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video Details */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {video.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-muted-foreground">{video.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(video.created_at)}</span>
                  </div>
                  
                  {video.expires_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Expires:</span>
                      <span>{formatDate(video.expires_at)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  {videoSrc && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={videoSrc} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in New Tab
                      </a>
                    </Button>
                  )}
                  {videoSrc && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={videoSrc} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};