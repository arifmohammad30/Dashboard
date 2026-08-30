import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.permissions)) {
          setUser(parsed);
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Failed to parse stored user:', err);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
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
      localStorage.removeItem('token');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (!response?.token || !response?.user) {
        throw new Error('Invalid response from authentication server');
      }

      const { token, user: userData } = response;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
