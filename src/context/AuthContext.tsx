import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, type AuthUser } from '@/lib/api';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('leadloom_token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me(token);
        setUser(me);
      } catch (_error) {
        setToken(null);
        localStorage.removeItem('leadloom_token');
      } finally {
        setLoading(false);
      }
    }
    hydrate();
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      login: async (email, password) => {
        const result = await api.login(email, password);
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem('leadloom_token', result.token);
      },
      logout: () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('leadloom_token');
      },
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
