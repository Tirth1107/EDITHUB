import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Trash2, 
  Edit, 
  Settings, 
  Users, 
  Video, 
  Shield,
  Plus,
  Eye,
  Lock
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  group_id: string;
  duration?: number;
  file_size?: number;
  created_at: string;
}

interface VideoGroup {
  id: string;
  name: string;
  access_code: string;
  description?: string;
  video_count: number;
}

export const AdminPanel: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [videoGroups, setVideoGroups] = useState<VideoGroup[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [adminAccessCode, setAdminAccessCode] = useState('7016565502');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Video Upload Form State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        // Auto-generate title from filename if empty
        if (!videoTitle) {
          setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a video file.",
          variant: "destructive",
        });
      }
    }
  };

  const uploadVideo = async () => {
    if (!selectedFile || !videoTitle || !selectedGroupId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // TODO: Replace with actual Supabase upload
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newVideo: Video = {
        id: Math.random().toString(),
        title: videoTitle,
        description: videoDescription,
        file_url: URL.createObjectURL(selectedFile),
        group_id: selectedGroupId,
        file_size: selectedFile.size,
        created_at: new Date().toISOString(),
      };

      setVideos(prev => [...prev, newVideo]);
      
      // Reset form
      setVideoTitle('');
      setVideoDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast({
        title: "Upload Successful",
        description: "Video has been uploaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const createVideoGroup = async () => {
    if (!newGroupName || !newGroupCode) {
      toast({
        title: "Missing Information",
        description: "Please enter group name and access code.",
        variant: "destructive",
      });
      return;
    }

    try {
      // TODO: Replace with actual Supabase call
      const newGroup: VideoGroup = {
        id: Math.random().toString(),
        name: newGroupName,
        access_code: newGroupCode,
        description: newGroupDescription,
        video_count: 0,
      };

      setVideoGroups(prev => [...prev, newGroup]);
      
      // Reset form
      setNewGroupName('');
      setNewGroupCode('');
      setNewGroupDescription('');

      toast({
        title: "Group Created",
        description: "Video group has been created successfully!",
      });
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create video group.",
        variant: "destructive",
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      // TODO: Replace with actual Supabase call
      setVideos(prev => prev.filter(v => v.id !== videoId));
      
      toast({
        title: "Video Deleted",
        description: "Video has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  const updateAccessCode = async () => {
    try {
      // TODO: Replace with actual Supabase call
      toast({
        title: "Access Code Updated",
        description: "Admin access code has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update access code.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-warning/10 to-warning/5 border-warning/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <Shield className="h-6 w-6" />
            Admin Control Panel
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload New Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoFile">Video File</Label>
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="videoTitle">Video Title *</Label>
                  <Input
                    id="videoTitle"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter video title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupSelect">Video Group *</Label>
                  <select
                    id="groupSelect"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  >
                    <option value="">Select a group</option>
                    {videoGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name} (Code: {group.access_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoDescription">Description</Label>
                <Textarea
                  id="videoDescription"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Enter video description (optional)"
                  rows={3}
                />
              </div>

              <Button
                onClick={uploadVideo}
                disabled={uploading}
                className="w-full"
                variant="glow"
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Manage Videos</CardTitle>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No videos uploaded yet. Upload your first video!
                </p>
              ) : (
                <div className="space-y-4">
                  {videos.map(video => (
                    <Card key={video.id} className="bg-muted/50 border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-foreground">{video.title}</h3>
                            {video.description && (
                              <p className="text-sm text-muted-foreground">{video.description}</p>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Group: {videoGroups.find(g => g.id === video.group_id)?.name || 'Unknown'}</span>
                              {video.file_size && <span>Size: {formatFileSize(video.file_size)}</span>}
                              <span>Uploaded: {new Date(video.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteVideo(video.id)}
                              className="text-destructive hover:bg-destructive/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create New Video Group
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name *</Label>
                  <Input
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupCode">Access Code *</Label>
                  <Input
                    id="groupCode"
                    value={newGroupCode}
                    onChange={(e) => setNewGroupCode(e.target.value)}
                    placeholder="Enter access code"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDescription">Description</Label>
                <Textarea
                  id="groupDescription"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Enter group description (optional)"
                  rows={3}
                />
              </div>
              <Button onClick={createVideoGroup} variant="glow" className="w-full">
                Create Group
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Existing Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {videoGroups.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No groups created yet. Create your first group!
                </p>
              ) : (
                <div className="space-y-4">
                  {videoGroups.map(group => (
                    <Card key={group.id} className="bg-muted/50 border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold text-foreground">{group.name}</h3>
                            {group.description && (
                              <p className="text-sm text-muted-foreground">{group.description}</p>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Code: {group.access_code}
                              </span>
                              <span>{group.video_count} videos</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:bg-destructive/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-warning" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminCode">Admin Access Code</Label>
                <Input
                  id="adminCode"
                  type="password"
                  value={adminAccessCode}
                  onChange={(e) => setAdminAccessCode(e.target.value)}
                  placeholder="Enter new admin access code"
                />
              </div>
              <Button onClick={updateAccessCode} variant="admin">
                Update Access Code
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};