import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authApi } from '../services/api';
import { onSessionExpired } from './sessionEvents';
import { clearStoredAccessToken, getStoredAccessToken, setStoredAccessToken } from './tokenStorage';
import type { LoginRequest, RegisterRequest, User } from '../types';

interface AuthContextValue {
  user: User | null;
  /** True while restoring a session from storage on app start. */
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = await getStoredAccessToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const currentUser = await authApi.getCurrentUser();
        if (!cancelled) setUser(currentUser);
      } catch {
        await clearStoredAccessToken();
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
    await setStoredAccessToken(response.accessToken);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await authApi.register(payload);
    await setStoredAccessToken(response.accessToken);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await clearStoredAccessToken();
    setUser(null);
  }, []);

  useEffect(() => onSessionExpired(() => logout()), [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isBootstrapping, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
