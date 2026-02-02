import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, User, CalendarDays, PhilippinePeso, Clock } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export default function OverviewCards() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

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
      pending: bookings.filter((booking: any) => booking.status === 'pending_approval' || booking.status === 'pending').length,
      today: bookings.filter((booking: any) => booking.eventDate === today).length,
      totalRevenue: bookings.reduce((sum: number, booking: any) => sum + booking.totalPrice, 0)
    };
  };

  const { total, pending, today, totalRevenue } = calculateStats();

  // Filter bookings based on selection
  const getFilteredBookings = () => {
    if (!bookings || !selectedCard) return [];

    const today = new Date().toISOString().split('T')[0];

    switch (selectedCard) {
      case 'total':
        return bookings;
      case 'pending':
        return bookings.filter((booking: any) => booking.status === 'pending_approval' || booking.status === 'pending');
      case 'today':
        return bookings.filter((booking: any) => booking.eventDate === today);
      case 'revenue':
        return bookings.filter((booking: any) => 
          booking.depositPaid || 
          booking.status === 'fully_paid' || 
          booking.status === 'deposit_paid' || 
          booking.status === 'confirmed' || 
          booking.status === 'completed'
        );
      default:
        return [];
    }
  };

  const filteredBookings = getFilteredBookings();
  const modalTitle = {
    total: 'All Bookings',
    pending: 'Pending Bookings',
    today: "Today's Events",
    revenue: 'Revenue Details'
  }[selectedCard || 'total'];

  // Format price from cents to pesos
  const formatPrice = (priceInCents: number) => {
  return `₱${Math.round(priceInCents / 100).toLocaleString("en-PH")}`;
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="shadow cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setSelectedCard('total')}
        >
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

        <Card 
          className="shadow cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setSelectedCard('pending')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Pending Bookings</h3>
              <div className="bg-secondary bg-opacity-10 text-secondary p-2 rounded">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">{pending}</div>
            <div className="text-sm text-yellow-600">
              <i className="fas fa-arrow-down mr-1"></i>
              <span>{pending > 0 ? "Action required" : "All caught up"}</span>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="shadow cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setSelectedCard('today')}
        >
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

        <Card 
          className="shadow cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setSelectedCard('revenue')}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Total Revenue</h3>
              <div className="bg-[#2ecc71] bg-opacity-10 text-[#2ecc71] p-2 rounded">
                <PhilippinePeso className="h-5 w-5" />
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

      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
            <DialogDescription>
              Showing {filteredBookings.length} results
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No bookings found for this category.
                </div>
              ) : (
                filteredBookings.map((booking: any) => (
                  <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{booking.customer.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {booking.bookingReference}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center gap-2">
                            <CalendarDays className="h-3 w-3" />
                            {booking.eventDate} • {booking.eventTime}
                          </p>
                          <p className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {booking.eventType} ({booking.guestCount} guests)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatPrice(booking.totalPrice)}</p>
                        <Badge 
                          className={`mt-2 ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          variant="secondary"
                        >
                          {booking.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
