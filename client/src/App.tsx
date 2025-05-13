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
import AdminCustomers from "@/pages/admin/customers";
import Login from "@/pages/login";
import { AuthProvider } from "@/components/providers/AuthProvider";

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
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/bookings" component={AdminBookings} />
            <Route path="/admin/services" component={AdminServices} />
            <Route path="/admin/customers" component={AdminCustomers} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
