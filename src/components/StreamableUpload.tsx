import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Calendar, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Group {
  id: string;
  name: string;
  access_code: string;
  description?: string;
}

interface StreamableUploadProps {
  groups: Group[];
  onVideoUploaded: () => void;
  onClose: () => void;
}

export const StreamableUpload: React.FC<StreamableUploadProps> = ({ 
  groups, 
  onVideoUploaded, 
  onClose 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    groupId: '',
    expiryDays: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.type.startsWith('video/')) {
        setError('Please select a valid video file');
        return;
      }
      
      // Check file size (100MB limit)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a video file');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Please enter a video name');
      return;
    }
    
    if (!formData.groupId) {
      setError('Please select a group');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Call Streamable upload edge function
      const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
        'streamable-upload',
        {
          body: uploadData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;
      if (!uploadResult?.shortcode) throw new Error('Upload failed - no shortcode received');

      // Calculate expiration date
      let expiresAt = null;
      if (formData.expiryDays) {
        const days = parseInt(formData.expiryDays);
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);
        expiresAt = expirationDate.toISOString();
      }

      // Save video metadata to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          video_id: uploadResult.shortcode,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          video_link: uploadResult.url,
          streamable_url: uploadResult.url,
          streamable_shortcode: uploadResult.shortcode,
          thumbnail_url: uploadResult.thumbnail_url,
          duration: uploadResult.duration,
          group_id: formData.groupId,
          expires_at: expiresAt,
        });

      if (dbError) throw dbError;

      setSuccess(true);
      toast({
        title: "Video Uploaded Successfully",
        description: "Your video has been uploaded and is now available in the gallery.",
      });

      // Reset form
      setFormData({ name: '', description: '', groupId: '', expiryDays: '' });
      setFile(null);
      setUploadProgress(0);
      
      // Refresh video list
      onVideoUploaded();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload video. Please try again.');
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload Successful!</h3>
          <p className="text-muted-foreground">Your video has been uploaded to Streamable and saved to THE EDIT HUB.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Video to Streamable
            </CardTitle>
            <CardDescription>
              Upload videos to Streamable for secure streaming and storage
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-file">Video File</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('video-file')?.click()}
                className="mb-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Video File
              </Button>
              {file ? (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a video file (max 100MB)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video-name">Video Name *</Label>
              <Input
                id="video-name"
                placeholder="Enter video name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-select">Group *</Label>
              <Select value={formData.groupId} onValueChange={(value) => setFormData({ ...formData, groupId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-description">Description (Optional)</Label>
            <Textarea
              id="video-description"
              placeholder="Enter video description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-days">Auto-Delete After (Optional)</Label>
            <Select value={formData.expiryDays} onValueChange={(value) => setFormData({ ...formData, expiryDays: value })}>
              <SelectTrigger>
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select expiry period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Never expires</SelectItem>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="14">2 weeks</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
                <SelectItem value="90">3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading to Streamable...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!file || uploading} className="flex-1">
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};