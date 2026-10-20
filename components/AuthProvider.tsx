'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'enterer';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: 'admin' | 'enterer' | null;
  isAdmin: boolean;
  isEnterer: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load session from server
    const loadSession = async () => {
      try {
        const { data } = await axios.get('/api/auth/me');
        setIsAuthenticated(true);
        setUser(data.user);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router, isLoading]);

  if (isLoading) {
    return null; // Or return a loading spinner
  }

  const login = (userData: AuthUser) => {
    setIsAuthenticated(true);
    setUser(userData);
    router.push('/ravisabha');
  };

  const logout = async () => {
    try {
      await axios.post('/api/logout');
    } catch (error) {
      // Ignore error, still logout on client
    }
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isEnterer = role === 'enterer';

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, role, isAdmin, isEnterer, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
