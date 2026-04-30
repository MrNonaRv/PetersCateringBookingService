import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, MapPin, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, getDay } from "date-fns";

interface Booking {
  id: number;
  bookingReference: string;
  eventDate: string;
  eventTime: string;
  eventType: string;
  guestCount: number;
  venueAddress: string;
  status: string;
  totalPrice: number;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  service?: {
    id: number;
    name: string;
  };
  package?: {
    id: number;
    name: string;
  };
}

export default function BookingCalendar() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  const { data: capacityData = [] } = useQuery<any[]>({
    queryKey: ['/api/capacity-calendar'],
  });

  const { data: availabilities = [] } = useQuery<any[]>({
    queryKey: ['/api/availability'],
  });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const getBookingsForDate = (date: Date): Booking[] => {
    const dateString = format(date, 'yyyy-MM-dd');
    const validStatuses = ['deposit_paid', 'fully_paid', 'confirmed', 'completed'];
    return bookings.filter((booking) => 
      booking.eventDate === dateString && 
      validStatuses.includes(booking.status)
    );
  };

  const getCapacityForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const capacity = capacityData.find((c) => c.date === dateString);
    return capacity ? { bookedSlots: capacity.bookedSlots, maxSlots: capacity.maxSlots } : { bookedSlots: 0, maxSlots: 7 };
  };

  const isDateAvailable = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const availability = availabilities.find((a) => a.date === dateString);
    return availability ? availability.isAvailable : true;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending_approval: "bg-yellow-100 text-yellow-800",
      pending: "bg-blue-100 text-blue-800",
      approved: "bg-blue-100 text-blue-800",
      deposit_paid: "bg-purple-100 text-purple-800",
      fully_paid: "bg-green-100 text-green-800",
      confirmed: "bg-emerald-100 text-emerald-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    
    let label = status.replace(/_/g, ' ');
    if (status === 'pending' || status === 'approved') {
      label = "Waiting for Deposit";
    }
    
    return (
      <Badge className={statusStyles[status] || "bg-gray-100 text-gray-800"}>
        {label}
      </Badge>
    );
  };

  const formatPrice = (priceInCents: number) => {
    return `₱${Math.round(priceInCents / 100).toLocaleString("en-PH")}`;
  };

  const days = getDaysInMonth();
  const firstDayOfMonth = getDay(startOfMonth(currentMonth));
  const emptyDays = Array(firstDayOfMonth).fill(null);

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-600">Has Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600">Fully Booked</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center py-3 text-sm font-semibold text-gray-600 bg-gray-50 rounded">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[100px] bg-gray-50 rounded"></div>
        ))}

        {days.map((day) => {
          const dateBookings = getBookingsForDate(day);
          const capacity = getCapacityForDate(day);
          const isAvailable = isDateAvailable(day);
          const isFull = capacity.bookedSlots >= capacity.maxSlots || !isAvailable;
          const hasBookings = dateBookings.length > 0 || capacity.bookedSlots > 0;

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                min-h-[100px] p-2 rounded cursor-pointer transition-all border-2
                hover:shadow-lg hover:scale-[1.02]
                ${isToday(day) ? 'ring-2 ring-primary ring-offset-2' : ''}
                ${isFull ? 'bg-red-50 border-red-300' : hasBookings ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-primary'}
              `}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`
                  text-lg font-bold
                  ${isToday(day) ? 'text-primary' : 'text-gray-800'}
                `}>
                  {format(day, 'd')}
                </span>
                {capacity.bookedSlots > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isFull ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                    {capacity.bookedSlots}/{capacity.maxSlots}
                  </span>
                )}
              </div>

              {dateBookings.length > 0 && (
                <div className="space-y-1 mt-2">
                  {dateBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      className="text-xs p-1.5 bg-white rounded shadow-sm border truncate"
                    >
                      <span className="font-medium">{booking.customer.name}</span>
                      <span className="text-gray-500 ml-1">({booking.guestCount})</span>
                    </div>
                  ))}
                  {dateBookings.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dateBookings.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
            <DialogDescription>
              {selectedDateBookings.length === 0
                ? 'No bookings scheduled for this date.'
                : `${selectedDateBookings.length} booking${selectedDateBookings.length > 1 ? 's' : ''} on this date`}
            </DialogDescription>
          </DialogHeader>

          {selectedDateBookings.length > 0 ? (
            <div className="space-y-4 mt-4">
              {selectedDateBookings.map((booking) => (
                <div
                  key={booking.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setLocation(`/admin/bookings?ref=${encodeURIComponent(booking.bookingReference)}`);
                      }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{booking.customer.name}</h4>
                      <p className="text-sm text-gray-500 font-mono">{booking.bookingReference}</p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{booking.eventTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{booking.guestCount} guests</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{booking.venueAddress}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-500">Event: </span>
                      <span className="font-medium">{booking.eventType}</span>
                      {booking.service && (
                        <span className="text-gray-500"> - {booking.service.name}</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {formatPrice(booking.totalPrice)}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                    <span className="font-medium">Contact: </span>
                    {booking.customer.phone} | {booking.customer.email}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No bookings on this date</p>
              <p className="text-sm mt-1">This date is available for new bookings.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
