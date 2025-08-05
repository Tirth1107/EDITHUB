import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginModal } from '@/components/LoginModal';
import { AdminPanel } from '@/components/AdminPanel';
import { VideoGallery } from '@/components/VideoGallery';
import { Button } from '@/components/ui/button';
import { Video, Shield, LogOut } from 'lucide-react';

const AppContent = () => {
  const [showLogin, setShowLogin] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Video Portal
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-muted-foreground">
                  Welcome, {user.username}
                  {isAdmin && <Shield className="inline h-4 w-4 ml-1 text-warning" />}
                </span>
                <Button variant="ghost" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="glow" onClick={() => setShowLogin(true)}>
                Login / Access
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isAdmin ? (
          <AdminPanel />
        ) : (
          <VideoGallery />
        )}
      </main>

      <LoginModal open={showLogin} onOpenChange={setShowLogin} />
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
