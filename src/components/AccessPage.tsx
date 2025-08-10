import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Video, Lock, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccess } from '@/contexts/AccessContext';

export const AccessPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  
  const { signIn } = useAccess();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter an access code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await signIn(code.trim());
      
      if (result.success) {
        toast({
          title: "Access Granted",
          description: "Welcome to THE EDIT HUB!",
        });
        window.location.href = '/';
      } else {
        setError(result.error || "Invalid access code");
        toast({
          title: "Access Denied",
          description: result.error || "Invalid access code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setError(error.message || "Something went wrong");
      toast({
        title: "Access Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              THE EDIT HUB
            </CardTitle>
            <CardDescription className="text-base mt-2">by UpSocial</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-sm font-medium">
                Enter Your Access Code
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="accessCode"
                  type="text"
                  placeholder="Enter access code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="pl-10 text-center font-mono text-lg"
                  required
                  autoComplete="off"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
              {loading ? 'Verifying...' : 'Access THE EDIT HUB'}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an access code?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              "We're also waiting for your access."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};