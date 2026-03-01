'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type User = {
  id: number;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [legacyAuto, setLegacyAuto] = useState(false);

  const refresh = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
        setLegacyAuto(Boolean(data.legacyAuto));
      } else {
        setUser(null);
        setLegacyAuto(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    refresh();
  }, []);

  // Auth guard - redirect based on auth status
  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login', '/signup', '/onboarding'];
    const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith('/api'));

    if (!user && !isPublicPath) {
      // Not logged in, redirect to login
      router.push('/login');
    } else if (user && (pathname === '/login' || pathname === '/signup')) {
      // If this is a legacy auto-session (no cookie, Alec compatibility),
      // allow staying on auth pages so family can still sign up/login.
      if (!legacyAuto) {
        router.push('/');
      }
    }
  }, [user, legacyAuto, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
