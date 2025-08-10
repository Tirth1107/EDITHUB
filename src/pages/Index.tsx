import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Users, Settings, LogOut, Shield } from 'lucide-react';
import { VideoGallery } from '@/components/VideoGallery';
import { AdminPanel } from '@/components/AdminPanel';
import { AccessPage } from '@/components/AccessPage';
import { useAccess } from '@/contexts/AccessContext';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { isAuthenticated, role, loading, signOut } = useAccess();
  const { toast } = useToast();

  const handleSignOut = () => {
    signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Video className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AccessPage />;
  }

  const isAdmin = role === 'main_admin' || role === 'admin' || role === 'moderator';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">THE EDIT HUB</h1>
                <p className="text-sm text-muted-foreground">by UpSocial</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground capitalize">
                  {role?.replace('_', ' ')}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isAdmin ? (
          <Tabs defaultValue="videos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="videos">
                <Video className="w-4 h-4 mr-2" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="admin">
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </TabsTrigger>
              <TabsTrigger value="feedback">
                <Users className="w-4 h-4 mr-2" />
                Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
              <VideoGallery />
            </TabsContent>

            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>

            <TabsContent value="feedback">
              <Card>
                <CardHeader>
                  <CardTitle>Client Feedback</CardTitle>
                  <CardDescription>
                    View and manage client feedback on videos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Feedback management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Your Videos
                </CardTitle>
                <CardDescription>
                  Videos assigned to your group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoGallery />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;