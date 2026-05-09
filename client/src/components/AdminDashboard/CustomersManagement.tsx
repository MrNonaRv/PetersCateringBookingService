import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Eye, Calendar, Users, MapPin, ChevronLeft, DollarSign, Package } from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const parseLocalYMD = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const formatDate = (dateStr: string) =>
  parseLocalYMD(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatPrice = (cents: number) =>
  `₱${Math.round(cents / 100).toLocaleString("en-PH")}`;

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "confirmed":      return "bg-green-100 text-green-800";
    case "pending_approval": return "bg-orange-100 text-orange-800";
    case "pending":        return "bg-yellow-100 text-yellow-800";
    case "deposit_paid":   return "bg-purple-100 text-purple-800";
    case "completed":      return "bg-blue-100 text-blue-800";
    case "cancelled":      return "bg-red-100 text-red-800";
    default:               return "bg-gray-100 text-gray-800";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "deposit_paid":   return "✓ Deposit Paid";
    case "pending_approval": return "Pending Approval";
    case "pending":        return "Waiting for Deposit";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  }
};

// ─── component ───────────────────────────────────────────────────────────────

export default function CustomersManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isBookingsOpen, setIsBookingsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
  });

  // Deduplicate customers by email
  const customers: any[] = bookings.reduce((acc: any[], b: any) => {
    if (!acc.some((c) => c.email === b.customer.email)) acc.push(b.customer);
    return acc;
  }, []);

  const openCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsBookingsOpen(true);
  };

  const openBookingDetail = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const customerBookings = selectedCustomer
    ? bookings.filter((b: any) => b.customer.email === selectedCustomer.email)
    : [];

  return (
    <>
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-medium">Customer Management</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i}>
                          {Array(6)
                            .fill(0)
                            .map((__, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                            ))}
                        </TableRow>
                      ))
                  : customers.map((customer: any) => {
                      const count = bookings.filter(
                        (b: any) => b.customer.email === customer.email
                      ).length;
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.company || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{count}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCustomer(customer)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── DIALOG 1: Customer's Booking List ─────────────────────────────── */}
      <Dialog open={isBookingsOpen} onOpenChange={setIsBookingsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {selectedCustomer?.name?.charAt(0).toUpperCase()}
              </div>
              {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription className="space-y-0.5 pt-1">
              <span className="block">{selectedCustomer?.email}</span>
              <span className="block">{selectedCustomer?.phone}</span>
              {selectedCustomer?.company && (
                <span className="block text-xs text-muted-foreground">{selectedCustomer.company}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              {customerBookings.length} Booking{customerBookings.length !== 1 ? "s" : ""}
            </p>

            {customerBookings.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No bookings found for this customer.
              </div>
            ) : (
              <div className="space-y-3">
                {customerBookings.map((booking: any) => (
                  <button
                    key={booking.id}
                    onClick={() => openBookingDetail(booking)}
                    className="w-full text-left rounded-xl border border-gray-200 hover:border-primary/40 hover:shadow-md transition-all p-4 bg-white group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left info */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-gray-500">
                            {booking.bookingReference}
                          </span>
                          <Badge className={statusBadgeClass(booking.status)}>
                            {statusLabel(booking.status)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {formatDate(booking.eventDate)}
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            <Package className="h-3.5 w-3.5 text-gray-400" />
                            {booking.service?.name || "Custom"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            {booking.guestCount} pax
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-400 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{booking.venueAddress}</span>
                        </div>
                      </div>

                      {/* Right price */}
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatPrice(booking.totalPrice)}
                        </p>
                        <p className="text-xs text-gray-400 group-hover:text-primary transition-colors mt-1">
                          View details →
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsBookingsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 2: Full Booking Detail ─────────────────────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground"
                onClick={() => { setIsDetailOpen(false); setIsBookingsOpen(true); }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Reference: {selectedBooking?.bookingReference}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Status + Price Banner */}
              <div
                className={`p-4 rounded-lg flex justify-between items-center ${
                  selectedBooking.status === "confirmed"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : selectedBooking.status === "cancelled"
                    ? "bg-red-50 border border-red-200 text-red-800"
                    : selectedBooking.status === "pending"
                    ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                    : "bg-blue-50 border border-blue-200 text-blue-800"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium opacity-70 uppercase tracking-wide">Status</span>
                  <span className="text-xl font-bold">{statusLabel(selectedBooking.status)}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium opacity-70 uppercase tracking-wide">Total</span>
                  <span className="block text-xl font-bold">{formatPrice(selectedBooking.totalPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Event Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center gap-2">
                      <span>📅</span> Event Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <Row label="Service" value={selectedBooking.service?.name || "Custom Quote"} />
                      {selectedBooking.package && (
                        <Row label="Package" value={selectedBooking.package.name} />
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-500 font-medium">Date & Time</span>
                        <div className="col-span-2">
                          <div className="font-medium">{formatDate(selectedBooking.eventDate)}</div>
                          <div className="text-gray-500 text-xs">{selectedBooking.eventTime}</div>
                        </div>
                      </div>
                      <Row label="Event Type" value={selectedBooking.eventType} capitalize />
                      <Row label="Guest Count" value={`${selectedBooking.guestCount} pax`} />
                      {selectedBooking.theme && <Row label="Theme" value={selectedBooking.theme} />}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center gap-2">
                      <span>📍</span> Venue
                    </h3>
                    <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-900">
                      {selectedBooking.venueAddress}
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center gap-2">
                      <span>💳</span> Payment
                    </h3>
                    <div className="space-y-2 text-sm">
                      <Row label="Total Price" value={formatPrice(selectedBooking.totalPrice)} />
                      <Row label="Deposit" value={selectedBooking.depositPaid ? "✓ Paid" : "Pending"} />
                      {selectedBooking.depositPaymentMethod && (
                        <Row label="Method" value={selectedBooking.depositPaymentMethod.toUpperCase()} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Customer + Preferences */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center gap-2">
                      <span>👤</span> Customer
                    </h3>
                    <div className="bg-white border rounded-lg p-4 space-y-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {selectedBooking.customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedBooking.customer.name}</p>
                          <p className="text-xs text-gray-500">{selectedBooking.customer.company || "Individual"}</p>
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
                    <h3 className="text-base font-semibold text-gray-900 border-b pb-2 mb-3 flex items-center gap-2">
                      <span>🍽️</span> Preferences & Requests
                    </h3>
                    <div className="space-y-3 text-sm">
                      <Row label="Menu Pref." value={selectedBooking.menuPreference} />
                      <Row label="Service Style" value={selectedBooking.serviceStyle} capitalize />

                      {selectedBooking.specialRequests && (
                        <InfoBox color="yellow" label="Special Requests" value={selectedBooking.specialRequests} />
                      )}
                      {selectedBooking.additionalServices && (
                        <InfoBox color="blue" label="Additional Services" value={selectedBooking.additionalServices} />
                      )}

                      {/* Reschedule info */}
                      {(() => {
                        let notes: any = {};
                        try { notes = selectedBooking.adminNotes ? JSON.parse(selectedBooking.adminNotes) : {}; } catch {}
                        if (!notes.rescheduleCount) return null;
                        return (
                          <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-sm">
                            <span className="font-medium text-amber-800 block mb-1">🗓️ Client Rescheduled</span>
                            {notes.rescheduleReason && <p className="text-amber-700"><strong>Reason:</strong> {notes.rescheduleReason}</p>}
                            {notes.rescheduledFrom && notes.rescheduledTo && (
                              <p className="text-amber-700 text-xs mt-1">{notes.rescheduledFrom} → {notes.rescheduledTo}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Inclusions */}
              {selectedBooking.package && (
                <div className="border-t pt-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📦</span> Package Inclusions
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-1">{selectedBooking.package.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{selectedBooking.package.description}</p>
                    {selectedBooking.package.features?.length > 0 && (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-6">
                        {selectedBooking.package.features.map((f: string, i: number) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>{f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Dishes */}
              {selectedBooking.selectedDishes?.length > 0 && (
                <div className="border-t pt-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>🍳</span> Menu Selection
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(
                      selectedBooking.selectedDishes.reduce((acc: any, d: any) => {
                        if (!acc[d.category]) acc[d.category] = [];
                        acc[d.category].push(d);
                        return acc;
                      }, {})
                    ).map(([cat, dishes]) => (
                      <Card key={cat} className="border-l-4 border-l-primary shadow-sm">
                        <CardHeader className="py-2 px-3 bg-gray-50 border-b">
                          <CardTitle className="text-xs font-bold capitalize text-gray-900">{cat}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                          <ul className="space-y-1">
                            {(dishes as any[]).map((dish, i) => (
                              <li key={i} className="text-sm flex justify-between">
                                <span className="text-gray-700">{dish.name}</span>
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

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => { setIsDetailOpen(false); setIsBookingsOpen(true); }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Bookings
            </Button>
            <Button onClick={() => setIsDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── tiny sub-components ────────────────────────────────────────────────────

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className={`col-span-2 font-medium ${capitalize ? "capitalize" : ""}`}>{value}</span>
    </div>
  );
}

function InfoBox({ color, label, value }: { color: "yellow" | "blue"; label: string; value: string }) {
  if (color === "yellow") {
    return (
      <div className="p-3 rounded-md border border-yellow-100 bg-yellow-50 text-sm">
        <span className="font-medium text-yellow-800 block mb-0.5">{label}:</span>
        <p className="text-yellow-700">{value}</p>
      </div>
    );
  }
  return (
    <div className="p-3 rounded-md border border-blue-100 bg-blue-50 text-sm">
      <span className="font-medium text-blue-800 block mb-0.5">{label}:</span>
      <p className="text-blue-700">{value}</p>
    </div>
  );
}
