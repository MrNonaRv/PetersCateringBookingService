import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "../components/CustomerView/Navigation";
import Footer from "../components/CustomerView/Footer";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { PaymentMethods } from "../components/CustomerView/PaymentMethods";
import { Loader2, Search, CheckCircle2, ArrowRight, Calendar, Users, Utensils, CreditCard, ChevronLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function PayDeposit() {
  const [bookingReference, setBookingReference] = useState("");
  const [searchedReference, setSearchedReference] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: booking, isLoading, isError, refetch } = useQuery({
    queryKey: ["booking", searchedReference],
    queryFn: async () => {
      if (!searchedReference) return null;
      const res = await fetch(`/api/bookings/reference/${searchedReference}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Booking not found");
        }
        throw new Error("Failed to fetch booking");
      }
      return res.json();
    },
    enabled: !!searchedReference,
    retry: false,
  });

  // Effect to advance step when booking is found
  useEffect(() => {
    if (booking) {
      setCurrentStep(2);
    }
  }, [booking]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingReference.trim()) {
      toast({
        title: "Error",
        description: "Please enter a booking reference code",
        variant: "destructive",
      });
      return;
    }
    setSearchedReference(bookingReference.trim());
    setSelectedMethod(null);
  };

  const processPaymentMutation = useMutation({
    mutationFn: async (data: { bookingId: number, paymentMethod: string }) => {
      // Create checkout session
      const res = await fetch("/api/paymongo/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: data.bookingId,
          paymentType: "deposit",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to initiate payment");
      }

      return res.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
         toast({
          title: "Success",
          description: "Payment initiated successfully.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProceedPayment = () => {
    if (!booking || !selectedMethod) return;

    if (selectedMethod === 'cash') {
      toast({
        title: "Cash Payment",
        description: "For cash payments, please visit our office to pay the deposit.",
      });
      return;
    }

    if (selectedMethod === 'bank_transfer' || selectedMethod === 'bank_bdo' || selectedMethod === 'bank_bpi') {
      toast({
        title: "Bank Transfer",
        description: "Please transfer the amount to the account shown above and send proof of payment to our email.",
        duration: 5000,
      });
      return;
    }

    // Check if selected method is digital wallet (likely PayMongo supported)
    if (selectedMethod === 'gcash' || selectedMethod === 'paymaya' || selectedMethod === 'grab_pay') {
       processPaymentMutation.mutate({
        bookingId: booking.id,
        paymentMethod: selectedMethod
      });
    } else {
      // Fallback to PayMongo for others
      processPaymentMutation.mutate({
        bookingId: booking.id,
        paymentMethod: selectedMethod
      });
    }
  };

  const handleReset = () => {
    setSearchedReference("");
    setBookingReference("");
    setSelectedMethod(null);
    setCurrentStep(1);
    refetch(); // Clear query cache basically
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navigation onBookNow={() => setLocation("/")} />

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">

          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Pay Your Deposit</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Secure your reservation by settling the initial deposit. Enter your booking reference to get started.
            </p>
          </div>

          {/* Stepper */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-colors ${currentStep >= 1 ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-400'}`}>
                1
              </div>
              <div className={`w-16 h-1 rounded-full transition-colors ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-colors ${currentStep >= 2 ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-400'}`}>
                2
              </div>
              <div className={`w-16 h-1 rounded-full transition-colors ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-colors ${currentStep >= 3 ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-400'}`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Search */}
          {currentStep === 1 && (
            <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
              <Card className="shadow-lg border-t-4 border-t-primary">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Find Your Booking</CardTitle>
                  <CardDescription>
                    Enter the unique reference code sent to your mobile number.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                      <Label htmlFor="reference" className="sr-only">Booking Reference</Label>
                      <Input
                        id="reference"
                        placeholder="e.g., PCB-123456789"
                        value={bookingReference}
                        onChange={(e) => setBookingReference(e.target.value.toUpperCase())}
                        className="h-14 text-lg text-center tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal"
                        maxLength={20}
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full h-12 text-lg font-medium shadow-md transition-transform hover:scale-[1.02]" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" />
                          Find Booking
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {isError && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center animate-in slide-in-from-top-2">
                  <p className="font-medium flex items-center justify-center gap-2">
                    <span className="text-xl">⚠️</span> Booking not found.
                  </p>
                  <p className="text-sm mt-1">Please check your reference code and try again.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2 & 3: Details & Payment */}
          {currentStep >= 2 && booking && (
            <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-500">

              {/* Left Column: Booking Summary (Receipt Style) */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Button variant="ghost" onClick={handleReset} className="mb-4 pl-0 hover:pl-2 transition-all text-gray-500 hover:text-primary">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Search
                  </Button>

                  <Card className="shadow-lg overflow-hidden border-0 ring-1 ring-gray-200">
                    <div className="bg-primary/5 p-6 border-b border-primary/10 text-center">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Booking Reference</h3>
                      <p className="text-2xl font-mono font-bold text-gray-900 mt-1">{booking.bookingReference}</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-3 capitalize
                        ${booking.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                          booking.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {booking.status.replace('_', ' ')}
                      </div>
                    </div>

                    <CardContent className="p-0">
                      <div className="p-6 space-y-6">
                        {/* Event Details */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Event Date</p>
                              <p className="font-semibold text-gray-900">{formatDate(booking.eventDate)}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Utensils className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Event Type</p>
                              <p className="font-semibold text-gray-900 capitalize">{booking.eventType}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-500">Guest Count</p>
                              <p className="font-semibold text-gray-900">{booking.guestCount} Guests</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Price Breakdown */}
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Price</span>
                            <span className="font-medium">₱{(booking.totalPrice / 100).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed">
                            <span className="text-primary">Deposit Due (50%)</span>
                            <span className="text-primary">₱{Math.round((booking.totalPrice * 0.5) / 100).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Status Footer */}
                      <div className="bg-gray-50 p-4 border-t text-center">
                        {booking.depositPaid ? (
                           <div className="flex items-center justify-center text-green-700 font-medium">
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Deposit Paid
                           </div>
                        ) : (
                           <div className="flex items-center justify-center text-orange-600 font-medium">
                              <CreditCard className="w-5 h-5 mr-2" />
                              Payment Pending
                           </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column: Payment Methods & Action */}
              <div className="lg:col-span-2 space-y-8">
                {booking.depositPaid ? (
                   <Card className="border-green-200 bg-green-50 shadow-sm">
                     <CardContent className="pt-6 text-center py-12">
                       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                         <CheckCircle2 className="w-8 h-8 text-green-600" />
                       </div>
                       <h2 className="text-2xl font-bold text-green-800 mb-2">Deposit Successfully Paid!</h2>
                       <p className="text-green-700 max-w-md mx-auto">
                         Thank you for your payment. Your booking is now confirmed. We will contact you shortly for further details regarding your event.
                       </p>
                       <Button className="mt-6 bg-green-600 hover:bg-green-700" onClick={() => setLocation("/")}>
                         Return to Home
                       </Button>
                     </CardContent>
                   </Card>
                ) : (
                  <>
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                        <h2 className="text-xl font-bold text-gray-900">Select Payment Method</h2>
                      </div>

                      <PaymentMethods 
                        showSelection={true} 
                        selectedMethod={selectedMethod || undefined}
                        onSelectMethod={(method) => {
                          setSelectedMethod(method.id);
                          setCurrentStep(3); // Auto advance step visually
                        }}
                      />
                    </div>

                    <div className={`transition-all duration-500 ${selectedMethod ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
                      <div className="bg-white rounded-xl shadow-lg border border-primary/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                           <h3 className="text-lg font-bold text-gray-900">Ready to Pay?</h3>
                           <p className="text-sm text-gray-600">You will be redirected to a secure payment gateway.</p>
                        </div>
                        <Button 
                          size="lg" 
                          className="w-full md:w-auto px-8 h-12 text-lg shadow-md hover:shadow-lg transition-all"
                          disabled={!selectedMethod || processPaymentMutation.isPending}
                          onClick={handleProceedPayment}
                        >
                          {processPaymentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Proceed to Payment
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
