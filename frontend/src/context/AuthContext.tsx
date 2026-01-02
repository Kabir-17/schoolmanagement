import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, LoginCredentials, PasswordChangeCredentials } from '../types/auth.types';
import { authApi } from '@/services';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);

  useEffect(() => {
    // Check if user is logged in on app start by calling verify endpoint
    checkExistingAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkExistingAuth = async () => {
    try {
      // Since we're using HTTP-only cookies, we can't access the token directly
      // Instead, we call the verify endpoint which will check the cookie
      const response = await authApi.verify();
      
      if (response.data.success && response.data.data) {
        const { user: userData, requiresPasswordChange: needsPasswordChange } = response.data.data;
        setUser(userData);
        setRequiresPasswordChange(needsPasswordChange || false);
      } else {
        clearAuthData();
      }
    } catch (error: any) {
      // Handle different types of errors
      if (error.code === 'ERR_NETWORK') {
        console.warn('Network error during auth check - server may be unavailable');
      } else if (error.response?.status === 401) {
        console.info('No existing auth session found');
        
      } else if (error.response?.status === 429) {
        console.warn('Rate limited during auth check - will retry');
        // Don't clear auth data for rate limiting, just log
      } else {
        console.error('Error checking existing auth:', error);
      }
      
      // Only clear auth data for non-network errors
      if (error.code !== 'ERR_NETWORK' && error.response?.status !== 429) {
        clearAuthData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    setUser(null);
    setRequiresPasswordChange(false);
    // No need to clear localStorage/sessionStorage since we're using cookies
  };

  const login = async (credentials: LoginCredentials): Promise<{success: boolean; requiresPasswordChange?: boolean}> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials.username, credentials.password);

      if (response.data.success && response.data.data) {
        const { user: userData, requiresPasswordChange: needsPasswordChange } = response.data.data;

        setUser(userData);
        setRequiresPasswordChange(needsPasswordChange || false);

        return { 
          success: true, 
          requiresPasswordChange: needsPasswordChange 
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (credentials: PasswordChangeCredentials): Promise<boolean> => {
    try {
      const response = await authApi.forcePasswordChange(credentials.newPassword);
      
      if (response.data.success) {
        // Update the requiresPasswordChange flag
        setRequiresPasswordChange(false);
        
        // Update user's isFirstLogin if present
        if (user) {
          setUser({
            ...user,
            isFirstLogin: false,
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint to clear HTTP-only cookie
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state regardless of API call success
      clearAuthData();
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    requiresPasswordChange,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};