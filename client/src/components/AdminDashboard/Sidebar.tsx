import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoImage from "@assets/logo.png_1755745222226.jpeg";

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
      "bg-primary text-white shadow-lg transition-all duration-300 ease-in-out h-screen sticky top-0",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-white border-opacity-20">
        {collapsed ? (
          <div className="flex justify-center">
            <img 
              src={logoImage} 
              alt="Peter's Creation Logo" 
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </div>
        ) : (
          <div className="flex items-center">
            <img 
              src={logoImage} 
              alt="Peter's Creation Logo" 
              className="h-10 w-auto mr-3 object-contain brightness-0 invert"
            />
            <div>
              <h2 className="font-heading font-bold text-xl">Admin Dashboard</h2>
              <p className="text-sm text-white text-opacity-70">Peter's Creation Catering</p>
            </div>
          </div>
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

        <Link href="/admin/service-packages">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/service-packages') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-box mr-3"></i>
            {!collapsed && <span>Packages</span>}
          </a>
        </Link>

        <Link href="/admin/gallery">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/gallery') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-images mr-3"></i>
            {!collapsed && <span>Gallery</span>}
          </a>
        </Link>

        <Link href="/admin/about">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/about') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-info-circle mr-3"></i>
            {!collapsed && <span>About Image</span>}
          </a>
        </Link>

        <Link href="/admin/recent-events">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/recent-events') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-images mr-3"></i>
            {!collapsed && <span>Recent Events</span>}
          </a>
        </Link>

        <Link href="/admin/quotes">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition",
            isActive('/admin/quotes') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-file-alt mr-3"></i>
            {!collapsed && <span>Custom Quotes</span>}
          </a>
        </Link>

        <Link href="/admin/menu">
          <div className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition cursor-pointer",
            isActive('/admin/menu') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-utensils mr-3"></i>
            {!collapsed && <span>Menu Category</span>}
          </div>
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

        <Link href="/admin/settings">
          <a className={cn(
            "flex items-center px-4 py-2 hover:bg-white hover:bg-opacity-10 transition cursor-pointer",
            isActive('/admin/settings') && "bg-white bg-opacity-10"
          )}>
            <i className="fas fa-cog mr-3"></i>
            {!collapsed && <span>Payment Settings</span>}
          </a>
        </Link>

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
