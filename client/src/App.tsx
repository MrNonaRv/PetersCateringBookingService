import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminBookings from "@/pages/admin/bookings";
import AdminServices from "@/pages/admin/services";
import AdminServicePackages from "@/pages/admin/service-packages";
import AdminCustomers from "@/pages/admin/customers";
import AdminRecentEvents from "@/pages/admin/recent-events";
import Login from "@/pages/login";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

function App() {
  const [location] = useLocation();
  
  // Check if we're on an admin page
  const isAdminPage = location.startsWith("/admin");
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/login" component={Login} />
            <Route path="/admin" component={() => 
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" component={() => 
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" component={() => 
              <ProtectedRoute>
                <AdminBookings />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" component={() => 
              <ProtectedRoute>
                <AdminServices />
              </ProtectedRoute>
            } />
            <Route path="/admin/service-packages" component={() => 
              <ProtectedRoute>
                <AdminServicePackages />
              </ProtectedRoute>
            } />
            <Route path="/admin/customers" component={() => 
              <ProtectedRoute>
                <AdminCustomers />
              </ProtectedRoute>
            } />
            <Route path="/admin/recent-events" component={() => 
              <ProtectedRoute>
                <AdminRecentEvents />
              </ProtectedRoute>
            } />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
