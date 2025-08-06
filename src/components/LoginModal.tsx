import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Shield, Video, Lock } from 'lucide-react';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ open, onOpenChange }) => {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [adminCode, setAdminCode] = useState('');
  
  const { clientLogin, adminLogin } = useAuth();
  const { toast } = useToast();

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await clientLogin(clientId);
      if (success) {
        toast({
          title: "Login Successful",
          description: "Welcome! Access granted to your assigned videos.",
        });
        onOpenChange(false);
        setClientId('');
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid client ID. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const success = await adminLogin(adminCode);
      if (success) {
        toast({
          title: "Admin Access Granted",
          description: "Welcome to the admin panel!",
        });
        onOpenChange(false);
        setAdminCode('');
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid access code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during admin login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Video className="h-5 w-5 text-primary" />
            Video Access Portal
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="client" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="client" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Client Login
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin Access
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="client" className="space-y-4">
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type="text"
                  placeholder="Enter your client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Access Videos'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="admin" className="space-y-4">
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminCode">Admin Access Code</Label>
                <Input
                  id="adminCode"
                  type="password"
                  placeholder="Enter admin access code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Access Admin Panel'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};