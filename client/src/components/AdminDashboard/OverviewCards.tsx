import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, User, CalendarDays, DollarSign } from "lucide-react";

export default function OverviewCards() {
  // Fetch bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings');
      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return res.json();
    }
  });
  
  if (isLoadingBookings) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, index) => (
          <Card key={index} className="shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-10 rounded" />
              </div>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  // Calculate stats from bookings
  const calculateStats = () => {
    if (!bookings) return { total: 0, pending: 0, today: 0, totalRevenue: 0 };
    
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: bookings.length,
      pending: bookings.filter((booking: any) => booking.status === 'pending').length,
      today: bookings.filter((booking: any) => booking.eventDate === today).length,
      totalRevenue: bookings.reduce((sum: number, booking: any) => sum + booking.totalPrice, 0)
    };
  };
  
  const { total, pending, today, totalRevenue } = calculateStats();
  
  // Format price from cents to pesos
  const formatPrice = (priceInCents: number) => {
    return `₱${(priceInCents / 100).toFixed(2)}`;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Total Bookings</h3>
            <div className="bg-[#2ecc71] bg-opacity-10 text-[#2ecc71] p-2 rounded">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">{total}</div>
          <div className="text-sm text-green-600">
            <i className="fas fa-arrow-up mr-1"></i>
            <span>12% from last month</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Pending Bookings</h3>
            <div className="bg-secondary bg-opacity-10 text-secondary p-2 rounded">
              <i className="fas fa-hourglass-half"></i>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">{pending}</div>
          <div className="text-sm text-yellow-600">
            <i className="fas fa-arrow-down mr-1"></i>
            <span>3% from last week</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Today's Events</h3>
            <div className="bg-primary bg-opacity-10 text-primary p-2 rounded">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">{today}</div>
          <div className="text-sm text-blue-600">
            <i className="fas fa-arrow-up mr-1"></i>
            <span>1 more than yesterday</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Total Revenue</h3>
            <div className="bg-[#2ecc71] bg-opacity-10 text-[#2ecc71] p-2 rounded">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">{formatPrice(totalRevenue)}</div>
          <div className="text-sm text-green-600">
            <i className="fas fa-arrow-up mr-1"></i>
            <span>15% from last month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
