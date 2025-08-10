import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AccessContextType {
  accessCode: string | null;
  role: 'main_admin' | 'admin' | 'moderator' | 'client' | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (code: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export const useAccess = (): AccessContextType => {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
};

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [role, setRole] = useState<'main_admin' | 'admin' | 'moderator' | 'client' | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(accessCode && role);

  useEffect(() => {
    // Check for stored access code on app start
    const storedCode = localStorage.getItem('access_code');
    const storedRole = localStorage.getItem('access_role') as typeof role;
    
    if (storedCode && storedRole) {
      setAccessCode(storedCode);
      setRole(storedRole);
    }
    
    setLoading(false);
  }, []);

  const signIn = async (code: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Check access_codes table first
      const { data: accessData, error: accessError } = await supabase
        .from('access_codes')
        .select('role, is_active')
        .eq('code', code)
        .maybeSingle();

      if (accessError) {
        throw new Error('Database error occurred');
      }

      if (accessData && accessData.is_active) {
        // Valid access code found
        setAccessCode(code);
        setRole(accessData.role);
        localStorage.setItem('access_code', code);
        localStorage.setItem('access_role', accessData.role);
        setLoading(false);
        return { success: true };
      }

      // Check clients table for client codes
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('client_name, is_active')
        .eq('access_code', code)
        .maybeSingle();

      if (clientError) {
        throw new Error('Database error occurred');
      }

      if (clientData && clientData.is_active) {
        // Valid client code found
        setAccessCode(code);
        setRole('client');
        localStorage.setItem('access_code', code);
        localStorage.setItem('access_role', 'client');
        setLoading(false);
        return { success: true };
      }

      // No valid code found
      setLoading(false);
      return { success: false, error: 'Invalid access code' };

    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message || 'Authentication failed' };
    }
  };

  const signOut = () => {
    setAccessCode(null);
    setRole(null);
    localStorage.removeItem('access_code');
    localStorage.removeItem('access_role');
  };

  const value: AccessContextType = {
    accessCode,
    role,
    isAuthenticated,
    loading,
    signIn,
    signOut,
  };

  return (
    <AccessContext.Provider value={value}>
      {children}
    </AccessContext.Provider>
  );
};