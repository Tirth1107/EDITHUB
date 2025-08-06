import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, VideoIcon, Users, Settings, Trash2, Plus, ExternalLink } from 'lucide-react';

interface Video {
  id: string;
  name: string;
  description?: string;
  video_link: string;
  video_id: string;
  group_id: string;
  is_active: boolean;
  groups?: { name: string };
}

interface VideoGroup {
  id: string;
  name: string;
  access_code: string;
  description?: string;
}

export const AdminPanel: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [groups, setGroups] = useState<VideoGroup[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Video states
  const [videoName, setVideoName] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  
  // Group states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosResult, groupsResult] = await Promise.all([
        supabase.from('videos').select('*, groups(name)').order('created_at', { ascending: false }),
        supabase.from('groups').select('*').order('created_at', { ascending: false })
      ]);
      
      setVideos(videosResult.data || []);
      setGroups(groupsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const uploadVideo = async () => {
    if (!videoName || !videoLink || !selectedGroupId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('videos').insert({
        name: videoName,
        description: videoDescription,
        video_link: videoLink,
        video_id: `VID_${Date.now()}`,
        group_id: selectedGroupId,
      });

      if (error) throw error;
      
      setVideoName('');
      setVideoDescription('');
      setVideoLink('');
      setSelectedGroupId('');
      loadData();
      
      toast({ title: "Video Added", description: "Video uploaded successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload video.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createVideoGroup = async () => {
    if (!newGroupName || !newGroupCode) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('groups').insert({
        name: newGroupName,
        access_code: newGroupCode,
        description: newGroupDescription,
      });

      if (error) throw error;
      
      setNewGroupName('');
      setNewGroupCode('');
      setNewGroupDescription('');
      loadData();
      
      toast({ title: "Group Created", description: "Video group created successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create group.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Add New Video</CardTitle>
              <CardDescription>Add video links (YouTube, Vimeo, etc.)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Video name"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
              />
              <Input
                placeholder="Video link (iframe URL)"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
              />
              <Textarea
                placeholder="Description"
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
              />
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
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
              <Button onClick={uploadVideo} disabled={loading} className="w-full">
                {loading ? 'Adding...' : 'Add Video'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage Videos ({videos.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {videos.map(video => (
                <div key={video.id} className="flex justify-between items-center p-4 border rounded">
                  <div>
                    <h3 className="font-semibold">{video.name}</h3>
                    <p className="text-sm text-muted-foreground">{video.groups?.name}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(video.video_link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Create Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Input
                placeholder="Access code"
                value={newGroupCode}
                onChange={(e) => setNewGroupCode(e.target.value)}
              />
              <Textarea
                placeholder="Description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
              />
              <Button onClick={createVideoGroup} disabled={loading}>
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Groups ({groups.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groups.map(group => (
                <div key={group.id} className="p-4 border rounded">
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm">Code: {group.access_code}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings panel for admin configuration.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};