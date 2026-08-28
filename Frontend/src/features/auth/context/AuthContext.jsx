import React, { createContext, useContext, useState, useEffect } from 'react';
import { mapBackendUserToAuthUser, DEV_MOCK_USER } from '../utils/authAdapter';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Load persisted user or initialize development mock user
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const mapped = mapBackendUserToAuthUser(parsed);
        setUser(mapped);
      } else {
        // In local development mode, if no user is saved, initialize dev mock user
        const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
        if (isDev) {
          const devUser = mapBackendUserToAuthUser(DEV_MOCK_USER);
          setUser(devUser);
          localStorage.setItem('user', JSON.stringify(devUser));
        }
      }
    } catch (err) {
      console.error('[AuthContext] Failed to parse stored user:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for global 401 Unauthorized events from apiClient
  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      console.warn('[AuthContext] Global 401 Unauthorized event received. Clearing auth state.');
      setUser(null);
      localStorage.removeItem('user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      // Create backend user response payload structure
      const rawBackendUser = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'Fleet Operator',
        permissions: DEV_MOCK_USER.permissions,
      };

      const mappedUser = mapBackendUserToAuthUser(rawBackendUser);
      setUser(mappedUser);
      localStorage.setItem('user', JSON.stringify(mappedUser));
      return mappedUser;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Helper for testing/dev: dynamically set permissions on auth user
  const setAuthPermissions = (newPermissions) => {
    if (!user) return;
    const updated = {
      ...user,
      permissions: Array.isArray(newPermissions) ? newPermissions : [],
    };
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        setAuthPermissions,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
