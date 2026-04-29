import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, CreditCard, XCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function MockPayment() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  if (!searchParams) return null;

  const bookingId = searchParams.get("bookingId");
  const amount = searchParams.get("amount");
  const paymentType = searchParams.get("paymentType");
  const ref = searchParams.get("ref");
  const successUrl = searchParams.get("successUrl") || `/pay-deposit?ref=${ref}`;
  const cancelUrl = searchParams.get("cancelUrl") || `/pay-deposit?ref=${ref}`;

  const formattedAmount = amount ? (parseInt(amount) / 100).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  }) : "₱0.00";

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/mock-payment/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          paymentType,
        }),
      });

      if (!res.ok) throw new Error("Failed to process mock payment");
      
      toast({
        title: "Payment Successful",
        description: "Your simulated payment was processed.",
      });

      // Redirect back to successUrl
      window.location.href = successUrl;
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Something went wrong while processing the simulated payment.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    window.location.href = cancelUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Helmet>
        <title>Mock Payment Gateway</title>
      </Helmet>

      <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Secure Checkout</CardTitle>
          <CardDescription className="text-orange-500 font-semibold mt-2">
            Simulated Testing Environment
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Booking Reference:</span>
              <span className="font-mono font-bold text-gray-900">{ref}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>Payment Type:</span>
              <span className="capitalize font-medium">{paymentType}</span>
            </div>
            <div className="border-t border-gray-300 pt-4 flex justify-between items-center">
              <span className="text-gray-700 font-medium">Total Amount Due:</span>
              <span className="text-2xl font-bold text-primary">{formattedAmount}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-4 rounded-lg">
            <strong>Note:</strong> You are in a testing environment. No real funds will be charged. Clicking "Approve" will simulate a successful payment and update the booking in the database.
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pb-8">
          <Button 
            className="w-full h-12 text-lg shadow-md hover:shadow-lg transition-transform hover:scale-[1.02]" 
            size="lg"
            onClick={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
            ) : (
              <><CreditCard className="mr-2 h-5 w-5" /> Approve Payment</>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12"
            onClick={handleCancel}
            disabled={isProcessing}
          >
            <XCircle className="mr-2 h-5 w-5" /> Cancel Payment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
