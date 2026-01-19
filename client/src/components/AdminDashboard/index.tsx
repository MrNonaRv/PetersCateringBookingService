import { useState } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import OverviewCards from "./OverviewCards";
import BookingCalendar from "./BookingCalendar";
import BookingsTable from "./BookingsTable";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ServicesManagement from "./ServicesManagement";
import ServicePackageManagement from "./ServicePackageManagement";
import GalleryManagement from "./GalleryManagement";
import CustomersManagement from "./CustomersManagement";
import { RecentEventsManagement } from "./RecentEventsManagement";
import AdminMenu from "@/pages/admin/menu";
import PaymentSettingsManagement from "./PaymentSettingsManagement";
import CustomQuotesManagement from "./CustomQuotesManagement";

interface AdminDashboardProps {
  currentPage: string;
}

export default function AdminDashboard({ currentPage }: AdminDashboardProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Render dashboard content based on current page
  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <>
            <OverviewCards />
            
            <div className="grid grid-cols-1 gap-6 mt-6">
              <Card>
                <CardHeader className="px-6 py-4 border-b">
                  <CardTitle className="text-lg font-medium">Booking Calendar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <BookingCalendar />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="px-6 py-4 border-b flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">Recent Bookings</CardTitle>
                  <a href="/admin/bookings" className="text-primary hover:text-secondary transition text-sm">View All</a>
                </CardHeader>
                <CardContent className="p-0">
                  <BookingsTable limit={5} />
                </CardContent>
              </Card>
            </div>
          </>
        );
      
      case "bookings":
        return (
          <Card>
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-lg font-medium">All Bookings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <BookingsTable />
            </CardContent>
          </Card>
        );
      
      case "services":
        return <ServicesManagement />;
      
      case "service-packages":
        return <ServicePackageManagement />;
      
      case "gallery":
        return <GalleryManagement />;
      
      case "customers":
        return <CustomersManagement />;
      
      case "recent-events":
        return <RecentEventsManagement />;

      case "menu":
        return <AdminMenu />;

      case "settings":
        return <PaymentSettingsManagement />;

      case "quotes":
        return <CustomQuotesManagement />;

      default:
        return <div>404 - Page not found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar collapsed={isSidebarCollapsed} currentPage={currentPage} />
      
      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Top Navigation */}
        <TopNav 
          toggleSidebar={toggleSidebar} 
          user={user} 
          title={
            currentPage === "dashboard" ? "Dashboard" : 
            currentPage === "bookings" ? "Booking Management" : 
            currentPage === "services" ? "Services Management" : 
            currentPage === "customers" ? "Customer Management" : 
            "Admin Panel"
          } 
        />
        
        {/* Dashboard Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
