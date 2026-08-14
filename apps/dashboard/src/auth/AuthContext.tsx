'use client';

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authApi } from '../services/api';
import { onSessionExpired } from './sessionEvents';
import { clearStoredAccessToken, getStoredAccessToken, setStoredAccessToken } from './tokenStorage';
import type { LoginRequest, User } from '../types';

interface AuthContextValue {
  user: User | null;
  /** True while restoring a session from storage on first load. */
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getStoredAccessToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const currentUser = await authApi.getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        clearStoredAccessToken();
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authApi.login(payload);
    setStoredAccessToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearStoredAccessToken();
    setUser(null);
  }, []);

  useEffect(() => onSessionExpired(logout), [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, isBootstrapping, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
