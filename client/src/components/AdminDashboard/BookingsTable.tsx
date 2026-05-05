import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Eye, Edit, ChevronLeft, ChevronRight, MessageSquare, Send, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
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
  const [searchName, setSearchName] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_approval' | 'pending' | 'deposit_paid' | 'confirmed' | 'completed' | 'cancelled'>('all');
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

  const parseLocalYMD = (dateString: string) => {
    const [y, m, d] = dateString.split("-").map((v) => parseInt(v, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const searchCustomerEmail = (() => {
    try {
      return new URLSearchParams(window.location.search).get('customer') || '';
    } catch {
      return '';
    }
  })();
  const searchQueryName = (() => {
    try {
      return new URLSearchParams(window.location.search).get('q') || '';
    } catch {
      return '';
    }
  })();
  const searchRef = (() => {
    try {
      return new URLSearchParams(window.location.search).get('ref') || '';
    } catch {
      return '';
    }
  })();
  if (!searchName && searchQueryName) {
    setSearchName(searchQueryName);
  }
  const filteredBookings = (bookings || [])
    .filter((b: any) => !searchCustomerEmail || b.customer.email === searchCustomerEmail)
    .filter((b: any) => !searchName || (b.customer.name || '').toLowerCase().includes(searchName.toLowerCase()))
    .filter((b: any) => !searchRef || b.bookingReference === searchRef)
    .filter((b: any) => {
      if (!startDate && !endDate) return true;
      const ev = parseLocalYMD(b.eventDate).getTime();
      const from = startDate ? parseLocalYMD(startDate).getTime() : -Infinity;
      const to = endDate ? parseLocalYMD(endDate).getTime() : Infinity;
      return ev >= from && ev <= to;
    })
    .filter((b: any) => statusFilter === 'all' ? true : b.status === statusFilter);

  // Paginate bookings
  const paginatedBookings = filteredBookings.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredBookings.length / pageSize);

  // Format date
  const formatDate = (dateString: string) => {
    const date = parseLocalYMD(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format price from cents to pesos
  const formatPrice = (priceInCents: number) => {
    const pesos = Math.round(priceInCents / 100);
    return `₱${pesos.toLocaleString("en-PH")}`;
  };

  const statusCounts = (bookings || []).reduce((acc: Record<string, number>, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    acc['all'] = (acc['all'] || 0) + 1;
    return acc;
  }, {});

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

  // Helper to group dishes by category
  const groupDishesByCategory = (dishes: any[]) => {
    if (!dishes) return {};
    return dishes.reduce((acc, dish) => {
      const category = dish.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(dish);
      return acc;
    }, {} as Record<string, any[]>);
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

        // Send approval SMS first - if this fails, we don't update status
        const smsResult = await apiRequest('POST', '/api/sms/booking-approved', {
          bookingId: selectedBooking.id,
          customerPhone: selectedBooking.customer.phone,
          customerName: selectedBooking.customer.name,
          bookingReference: selectedBooking.bookingReference,
          depositAmount,
        });

        const smsData = await smsResult.json();
        if (!smsData.success) {
          throw new Error(smsData.error || 'Failed to send SMS');
        }

        // Only update status to pending (Waiting for Deposit) after SMS succeeds
        await apiRequest('PATCH', `/api/bookings/${selectedBooking.id}/status`, { status: 'pending' });

        toast({
          title: "Booking Approved",
          description: "SMS notification sent to customer with booking reference",
        });
      } else if (smsType === 'reminder') {
        const eventDate = parseLocalYMD(selectedBooking.eventDate);
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
          bookingId: selectedBooking.id,
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
      {/* Filters */}
      {!limit && (
        <div className="px-6 py-4 border-b grid grid-cols-1 md:grid-cols-4 items-end gap-4">
          <div className="md:col-span-2">
            <Label className="mb-1 block">Search by Customer Name</Label>
            <Input 
              placeholder="Type customer name..."
              value={searchName}
              onChange={(e) => {
                setPage(1);
                setSearchName(e.target.value);
              }}
              className="w-full"
            />
          </div>
          <div>
            <Label className="mb-1 block">Start Date</Label>
            <Input 
              type="date" 
              value={startDate}
              onChange={(e) => {
                setPage(1);
                setStartDate(e.target.value);
              }}
              className="w-full"
            />
          </div>
          <div>
            <Label className="mb-1 block">End Date</Label>
            <Input 
              type="date" 
              value={endDate}
              onChange={(e) => {
                setPage(1);
                setEndDate(e.target.value);
              }}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 md:justify-end">
            <Button 
              variant="outline"
              onClick={() => {
                setSearchName('');
                setStartDate('');
                setEndDate('');
                setPage(1);
                setStatusFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}
      {!limit && (
        <div className="px-6 py-3 border-t flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending_approval', label: 'Pending Approval' },
            { key: 'pending', label: 'Waiting for Deposit' },
            { key: 'deposit_paid', label: 'Deposit Paid' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map(s => (
            <Button
              key={s.key}
              variant={statusFilter === (s.key as any) ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPage(1); setStatusFilter(s.key as any); }}
              className="flex items-center gap-2 min-w-[140px] justify-between"
            >
              <span>{s.label}</span>
              <Badge className="bg-gray-100 text-gray-700">{statusCounts[s.key] || 0}</Badge>
            </Button>
          ))}
        </div>
      )}
      {!limit && (
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-orange-400">
            <CardContent className="py-3">
              <div className="text-xs text-gray-500">Pending Approval</div>
              <div className="text-2xl font-bold">{statusCounts['pending_approval'] || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-400">
            <CardContent className="py-3">
              <div className="text-xs text-gray-500">Pending</div>
              <div className="text-2xl font-bold">{statusCounts['pending'] || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="py-3">
              <div className="text-xs text-gray-500">Confirmed</div>
              <div className="text-2xl font-bold">{statusCounts['confirmed'] || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service / Package</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Total</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
                    <div>
                      <div className="font-medium">{booking.service?.name || 'Custom Quote'}</div>
                      {booking.package && (
                        <div className="text-sm text-gray-500">{booking.package.name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatDate(booking.eventDate)}
                  </TableCell>
                  <TableCell>
                    {booking.guestCount}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(booking.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending_approval' ? 'bg-orange-100 text-orange-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'deposit_paid' ? 'bg-purple-100 text-purple-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {booking.status === 'deposit_paid' ? '✓ Deposit Paid' :
                       booking.status === 'pending_approval' ? 'Pending Approval' :
                       booking.status === 'pending' ? 'Waiting for Deposit' :
                       booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {/* View & Edit icons always visible */}
                      <Button variant="ghost" size="icon" onClick={() => viewBooking(booking)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => editBooking(booking)} title="Edit Status">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSmsDialog(booking, (booking.status === 'pending_approval' || booking.status === 'pending') ? 'approve' : 'custom')}
                        title="Send SMS"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>

                      {/* Context-aware primary action button */}
                      {booking.status === 'pending_approval' && (
                        <Button
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3"
                          onClick={() => openSmsDialog(booking, 'approve')}
                          title="Approve booking and notify customer"
                        >
                          Approve
                        </Button>
                      )}

                      {booking.status === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300 flex items-center gap-1 px-2 py-1">
                          <Clock className="h-3 w-3" />
                          Waiting for Deposit
                        </Badge>
                      )}

                      {(booking.status === 'deposit_paid' || booking.depositPaid) && booking.status !== 'confirmed' && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 flex items-center gap-1"
                          onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                          title="Deposit received — confirm this booking"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Confirm
                        </Button>
                      )}

                      {booking.status === 'confirmed' && (
                        <Badge className="bg-green-100 text-green-800 border border-green-300 flex items-center gap-1 px-2 py-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Confirmed
                        </Badge>
                      )}
                    </div>
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
            Showing {paginatedBookings.length > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filteredBookings.length)} of {filteredBookings.length} entries
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking ID: {selectedBooking?.bookingReference}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg flex justify-between items-center ${
                  selectedBooking.status === 'confirmed' ? 'bg-green-50 border border-green-200 text-green-800' :
                  selectedBooking.status === 'pending' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                  selectedBooking.status === 'cancelled' ? 'bg-red-50 border border-red-200 text-red-800' :
                  'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium opacity-80 uppercase tracking-wide">Current Status</span>
                  <span className="text-xl font-bold">{selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1).replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium opacity-80 uppercase tracking-wide">Total Amount</span>
                  <span className="block text-xl font-bold">{formatPrice(selectedBooking.totalPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Event Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                      <span className="text-primary">📅</span> Event Details
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Service Type</span>
                        <span className="col-span-2 font-medium">{selectedBooking.service?.name || 'Custom Quote'}</span>
                      </div>

                      {selectedBooking.package && (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="text-gray-500 font-medium">Package</span>
                          <span className="col-span-2 font-medium">{selectedBooking.package.name}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Date & Time</span>
                        <div className="col-span-2">
                          <div className="font-medium">{formatDate(selectedBooking.eventDate)}</div>
                          <div className="text-gray-600">
                            {selectedBooking.eventTime === 'breakfast' ? 'Breakfast (7:00 AM - 10:00 AM)' :
                             selectedBooking.eventTime === 'lunch' ? 'Lunch (11:00 AM - 2:00 PM)' :
                             selectedBooking.eventTime === 'dinner' ? 'Dinner (5:00 PM - 9:00 PM)' :
                             selectedBooking.eventTime === 'evening' ? 'Evening (7:00 PM - 11:00 PM)' :
                             selectedBooking.eventTime}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Event Type</span>
                        <span className="col-span-2 font-medium capitalize">{selectedBooking.eventType}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Guest Count</span>
                        <span className="col-span-2 font-medium">{selectedBooking.guestCount} pax</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Theme</span>
                        <span className="col-span-2 font-medium">{selectedBooking.theme || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                      <span className="text-primary">📍</span> Venue Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{selectedBooking.venueAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Customer & Preferences */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                      <span className="text-primary">👤</span> Customer Information
                    </h3>
                    <div className="bg-white border rounded-lg p-4 space-y-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {selectedBooking.customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedBooking.customer.name}</p>
                          <p className="text-sm text-gray-500">{selectedBooking.customer.company || 'Individual'}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email</span>
                          <span className="font-medium">{selectedBooking.customer.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phone</span>
                          <span className="font-medium">{selectedBooking.customer.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2">
                      <span className="text-primary">🍽️</span> Preferences & Requests
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Menu Pref</span>
                        <span className="col-span-2 font-medium">{selectedBooking.menuPreference}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Service Style</span>
                        <span className="col-span-2 font-medium capitalize">{selectedBooking.serviceStyle}</span>
                      </div>

                      {selectedBooking.specialRequests && (
                        <div className="col-span-3 bg-yellow-50 p-3 rounded-md border border-yellow-100 text-sm">
                          <span className="font-medium text-yellow-800 block mb-1">Special Requests:</span>
                          <p className="text-yellow-700">{selectedBooking.specialRequests}</p>
                        </div>
                      )}

                      {selectedBooking.additionalServices && (
                        <div className="col-span-3 bg-blue-50 p-3 rounded-md border border-blue-100 text-sm">
                          <span className="font-medium text-blue-800 block mb-1">Additional Services:</span>
                          <p className="text-blue-700">{selectedBooking.additionalServices}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                {/* Package Inclusions */}
                {selectedBooking.package && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-primary">📦</span> Package Inclusions
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-2">{selectedBooking.package.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{selectedBooking.package.description}</p>

                    {selectedBooking.package.features && selectedBooking.package.features.length > 0 && (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {selectedBooking.package.features.map((feature: string, idx: number) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Base Price per Person</span>
                        <span className="font-medium">{formatPrice(selectedBooking.package.pricePerPerson)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Selection */}
              {selectedBooking.selectedDishes && selectedBooking.selectedDishes.length > 0 && (
                <div className="border-t pt-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-primary">🍳</span> Menu Selection
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {Object.entries(groupDishesByCategory(selectedBooking.selectedDishes)).map(([category, dishes]) => (
                       <Card key={category} className="border-l-4 border-l-primary shadow-sm">
                          <CardHeader className="py-3 px-4 bg-gray-50 border-b">
                            <CardTitle className="text-sm font-bold capitalize text-gray-900">{category}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3">
                            <ul className="space-y-2">
                              {(dishes as any[]).map((dish, idx) => (
                                <li key={idx} className="text-sm flex justify-between items-center group hover:bg-gray-50 p-1 rounded transition-colors">
                                  <span className="font-medium text-gray-700">{dish.name}</span>
                                  {dish.quantity > 1 && (
                                    <Badge variant="secondary" className="text-xs">x{dish.quantity}</Badge>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                       </Card>
                     ))}
                   </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Booking ID: {selectedBooking?.bookingReference}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              {/* Payment Status Banner */}
              {(selectedBooking.depositPaid || selectedBooking.status === 'deposit_paid') && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-purple-800">Deposit Payment Received</p>
                    <p className="text-xs text-purple-600">
                      {selectedBooking.depositPaymentMethod ? `via ${selectedBooking.depositPaymentMethod.toUpperCase()}` : ''}
                      {selectedBooking.depositPaymentReference ? ` · Ref: ${selectedBooking.depositPaymentReference}` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Current Status</h3>
                <Badge className={
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  selectedBooking.status === 'deposit_paid' ? 'bg-purple-100 text-purple-800' :
                  selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedBooking.status === 'pending_approval' ? 'bg-orange-100 text-orange-800' :
                  selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }>
                  {selectedBooking.status === 'deposit_paid' ? '✓ Deposit Paid' :
                   selectedBooking.status === 'pending' ? 'Awaiting Deposit' :
                   selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1).replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Confirm Booking — highlighted when deposit is paid */}
              {(selectedBooking.depositPaid || selectedBooking.status === 'deposit_paid') && selectedBooking.status !== 'confirmed' && selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                <div className="bg-purple-50 border-2 border-purple-400 rounded-lg p-4">
                  <p className="text-sm text-purple-700 mb-3 font-medium">💰 Deposit has been paid — ready to confirm this booking!</p>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm Booking
                  </Button>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Change Status To</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => updateBookingStatus(selectedBooking.id, 'pending')}
                    disabled={selectedBooking.status === 'pending'}
                  >
                    <Badge className="bg-yellow-100 text-yellow-800 mr-2">Awaiting Deposit</Badge>
                    Approved, waiting for deposit
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                    <SelectItem value="approve" disabled={!(selectedBooking.status === 'pending_approval' || selectedBooking.status === 'pending')}>
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
                      <p>Total Price: ₱{Math.round(selectedBooking.totalPrice / 100).toLocaleString("en-PH")}</p>
                      <p>Deposit (50%): ₱{Math.round(selectedBooking.totalPrice / 200).toLocaleString("en-PH")}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Preview Message</h4>
                    <p className="text-sm text-blue-700">
                      Hi {selectedBooking.customer?.name}, booking {selectedBooking.bookingReference} is APPROVED. 
                      To pay the deposit, please visit our website and enter code: {selectedBooking.bookingReference}. 
                      - Peters Catering
                    </p>
                  </div>
                </>
              )}

              {smsType === 'reminder' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Reminder Message Preview</h4>
                  <p className="text-sm text-orange-700">
                    Hi {selectedBooking.customer?.name}, upcoming event on {parseLocalYMD(selectedBooking.eventDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}. 
                    Ref: {selectedBooking.bookingReference}. See you soon! - Peters Catering
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
