import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { AdminPanel } from '@/components/AdminPanel';
import { VideoGallery } from '@/components/VideoGallery';
import { AuthPage } from '@/components/AuthPage';
import { AccessDenied } from '@/components/AccessDenied';
import { LogOut, Settings, Shield, Users, Video } from 'lucide-react';

const AppContent = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, profile, loading, signOut, hasAdminAccess, hasModeratorAccess } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onSuccess={() => setShowAuthModal(false)} />;
  }

  // Show access denied if user doesn't have proper role access
  if (profile?.role === 'client' && !hasModeratorAccess) {
    return <AccessDenied onLogin={() => setShowAuthModal(true)} />;
  }

  const handleSignOut = async () => {
    await signOut();
    setShowAuthModal(false);
  };

  const getRoleIcon = () => {
    if (profile?.role === 'main_admin') return <Shield className="h-4 w-4 text-red-500" />;
    if (profile?.role === 'admin') return <Settings className="h-4 w-4 text-orange-500" />;
    if (profile?.role === 'moderator') return <Users className="h-4 w-4 text-blue-500" />;
    return <Video className="h-4 w-4 text-green-500" />;
  };

  const getRoleLabel = () => {
    switch (profile?.role) {
      case 'main_admin': return 'Main Admin';
      case 'admin': return 'Admin';
      case 'moderator': return 'Moderator';
      default: return 'Client';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              THE EDIT HUB
            </h1>
            <p className="text-sm text-muted-foreground">by UpSocial</p>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {profile?.display_name || user.email}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getRoleIcon()}
                  <span>{getRoleLabel()}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {hasAdminAccess ? <AdminPanel /> : <VideoGallery />}
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;