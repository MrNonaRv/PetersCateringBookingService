import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";

// Use this for routes that require authentication
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}

// Redirect if already authenticated (for login page)
export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect to admin dashboard if already authenticated
      setLocation("/admin/dashboard");
    }
  }, [isAuthenticated, isLoading, setLocation]);
  
  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Only render children if not authenticated
  return !isAuthenticated ? <>{children}</> : null;
}