import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual Supabase authentication
      // For now, simulate login
      const mockUser: User = {
        id: '1',
        email,
        username: email.split('@')[0],
        isAdmin: false
      };
      
      setUser(mockUser);
      localStorage.setItem('videoApp_user', JSON.stringify(mockUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const adminLogin = async (accessCode: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual database check
      // For now, check against default code
      if (accessCode === '7016565502') {
        const adminUser: User = {
          id: 'admin',
          email: 'admin@videoapp.com',
          username: 'admin',
          isAdmin: true
        };
        
        setUser(adminUser);
        localStorage.setItem('videoApp_user', JSON.stringify(adminUser));
        return true;
      }
      return false;
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
    login,
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