import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, Search, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface TopNavProps {
  toggleSidebar: () => void;
  user: any;
  title: string;
}

export default function TopNav({ toggleSidebar, user, title }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { logout } = useAuth();
  const { data: bookings = [] } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = encodeURIComponent(searchQuery.trim());
    if (q) {
      window.location.href = `/admin/bookings?q=${q}`;
    }
  };

  // Get initials from user name
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-4">
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-medium">{title}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center font-medium text-[10px] bg-[#e74c3c]">
                  {
                    (() => {
                      const pending = bookings.filter((b: any) => b.status === 'pending_approval').length;
                      const upcoming = bookings.filter((b: any) => {
                        const d = new Date(b.eventDate);
                        const now = new Date();
                        const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                        return diff >= 0 && diff <= 7;
                      }).length;
                      return String(pending + upcoming);
                    })()
                  }
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                ...bookings
                  .filter((b: any) => b.status === 'pending_approval')
                  .slice(0, 3)
                  .map((b: any) => ({
                    type: 'Pending Approval',
                    booking: b
                  })),
                ...bookings
                  .filter((b: any) => {
                    const d = new Date(b.eventDate);
                    const now = new Date();
                    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                    return diff >= 0 && diff <= 7;
                  })
                  .slice(0, 3)
                  .map((b: any) => ({
                    type: 'Upcoming Event',
                    booking: b
                  }))
              ].map((item, idx) => (
                <DropdownMenuItem key={idx} asChild>
                  <Link href={`/admin/bookings?customer=${encodeURIComponent(item.booking.customer.email)}`}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.type}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.booking.customer.name} • {item.booking.bookingReference}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              {bookings.length === 0 && (
                <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" alt={user?.name} />
                  <AvatarFallback className="bg-primary text-white">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
