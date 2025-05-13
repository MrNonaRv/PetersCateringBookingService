import React, { createContext, useState, useContext, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  
  const { isLoading, data } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (!res.ok) {
          return null;
        }
        
        const data = await res.json();
        return data.user;
      } catch (error) {
        return null;
      }
    },
    retry: false
  });
  
  // Update user when data changes
  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);
  
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await res.json();
      return data.user;
    },
    onSuccess: (userData) => {
      setUser(userData);
      setLocation('/admin/dashboard');
    }
  });
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout', {});
    },
    onSuccess: () => {
      setUser(null);
      setLocation('/login');
    }
  });
  
  const login = async (username: string, password: string) => {
    return loginMutation.mutateAsync({ username, password });
  };
  
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout
      }}>
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