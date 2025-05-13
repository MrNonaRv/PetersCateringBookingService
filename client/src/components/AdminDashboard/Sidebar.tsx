import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  currentPage: string;
}

export default function Sidebar({ collapsed, currentPage }: SidebarProps) {
  const { logout } = useAuth();
  const [location, setLocation] = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/admin' && currentPage === 'dashboard') {
      return true;
    }
    return location === path;
  };
  
  return (
    <div className={cn(
      "bg-primary text-white shadow-lg transition-all duration-300 ease-in-out h-screen",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-white border-opacity-20">
        <h2 className={cn(
          "font-heading font-bold transition-all duration-300 ease-in-out",
          collapsed ? "text-xs text-center" : "text-xl"
        )}>
          {collapsed ? "PCC" : "Admin Dashboard"}
        </h2>
        {!collapsed && (
          <p className="text-sm text-white text-opacity-70">Peter's Creation Catering</p>
        )}
      </div>
      
      <nav className="mt-4">
        <div className={cn(
          "px-4 py-2 text-sm text-white text-opacity-70 uppercase",
          collapsed && "text-center"
        )}>
          {collapsed ? "Main" : "Main"}
        </div>
        
        <Link href="/admin/dashboard">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/dashboard') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-home mr-3"></i>
            {!collapsed && <span>Dashboard</span>}
          </a>
        </Link>
        
        <Link href="/admin/bookings">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/bookings') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-calendar-alt mr-3"></i>
            {!collapsed && <span>Bookings</span>}
          </a>
        </Link>
        
        <Link href="/admin/customers">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/customers') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-users mr-3"></i>
            {!collapsed && <span>Customers</span>}
          </a>
        </Link>
        
        <Link href="/admin/services">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/services') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-utensils mr-3"></i>
            {!collapsed && <span>Services</span>}
          </a>
        </Link>
        
        <div className={cn(
          "mt-4 px-4 py-2 text-sm text-white text-opacity-70 uppercase",
          collapsed && "text-center"
        )}>
          {collapsed ? "Opts" : "Settings"}
        </div>
        
        <a className="flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition cursor-pointer">
          <i className="fas fa-user-circle mr-3"></i>
          {!collapsed && <span>Profile</span>}
        </a>
        
        <a className="flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition cursor-pointer">
          <i className="fas fa-cog mr-3"></i>
          {!collapsed && <span>Settings</span>}
        </a>
        
        <a 
          className="flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition cursor-pointer"
          onClick={() => logout()}
        >
          <i className="fas fa-sign-out-alt mr-3"></i>
          {!collapsed && <span>Logout</span>}
        </a>
      </nav>
    </div>
  );
}
