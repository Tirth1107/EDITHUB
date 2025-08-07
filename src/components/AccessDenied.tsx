import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessDeniedProps {
  onLogin: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <CardTitle className="text-2xl">Access Pending</CardTitle>
          <CardDescription className="text-base">
            We are also waiting for your access to be approved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <AlertCircle className="w-5 h-5" />
              <span>Your account is currently under review</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="w-5 h-5" />
              <span>You'll be notified once access is granted</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Already have access credentials?
            </p>
            <Button variant="outline" onClick={onLogin} className="w-full">
              Try Login Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};