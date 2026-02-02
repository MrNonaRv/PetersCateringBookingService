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
import AdminGallery from "@/pages/admin/gallery";
import AdminCustomers from "@/pages/admin/customers";
import AdminRecentEvents from "@/pages/admin/recent-events";
import AdminMenu from "@/pages/admin/menu";
import AdminSettings from "@/pages/admin/settings";
import AdminQuotes from "@/pages/admin/quotes";
import AdminProfile from "@/pages/admin/profile";
import AdminAbout from "@/pages/admin/about";
import AdminPayments from "@/pages/admin/payments";
import PayDeposit from "./pages/pay-deposit";
import Login from "@/pages/login";
import Packages from "@/pages/packages";
import Terms from "@/pages/terms";
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
            <Route path="/packages" component={Packages} />
            <Route path="/terms" component={Terms} />
            <Route path="/pay-deposit" component={PayDeposit} />
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
            <Route path="/admin/gallery" component={() => 
              <ProtectedRoute>
                <AdminGallery />
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
            <Route path="/admin/menu" component={() => 
              <ProtectedRoute>
                <AdminMenu />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" component={() => 
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/about" component={() => 
              <ProtectedRoute>
                <AdminAbout />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" component={() => 
              <ProtectedRoute>
                <AdminProfile />
              </ProtectedRoute>
            } />
            <Route path="/admin/quotes" component={() => 
              <ProtectedRoute>
                <AdminQuotes />
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" component={() => 
              <ProtectedRoute>
                <AdminPayments />
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
