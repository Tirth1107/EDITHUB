import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAccess } from '@/contexts/AccessContext';
import { Video, Users, Settings, Plus, Trash2, Eye, Calendar } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [videoForm, setVideoForm] = useState({
    name: '',
    description: '',
    iframe_link: '',
    group_id: '',
    expires_at: '',
  });
  
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
  });
  
  const [clientForm, setClientForm] = useState({
    client_name: '',
    access_code: '',
    group_id: '',
  });

  const { role, accessCode } = useAccess();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosResult, groupsResult, clientsResult] = await Promise.all([
        supabase.from('videos').select('*, groups(name)').order('created_at', { ascending: false }),
        supabase.from('groups').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*, groups(name)').order('created_at', { ascending: false })
      ]);

      setVideos(videosResult.data || []);
      setGroups(groupsResult.data || []);
      setClients(clientsResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addVideo = async () => {
    if (!videoForm.name || !videoForm.iframe_link || !videoForm.group_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('videos')
        .insert({
          video_id: `video_${Date.now()}`,
          name: videoForm.name,
          description: videoForm.description || null,
          iframe_link: videoForm.iframe_link,
          group_id: videoForm.group_id,
          expires_at: videoForm.expires_at || null,
          added_by: accessCode,
        });

      if (error) throw error;

      toast({ title: "Success", description: "Video added successfully" });
      setVideoForm({ name: '', description: '', iframe_link: '', group_id: '', expires_at: '' });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add video",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add New Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Video name"
            value={videoForm.name}
            onChange={(e) => setVideoForm({ ...videoForm, name: e.target.value })}
          />
          <Input
            placeholder="Iframe link"
            value={videoForm.iframe_link}
            onChange={(e) => setVideoForm({ ...videoForm, iframe_link: e.target.value })}
          />
          <Select value={videoForm.group_id} onValueChange={(value) => setVideoForm({ ...videoForm, group_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addVideo} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};