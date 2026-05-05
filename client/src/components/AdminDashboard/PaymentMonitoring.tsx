import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Eye, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentMonitoring() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all bookings
  const { data: bookings = [], refetch } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    }
  });

  // Filter for bookings that have paid deposit or are fully paid
  // But primarily we want to see those who paid deposit (downpayment) so we can update to fully paid
  const paymentBookings = bookings.filter((booking: any) => {
    // Include if deposit is paid OR status is deposit_paid OR fully_paid
    // We want to track the payment journey
    return booking.depositPaid || booking.status === 'deposit_paid' || booking.status === 'fully_paid' || booking.status === 'confirmed';
  }).filter((booking: any) => 
    booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatPrice = (priceInCents: number) => {
    return `₱${Math.round(priceInCents / 100).toLocaleString("en-PH")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedBooking) return;

    try {
      // Update status
      await apiRequest('PATCH', `/api/bookings/${selectedBooking.id}/status`, { status });

      // If setting to fully paid, we should also update payment flags
      if (status === 'fully_paid') {
        await apiRequest('PATCH', `/api/bookings/${selectedBooking.id}/payment`, {
          balancePaid: true,
          balancePaidAt: new Date().toISOString(),
          paymentStatus: 'fully_paid'
        });
      }

      toast({
        title: "Status Updated",
        description: `Booking marked as ${status.replace('_', ' ')}`,
      });

      refetch();
      setIsUpdateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Payment Monitoring</CardTitle>
        </div>
        <div className="mt-4 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search customer or reference..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Event Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No payment records found.
                  </TableCell>
                </TableRow>
              ) : (
                paymentBookings.map((booking: any) => {
                  const deposit = booking.depositAmount || Math.round(booking.totalPrice * 0.5);
                  const balance = booking.balanceAmount || (booking.totalPrice - deposit);
                  const isFullyPaid = booking.status === 'fully_paid' || (booking.balancePaid && booking.depositPaid);

                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.bookingReference}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{booking.customer.name}</span>
                          <span className="text-xs text-gray-500">{booking.customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(booking.eventDate)}</TableCell>
                      <TableCell>{formatPrice(booking.totalPrice)}</TableCell>
                      <TableCell>
                        <span className={isFullyPaid ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                          {isFullyPaid ? "Paid" : formatPrice(balance)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          booking.status === 'fully_paid' ? 'bg-green-100 text-green-800' :
                          booking.status === 'deposit_paid' ? 'bg-blue-100 text-blue-800' :
                          booking.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedBooking(booking);
                            setIsUpdateDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Payment Status</DialogTitle>
            <DialogDescription>
              Update the payment status for booking {selectedBooking?.bookingReference}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-medium">{selectedBooking.customer.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-medium">{formatPrice(selectedBooking.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Status:</span>
                  <span className="font-medium capitalize">{selectedBooking.status.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Select New Status:</p>

                <Button 
                  variant="outline" 
                  className="w-full justify-start border-green-200 hover:bg-green-50 hover:text-green-700"
                  onClick={() => handleUpdateStatus('fully_paid')}
                  disabled={selectedBooking.status === 'fully_paid'}
                >
                  <span className="w-full text-left">Mark as Fully Paid (Event Finished)</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleUpdateStatus('confirmed')}
                  disabled={selectedBooking.status === 'confirmed'}
                >
                  <span className="w-full text-left">Mark as Confirmed (Ready for Event)</span>
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}