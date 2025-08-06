import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email?: string;
  username: string;
  isAdmin: boolean;
  groupId?: string;
}

interface AuthContextType {
  user: User | null;
  clientLogin: (clientId: string) => Promise<boolean>;
  adminLogin: (accessCode: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('videoApp_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const clientLogin = async (clientId: string): Promise<boolean> => {
    try {
      const { data: client, error } = await supabase
        .from('clients')
        .select('*, groups(*)')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (error || !client) {
        console.error('Client login error:', error);
        return false;
      }

      const clientUser: User = {
        id: client.id,
        username: client.client_name,
        isAdmin: false,
        groupId: client.group_id
      };
      
      setUser(clientUser);
      localStorage.setItem('videoApp_user', JSON.stringify(clientUser));
      return true;
    } catch (error) {
      console.error('Client login error:', error);
      return false;
    }
  };

  const adminLogin = async (accessCode: string): Promise<boolean> => {
    try {
      const { data: adminCode, error } = await supabase
        .from('admin_codes')
        .select('*')
        .eq('code', accessCode)
        .eq('is_active', true)
        .single();

      if (error || !adminCode) {
        console.error('Admin login error:', error);
        return false;
      }

      const adminUser: User = {
        id: 'admin',
        username: 'Administrator',
        isAdmin: true
      };
      
      setUser(adminUser);
      localStorage.setItem('videoApp_user', JSON.stringify(adminUser));
      return true;
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('videoApp_user');
  };

  const value: AuthContextType = {
    user,
    clientLogin,
    adminLogin,
    logout,
    isAdmin: user?.isAdmin || false,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};