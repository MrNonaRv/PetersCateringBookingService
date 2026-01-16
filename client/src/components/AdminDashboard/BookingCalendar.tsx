import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function BookingCalendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  
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
  
  // Fetch availability
  const { data: availabilities, isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['/api/availability'],
    queryFn: async () => {
      const res = await fetch('/api/availability');
      if (!res.ok) {
        throw new Error('Failed to fetch availability');
      }
      return res.json();
    }
  });
  
  // Fetch capacity calendar
  const { data: capacityData } = useQuery({
    queryKey: ['/api/capacity-calendar'],
    queryFn: async () => {
      const res = await fetch('/api/capacity-calendar');
      if (!res.ok) {
        throw new Error('Failed to fetch capacity');
      }
      return res.json();
    }
  });
  
  // Navigate to previous month
  const prevMonth = () => {
    const prev = new Date(month);
    prev.setMonth(prev.getMonth() - 1);
    setMonth(prev);
  };
  
  // Navigate to next month
  const nextMonth = () => {
    const next = new Date(month);
    next.setMonth(next.getMonth() + 1);
    setMonth(next);
  };
  
  // Get bookings for a specific date
  const getBookingsForDate = (dateToCheck: Date) => {
    if (!bookings) return [];
    
    const dateString = format(dateToCheck, 'yyyy-MM-dd');
    return bookings.filter((booking: any) => booking.eventDate === dateString);
  };
  
  // Check if date is available
  const isDateAvailable = (dateToCheck: Date) => {
    if (!availabilities) return true;
    
    const dateString = format(dateToCheck, 'yyyy-MM-dd');
    const availability = availabilities.find((a: any) => a.date === dateString);
    
    // If no availability record, assume available
    if (!availability) return true;
    
    return availability.isAvailable;
  };
  
  // Get capacity for a specific date
  const getCapacityForDate = (dateToCheck: Date) => {
    if (!capacityData) return { bookedSlots: 0, maxSlots: 7 };
    
    const dateString = format(dateToCheck, 'yyyy-MM-dd');
    const capacity = capacityData.find((c: any) => c.date === dateString);
    
    if (!capacity) return { bookedSlots: 0, maxSlots: 7 };
    
    return { bookedSlots: capacity.bookedSlots, maxSlots: capacity.maxSlots };
  };
  
  // Custom day render to show booking indicators
  const renderDay = (day: Date) => {
    const dateBookings = getBookingsForDate(day);
    const capacity = getCapacityForDate(day);
    const isAvailable = isDateAvailable(day);
    
    return (
      <div className="relative w-full h-full flex flex-col justify-center items-center">
        <span>{format(day, 'd')}</span>
        {dateBookings.length > 0 && (
          <div className="text-[10px] mt-1">
            {dateBookings.length} event{dateBookings.length > 1 ? 's' : ''}
          </div>
        )}
        {capacity.bookedSlots > 0 && (
          <div className="text-[9px] text-gray-500">
            {capacity.bookedSlots}/{capacity.maxSlots}
          </div>
        )}
      </div>
    );
  };
  
  // Determine CSS class for days
  const getDayClass = (day: Date) => {
    const dateBookings = getBookingsForDate(day);
    const capacity = getCapacityForDate(day);
    const isAvailable = isDateAvailable(day);
    
    // Date is marked as unavailable
    if (!isAvailable) {
      return "bg-[#e74c3c] bg-opacity-20 border border-[#e74c3c]";
    }
    
    // Date is at full capacity
    if (capacity.bookedSlots >= capacity.maxSlots) {
      return "bg-[#e74c3c] bg-opacity-20 border border-[#e74c3c]";
    }
    
    // Date has bookings (partially filled)
    if (dateBookings.length > 0 || capacity.bookedSlots > 0) {
      return "bg-primary bg-opacity-20 border border-primary";
    }
    
    return "bg-white border border-gray-200";
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h4 className="text-lg font-medium">{format(month, 'MMMM yyyy')}</h4>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mb-6">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => date && setDate(date)}
          month={month}
          onMonthChange={setMonth}
          className="rounded-md"
          // Custom components for the calendar
          components={{
            Day: ({ date, ...props }: any) => (
              <div
                {...props}
                className={`calendar-day text-center py-2 ${getDayClass(date)}`}
              >
                {renderDay(date)}
              </div>
            ),
          }}
        />
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-primary bg-opacity-20 border border-primary mr-2"></div>
          <span className="text-sm">Confirmed Bookings</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#e74c3c] bg-opacity-20 border border-[#e74c3c] mr-2"></div>
          <span className="text-sm">Fully Booked</span>
        </div>
      </div>
      
      {/* Display bookings for selected date */}
      {date && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">Events on {format(date, 'MMMM d, yyyy')}</h4>
          <div className="space-y-2">
            {getBookingsForDate(date).length > 0 ? (
              getBookingsForDate(date).map((booking: any) => (
                <div key={booking.id} className="p-2 bg-gray-50 rounded border">
                  <div className="flex justify-between">
                    <span className="font-medium">{booking.service.name}</span>
                    <Badge className={
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {booking.customer.name} - {booking.guestCount} guests
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No events scheduled</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
