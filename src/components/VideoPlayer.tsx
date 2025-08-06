import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, Volume2, MessageSquare, Send, X } from 'lucide-react';

interface Video {
  id: string;
  name: string;
  description?: string;
  video_link: string;
  video_id: string;
  // Legacy support
  title?: string;
  file_url?: string;
  thumbnail_url?: string;
  duration?: number;
}

interface Feedback {
  id: string;
  feedback_text: string;
  timestamp_seconds: number;
  user_name?: string;
  user_email?: string;
  created_at: string;
}

interface VideoPlayerProps {
  video: Video;
  onClose?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Error",
        description: "Please enter feedback text.",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Replace with actual Supabase call
      const newFeedback: Feedback = {
        id: Math.random().toString(),
        feedback_text: feedbackText,
        timestamp_seconds: currentTime,
        user_name: userName || 'Anonymous',
        user_email: userEmail,
        created_at: new Date().toISOString(),
      };

      setFeedbacks(prev => [...prev, newFeedback]);
      setFeedbackText('');
      
      toast({
        title: "Feedback Submitted",
        description: `Feedback added at ${formatTime(currentTime)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback.",
        variant: "destructive",
      });
    }
  };

  const jumpToFeedback = (timestamp: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = timestamp;
    setCurrentTime(timestamp);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-card border-border">
        <CardContent className="p-0">
          <div className="relative">
            {/* Use iframe for video links */}
            <iframe
              className="w-full aspect-video bg-black"
              src={video.video_link || video.file_url}
              title={video.name || video.title}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-primary"
                />
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlay}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isFullscreen && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFeedback(!showFeedback)}
                        className="text-white hover:bg-white/20"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                    {onClose && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white hover:bg-white/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">{video.name || video.title}</h2>
        {video.description && (
          <p className="text-muted-foreground">{video.description}</p>
        )}
      </div>

      {/* Feedback Section - Only show when not in fullscreen */}
      {showFeedback && !isFullscreen && (
        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Add Feedback at {formatTime(currentTime)}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name (Optional)</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email (Optional)</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Enter your feedback about this moment in the video..."
                rows={3}
              />
            </div>
            
            <Button onClick={submitFeedback} className="w-full" variant="glow">
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
            
            {/* Existing Feedbacks */}
            {feedbacks.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Video Feedback</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {feedbacks.map((feedback) => (
                    <Card key={feedback.id} className="bg-muted/50 border-border">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-foreground">{feedback.feedback_text}</p>
                            <p className="text-xs text-muted-foreground">
                              By {feedback.user_name || 'Anonymous'} • {new Date(feedback.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => jumpToFeedback(feedback.timestamp_seconds)}
                            className="text-primary hover:bg-primary/20"
                          >
                            {formatTime(feedback.timestamp_seconds)}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
