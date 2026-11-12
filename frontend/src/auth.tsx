import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, token, type Role, type User } from './api';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!token.get());

  useEffect(() => {
    if (!token.get()) return;
    api.me().then(setUser).catch(() => token.clear()).finally(() => setLoading(false));
  }, []);

  const login = async (u: string, p: string) => {
    const res = await api.login(u, p);
    token.set(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    token.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/scan" replace />;
  return <>{children}</>;
}
