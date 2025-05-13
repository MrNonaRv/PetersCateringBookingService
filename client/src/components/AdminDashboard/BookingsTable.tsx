import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, Trash, ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BookingsTableProps {
  limit?: number;
}

export default function BookingsTable({ limit }: BookingsTableProps) {
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const pageSize = limit || 10;
  
  // Fetch bookings
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings');
      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return res.json();
    }
  });
  
  // Paginate bookings
  const paginatedBookings = bookings ? bookings.slice((page - 1) * pageSize, page * pageSize) : [];
  const totalPages = bookings ? Math.ceil(bookings.length / pageSize) : 0;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format price from cents to dollars
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };
  
  // View booking details
  const viewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };
  
  // Edit booking
  const editBooking = (booking: any) => {
    setSelectedBooking(booking);
    setIsEditDialogOpen(true);
  };
  
  // Update booking status
  const updateBookingStatus = async (bookingId: number, status: string) => {
    try {
      await apiRequest('PATCH', `/api/bookings/${bookingId}/status`, { status });
      
      // Show success message
      toast({
        title: "Status Updated",
        description: `Booking status changed to ${status}`,
      });
      
      // Refetch bookings
      refetch();
      
      // Close the dialog
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update booking status",
        variant: "destructive"
      });
    }
  };
  
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading state
              Array(pageSize).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-8 w-8 rounded-full mr-4" />
                      <div>
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : (
              paginatedBookings.map((booking: any) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.bookingReference}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                        {booking.customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium">{booking.customer.name}</div>
                        <div className="text-sm text-gray-500">{booking.customer.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.service.name}
                  </TableCell>
                  <TableCell>
                    {formatDate(booking.eventDate)}
                  </TableCell>
                  <TableCell>
                    {booking.guestCount}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => viewBooking(booking)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editBooking(booking)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {!limit && (
        <div className="px-6 py-3 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {paginatedBookings.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, bookings?.length || 0)} of {bookings?.length || 0} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              const pageNum = page <= 2 ? i + 1 : page - 1 + i;
              if (pageNum <= totalPages) {
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              }
              return null;
            })}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking ID: {selectedBooking?.bookingReference}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Booking Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Service:</span> {selectedBooking.service.name}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {formatDate(selectedBooking.eventDate)}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {selectedBooking.eventTime === 'breakfast' ? 'Breakfast (7:00 AM - 10:00 AM)' :
                      selectedBooking.eventTime === 'lunch' ? 'Lunch (11:00 AM - 2:00 PM)' :
                      selectedBooking.eventTime === 'dinner' ? 'Dinner (5:00 PM - 9:00 PM)' :
                      selectedBooking.eventTime === 'evening' ? 'Evening (7:00 PM - 11:00 PM)' : 'Custom Time'}
                  </div>
                  <div>
                    <span className="font-medium">Event Type:</span> {selectedBooking.eventType}
                  </div>
                  <div>
                    <span className="font-medium">Guests:</span> {selectedBooking.guestCount}
                  </div>
                  <div>
                    <span className="font-medium">Menu Preference:</span> {selectedBooking.menuPreference}
                  </div>
                  <div>
                    <span className="font-medium">Service Style:</span> {selectedBooking.serviceStyle}
                  </div>
                  {selectedBooking.additionalServices && (
                    <div>
                      <span className="font-medium">Additional Services:</span> {selectedBooking.additionalServices}
                    </div>
                  )}
                  {selectedBooking.specialRequests && (
                    <div>
                      <span className="font-medium">Special Requests:</span> {selectedBooking.specialRequests}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge className="ml-2">
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Total Price:</span> {formatPrice(selectedBooking.totalPrice)}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Name:</span> {selectedBooking.customer.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedBooking.customer.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedBooking.customer.phone}
                  </div>
                  {selectedBooking.customer.company && (
                    <div>
                      <span className="font-medium">Company:</span> {selectedBooking.customer.company}
                    </div>
                  )}
                </div>
                
                <h3 className="text-lg font-medium mt-6 mb-4">Venue Information</h3>
                <div>
                  <span className="font-medium">Address:</span>
                  <p className="mt-1">{selectedBooking.venueAddress}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              editBooking(selectedBooking);
            }}>Edit Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Booking ID: {selectedBooking?.bookingReference}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Current Status</h3>
                <Badge className={
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                </Badge>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Change Status To</h3>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'pending')}
                    disabled={selectedBooking.status === 'pending'}
                  >
                    <Badge className="bg-yellow-100 text-yellow-800 mr-2">Pending</Badge>
                    Awaiting confirmation
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                    disabled={selectedBooking.status === 'confirmed'}
                  >
                    <Badge className="bg-green-100 text-green-800 mr-2">Confirmed</Badge>
                    Booking is confirmed
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                    disabled={selectedBooking.status === 'completed'}
                  >
                    <Badge className="bg-blue-100 text-blue-800 mr-2">Completed</Badge>
                    Event has taken place
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                    disabled={selectedBooking.status === 'cancelled'}
                  >
                    <Badge className="bg-red-100 text-red-800 mr-2">Cancelled</Badge>
                    Booking is cancelled
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
