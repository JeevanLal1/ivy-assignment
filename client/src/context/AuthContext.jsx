import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.js';
import { getStoredAuth, refreshAccessToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(() => {
    const { accessToken, refreshToken, user: storedUser } = getStoredAuth();
    if (accessToken || refreshToken) {
      setUser(storedUser || { email: 'user@ivy.homes' });
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initAuth();

    // Listen for auth-expired events emitted by apiRequest when refresh fails
    const handleAuthExpired = () => {
      authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('ivy-auth-expired', handleAuthExpired);
    return () => window.removeEventListener('ivy-auth-expired', handleAuthExpired);
  }, [initAuth]);

  // Periodic check (every 2 minutes) to ensure token stays fresh if user is active
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const { expiresAt, refreshToken } = getStoredAuth();
      if (refreshToken && expiresAt && Date.now() > (expiresAt - 120000)) {
        try {
          await refreshAccessToken();
        } catch (err) {
          console.warn('Background token refresh failed:', err.message);
        }
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user || { email });
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
