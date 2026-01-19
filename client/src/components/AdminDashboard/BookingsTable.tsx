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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Edit, ChevronLeft, ChevronRight, MessageSquare, Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BookingsTableProps {
  limit?: number;
}

export default function BookingsTable({ limit }: BookingsTableProps) {
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [smsType, setSmsType] = useState<'approve' | 'reminder' | 'custom'>('approve');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [paymentLink, setPaymentLink] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
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

  // Fetch payment settings
  const { data: paymentSettings = [] } = useQuery<any[]>({
    queryKey: ['/api/payment-settings'],
  });

  const getPaymentSettingForMethod = (method: string) => {
    // Only return settings that are active
    return paymentSettings.find((s) => s.paymentMethod === method && s.isActive);
  };
  
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
  
  // Format price from cents to pesos
  const formatPrice = (priceInCents: number) => {
    return `₱${(priceInCents / 100).toFixed(2)}`;
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

  // Open SMS dialog
  const openSmsDialog = (booking: any, type: 'approve' | 'reminder' | 'custom') => {
    setSelectedBooking(booking);
    setSmsType(type);
    setPaymentMethod('gcash');
    setPaymentLink('');
    setCustomMessage('');
    setIsSmsDialogOpen(true);
  };

  // Send SMS notification
  const sendSmsNotification = async () => {
    if (!selectedBooking) return;
    
    setIsSending(true);
    
    try {
      if (smsType === 'approve') {
        // Calculate deposit amount (50% of total)
        const depositAmount = Math.round(selectedBooking.totalPrice * 0.5);
        
        // Get payment account details from saved settings
        const paymentSetting = getPaymentSettingForMethod(paymentMethod);
        const accountName = paymentSetting?.accountName || '';
        const accountNumber = paymentSetting?.accountNumber || '';
        const instructions = paymentSetting?.instructions || '';
        
        // Build payment link message - use custom input or saved settings
        let fullPaymentLink = paymentLink;
        if (!fullPaymentLink && accountName && accountNumber) {
          // Build payment details from saved settings
          const methodLabel = paymentMethod === 'gcash' ? 'GCash' : 
                             paymentMethod === 'paymaya' ? 'PayMaya' :
                             paymentMethod === 'bank_bdo' ? 'BDO' :
                             paymentMethod === 'bank_bpi' ? 'BPI' : 'Cash';
          fullPaymentLink = `${methodLabel}: ${accountName} - ${accountNumber}`;
        } else if (!fullPaymentLink && paymentMethod !== 'cash') {
          fullPaymentLink = `Pay via ${paymentMethod.toUpperCase()}`;
        }
        
        // Send approval SMS first - if this fails, we don't update status
        const smsResult = await apiRequest('POST', '/api/sms/booking-approved', {
          bookingId: selectedBooking.id,
          customerPhone: selectedBooking.customer.phone,
          customerName: selectedBooking.customer.name,
          bookingReference: selectedBooking.bookingReference,
          depositAmount,
          paymentLink: fullPaymentLink,
          paymentMethod,
          accountName,
          accountNumber,
          instructions
        });
        
        const smsData = await smsResult.json();
        if (!smsData.success) {
          throw new Error(smsData.error || 'Failed to send SMS');
        }
        
        // Only update status to approved after SMS succeeds
        await apiRequest('PATCH', `/api/bookings/${selectedBooking.id}/status`, { status: 'approved' });
        
        toast({
          title: "Booking Approved",
          description: "SMS notification with payment details sent to customer",
        });
      } else if (smsType === 'reminder') {
        const eventDate = new Date(selectedBooking.eventDate);
        const today = new Date();
        const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        await apiRequest('POST', '/api/sms/payment-reminder', {
          bookingId: selectedBooking.id,
          customerPhone: selectedBooking.customer.phone,
          customerName: selectedBooking.customer.name,
          bookingReference: selectedBooking.bookingReference,
          balanceAmount: selectedBooking.balanceAmount || (selectedBooking.totalPrice - (selectedBooking.depositAmount || 0)),
          eventDate: selectedBooking.eventDate,
          daysUntilEvent: daysUntil
        });
        
        toast({
          title: "Reminder Sent",
          description: "Payment reminder SMS sent to customer",
        });
      } else if (smsType === 'custom') {
        if (!customMessage.trim()) {
          toast({
            title: "Error",
            description: "Please enter a message to send",
            variant: "destructive"
          });
          setIsSending(false);
          return;
        }
        
        await apiRequest('POST', '/api/sms/custom', {
          customerPhone: selectedBooking.customer.phone,
          message: customMessage
        });
        
        toast({
          title: "Message Sent",
          description: "Custom SMS sent to customer",
        });
      }
      
      refetch();
      setIsSmsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send SMS notification",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
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
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => viewBooking(booking)} title="View Details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => editBooking(booking)} title="Edit Status">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openSmsDialog(booking, booking.status === 'pending_approval' ? 'approve' : 'custom')}
                      title="Send SMS"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <MessageSquare className="h-4 w-4" />
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

      {/* SMS Notification Dialog */}
      <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              {smsType === 'approve' ? 'Approve & Send Payment Details' : 
               smsType === 'reminder' ? 'Send Payment Reminder' : 'Send Custom Message'}
            </DialogTitle>
            <DialogDescription>
              {selectedBooking && (
                <>
                  Send SMS to {selectedBooking.customer?.name} ({selectedBooking.customer?.phone})
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Message Type</Label>
                <Select value={smsType} onValueChange={(val) => setSmsType(val as 'approve' | 'reminder' | 'custom')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve" disabled={selectedBooking.status !== 'pending_approval'}>
                      Approve & Send Payment Details
                    </SelectItem>
                    <SelectItem value="reminder">
                      Send Payment Reminder
                    </SelectItem>
                    <SelectItem value="custom">
                      Custom Message
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {smsType === 'approve' && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">Booking Details</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Reference: {selectedBooking.bookingReference}</p>
                      <p>Total Price: ₱{(selectedBooking.totalPrice / 100).toLocaleString()}</p>
                      <p>Deposit (50%): ₱{(selectedBooking.totalPrice / 200).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gcash">GCash</SelectItem>
                        <SelectItem value="paymaya">PayMaya</SelectItem>
                        <SelectItem value="bank_bdo">BDO Bank Transfer</SelectItem>
                        <SelectItem value="bank_bpi">BPI Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash on Event Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod !== 'cash' && (() => {
                    const savedSetting = getPaymentSettingForMethod(paymentMethod);
                    return (
                      <div className="space-y-3">
                        {savedSetting && savedSetting.accountName && savedSetting.accountNumber ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500 font-medium">Saved Account (from Settings)</span>
                              <span className="text-xs text-green-600">Will be used</span>
                            </div>
                            <p className="font-medium text-gray-800">{savedSetting.accountName}</p>
                            <p className="text-sm text-gray-600">{savedSetting.accountNumber}</p>
                            {savedSetting.instructions && (
                              <p className="text-xs text-gray-500 mt-1">{savedSetting.instructions}</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                              No account saved for this payment method. 
                              <a href="/admin/settings" className="text-blue-600 underline ml-1">Configure in Settings</a>
                            </p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Override Payment Details (Optional)</Label>
                          <Input
                            placeholder="Leave empty to use saved account"
                            value={paymentLink}
                            onChange={(e) => setPaymentLink(e.target.value)}
                          />
                          <p className="text-xs text-gray-500">
                            Only fill this if you want to use different details than saved settings
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {(() => {
                    const savedSetting = getPaymentSettingForMethod(paymentMethod);
                    const methodLabel = paymentMethod === 'gcash' ? 'GCash' : 
                                       paymentMethod === 'paymaya' ? 'PayMaya' :
                                       paymentMethod === 'bank_bdo' ? 'BDO' :
                                       paymentMethod === 'bank_bpi' ? 'BPI' : 'Cash';
                    
                    let paymentDetails = '';
                    if (paymentLink) {
                      paymentDetails = ` Pay: ${paymentLink}`;
                    } else if (savedSetting?.accountName && savedSetting?.accountNumber) {
                      paymentDetails = ` Send to ${methodLabel}: ${savedSetting.accountName} - ${savedSetting.accountNumber}`;
                    } else if (paymentMethod !== 'cash') {
                      paymentDetails = ` Pay via ${methodLabel}`;
                    } else {
                      paymentDetails = ' Payment accepted on event day.';
                    }
                    
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Preview Message</h4>
                        <p className="text-sm text-blue-700">
                          Good news, {selectedBooking.customer?.name}! Your booking ({selectedBooking.bookingReference}) has been approved! 
                          Please pay the deposit of ₱{(selectedBooking.totalPrice / 200).toLocaleString()} to confirm your reservation.
                          {paymentDetails}
                          {' '}- Peter's Creation Catering
                        </p>
                      </div>
                    );
                  })()}
                </>
              )}

              {smsType === 'reminder' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Reminder Message Preview</h4>
                  <p className="text-sm text-orange-700">
                    Hi {selectedBooking.customer?.name}! Friendly reminder: Your catering event is on {new Date(selectedBooking.eventDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}. 
                    Outstanding balance: ₱{((selectedBooking.balanceAmount || (selectedBooking.totalPrice - (selectedBooking.depositAmount || 0))) / 100).toLocaleString()}. 
                    Please settle before the event. Ref: {selectedBooking.bookingReference} - Peter's Creation Catering
                  </p>
                </div>
              )}

              {smsType === 'custom' && (
                <div className="space-y-2">
                  <Label>Custom Message</Label>
                  <Textarea
                    placeholder="Enter your message here..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    {customMessage.length}/160 characters (SMS limit)
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsSmsDialogOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button 
              onClick={sendSmsNotification} 
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {smsType === 'approve' ? 'Approve & Send SMS' : 'Send SMS'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
