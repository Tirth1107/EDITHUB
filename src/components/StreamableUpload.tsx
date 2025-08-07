import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Calendar, Video } from 'lucide-react';

interface Group {
  id: string;
  name: string;
}

interface StreamableUploadProps {
  groups: Group[];
  onSuccess: () => void;
}

export const StreamableUpload: React.FC<StreamableUploadProps> = ({ groups, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    videoUrl: '',
    title: '',
    description: '',
    groupId: '',
    expiresInDays: ''
  });
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call our Streamable upload edge function
      const { data, error } = await supabase.functions.invoke('streamable-upload', {
        body: {
          videoUrl: formData.videoUrl,
          title: formData.title,
          description: formData.description,
          groupId: formData.groupId,
          expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : null
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Video Uploaded Successfully",
          description: `Video "${formData.title}" has been uploaded to Streamable and added to the database.`,
        });
        
        // Reset form
        setFormData({
          videoUrl: '',
          title: '',
          description: '',
          groupId: '',
          expiresInDays: ''
        });
        
        onSuccess();
      } else {
        throw new Error(data.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload to Streamable
        </CardTitle>
        <CardDescription>
          Upload a video URL to Streamable for secure streaming and storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL *</Label>
            <Input
              id="videoUrl"
              type="url"
              placeholder="https://example.com/video.mp4"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Video Title *</Label>
            <Input
              id="title"
              placeholder="Enter video title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter video description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">Assign to Group *</Label>
            <Select value={formData.groupId} onValueChange={(value) => setFormData({ ...formData, groupId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresInDays" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Auto-delete after (days)
            </Label>
            <Input
              id="expiresInDays"
              type="number"
              min="1"
              max="365"
              placeholder="Leave empty for permanent"
              value={formData.expiresInDays}
              onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !formData.videoUrl || !formData.title || !formData.groupId}
          >
            {loading ? (
              <>
                <Video className="mr-2 h-4 w-4 animate-spin" />
                Uploading to Streamable...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};