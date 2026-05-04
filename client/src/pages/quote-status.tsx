import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/CustomerView/Navigation";
import Footer from "@/components/CustomerView/Footer";
import BookingModal from "@/components/CustomerView/BookingModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, CheckCircle2, XCircle, Clock, Loader2, AlertCircle, MessageSquare } from "lucide-react";

export default function QuoteStatus() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [searchRef, setSearchRef] = useState("");
  const [isRevising, setIsRevising] = useState(false);
  const [clientMessage, setClientMessage] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: quote, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/custom-quotes/reference/${searchRef}`],
    enabled: searchRef.length > 5, // Only search when ref is reasonably long
    retry: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) return;
    setSearchRef(reference.trim());
  };

  const respondMutation = useMutation({
    mutationFn: async (payload: { status: 'accepted' | 'rejected' | 'revision_requested', clientMessage?: string }) => {
      const res = await apiRequest("PATCH", `/api/custom-quotes/reference/${searchRef}/respond`, payload);
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (variables.status === 'accepted') {
        toast({
          title: "Quote Accepted!",
          description: "Booking created successfully. Redirecting to payment...",
        });
        if (data.bookingReference) {
          setTimeout(() => setLocation(`/pay-deposit?ref=${data.bookingReference}`), 1500);
        }
      } else if (variables.status === 'revision_requested') {
        toast({
          title: "Revision Requested",
          description: "We've received your request and will update your proposal soon.",
        });
        setIsRevising(false);
        setClientMessage("");
      } else {
        toast({
          title: "Quote Declined",
          description: "We've recorded your decision. Feel free to request another quote anytime.",
        });
      }
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quote status. Please try again later.",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, { class: string, icon: any, label: string }> = {
      new: { class: "bg-blue-100 text-blue-800", icon: Clock, label: "Received" },
      pending: { class: "bg-blue-100 text-blue-800", icon: Clock, label: "Pending" },
      reviewing: { class: "bg-yellow-100 text-yellow-800", icon: Search, label: "Under Review" },
      revision_requested: { class: "bg-purple-100 text-purple-800", icon: MessageSquare, label: "Revision Requested" },
      quoted: { class: "bg-green-100 text-green-800", icon: FileText, label: "Quoted" },
      accepted: { class: "bg-emerald-100 text-emerald-800", icon: CheckCircle2, label: "Accepted" },
      rejected: { class: "bg-gray-100 text-gray-800", icon: XCircle, label: "Declined" },
      expired: { class: "bg-gray-100 text-gray-800", icon: Clock, label: "Expired" },
    };
    
    const style = statusStyles[status] || statusStyles.pending;
    const Icon = style.icon;

    return (
      <Badge className={`${style.class} flex items-center gap-1.5 px-3 py-1 text-sm`}>
        <Icon className="h-4 w-4" />
        {style.label}
      </Badge>
    );
  };

  const formatPrice = (priceInCents: number) => {
    return `₱${Math.round(priceInCents / 100).toLocaleString("en-PH")}`;
  };

  const parseLocalYMD = (dateString: string) => {
    const [y, m, d] = dateString.split("-").map((v) => parseInt(v, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalYMD(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navigation onBookNow={() => setIsBookingModalOpen(true)} />
      
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-heading font-bold text-primary">Check Quote Status</h1>
            <p className="text-gray-600 font-accent max-w-lg mx-auto">
              Enter the reference number you received when submitting your custom quote request to check its current status.
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="flex-grow relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="e.g. QUO-1234567890-ABCD" 
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="pl-10 font-mono"
                  />
                </div>
                <Button type="submit" disabled={!reference.trim()}>
                  Check Status
                </Button>
              </form>
            </CardContent>
          </Card>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Searching for your quote...</p>
            </div>
          )}

          {error && searchRef && (
            <div className="bg-red-50 text-red-800 p-6 rounded-lg flex items-start gap-4 border border-red-100">
              <AlertCircle className="h-6 w-6 shrink-0 mt-0.5 text-red-500" />
              <div>
                <h3 className="font-semibold text-lg">Quote Not Found</h3>
                <p className="mt-1 text-red-700">
                  We couldn't find a quote with reference number <strong className="font-mono">{searchRef}</strong>. 
                  Please check the number and try again.
                </p>
              </div>
            </div>
          )}

          {quote && !isLoading && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="shadow-md border-0 overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Reference Number</p>
                    <p className="font-mono font-bold text-lg text-primary">{quote.quoteReference}</p>
                  </div>
                  <div>
                    {getStatusBadge(quote.status)}
                  </div>
                </div>
                
                <CardContent className="p-6 space-y-6">
                  {/* Status Messages */}
                  {['new', 'pending'].includes(quote.status) && (
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-md">
                      <p className="font-medium">Your request has been received.</p>
                      <p className="text-sm mt-1">We are currently assigning it to our planning team.</p>
                    </div>
                  )}
                  
                  {quote.status === 'reviewing' && (
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md">
                      <p className="font-medium">We are reviewing your requirements.</p>
                      <p className="text-sm mt-1">Our team is putting together a custom package for your event. We'll post our proposal here soon.</p>
                    </div>
                  )}

                  {quote.status === 'revision_requested' && (
                    <div className="bg-purple-50 text-purple-800 p-4 rounded-md">
                      <p className="font-medium">We are reviewing your requested changes.</p>
                      <p className="text-sm mt-1 mb-3">Our team will update your proposal based on your feedback.</p>
                      
                      {quote.clientMessage && (
                        <div className="bg-white/60 p-3 rounded text-sm border border-purple-100">
                          <p className="text-xs font-semibold text-purple-600 mb-1">Your Request:</p>
                          <p>{quote.clientMessage}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {quote.status === 'quoted' && (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-6 space-y-4">
                      <div>
                        <h3 className="text-green-800 font-bold text-lg">Proposal Ready!</h3>
                        <p className="text-green-700 text-sm">We've reviewed your request and prepared a proposal.</p>
                      </div>
                      
                      <div className="bg-white rounded p-4 border border-green-100">
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 font-medium mb-1">Proposed Total Price</p>
                          <p className="text-3xl font-bold text-primary">{formatPrice(quote.proposedPrice)}</p>
                        </div>
                        
                        {(() => {
                          let packageDetails = null;
                          if (quote.proposedPackage) {
                            try {
                              packageDetails = JSON.parse(quote.proposedPackage);
                            } catch (e) {
                              console.error("Failed to parse proposedPackage", e);
                            }
                          }

                          return (
                            <div className="space-y-6">
                              {packageDetails ? (
                                <>
                                  {packageDetails.theme && (
                                    <div className="pt-4 border-t">
                                      <p className="text-sm text-gray-500 font-medium mb-1">Agreed Theme / Motif</p>
                                      <p className="font-medium text-gray-900">{packageDetails.theme}</p>
                                    </div>
                                  )}

                                  {packageDetails.dishes && packageDetails.dishes.length > 0 && (
                                    <div className="pt-4 border-t">
                                      <p className="text-sm text-gray-500 font-medium mb-3">Included Menu</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {packageDetails.dishes.map((dish: any) => (
                                          <div key={dish.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                            <div>
                                              <p className="text-sm font-medium leading-none">{dish.name}</p>
                                              <p className="text-xs text-gray-500 mt-1 uppercase">{dish.category}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {packageDetails.addOns && packageDetails.addOns.length > 0 && (
                                    <div className="pt-4 border-t">
                                      <p className="text-sm text-gray-500 font-medium mb-3">Included Equipment & Add-ons</p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {packageDetails.addOns.map((addon: any) => (
                                          <div key={addon.id} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-sm font-medium">{addon.name}</p>
                                            <p className="text-xs bg-white px-2 py-1 rounded border">Qty: {addon.quantity}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {packageDetails.customFeatures && (
                                    <div className="pt-4 border-t">
                                      <p className="text-sm text-gray-500 font-medium mb-2">Additional Notes / Services</p>
                                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-100">
                                        {packageDetails.customFeatures}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                quote.adminNotes && (
                                  <div className="pt-4 border-t">
                                    <p className="text-sm text-gray-500 font-medium mb-2">Message & Details</p>
                                    <div className="text-sm text-gray-700 whitespace-pre-wrap bg-slate-50 p-3 rounded">
                                      {quote.adminNotes}
                                    </div>
                                  </div>
                                )
                              )}
                              
                              {packageDetails && quote.adminNotes && (
                                <div className="pt-4 border-t">
                                  <p className="text-sm text-gray-500 font-medium mb-2">Message from our Team</p>
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50/50 p-3 rounded border border-blue-100">
                                    {quote.adminNotes}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {quote.status === 'accepted' && (
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-md flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
                      <div>
                        <p className="font-medium">You've accepted this proposal!</p>
                        <p className="text-sm mt-1">Our team will be in touch shortly to finalize the booking details and arrange the deposit.</p>
                      </div>
                    </div>
                  )}

                  {/* Event Summary */}
                  <div>
                    <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3">Event Summary</h4>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <div>
                        <p className="text-gray-500">Event Type</p>
                        <p className="font-medium">{quote.eventType}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">{formatDate(quote.eventDate)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Guests</p>
                        <p className="font-medium">{quote.guestCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Venue</p>
                        <p className="font-medium line-clamp-1" title={quote.venueAddress}>{quote.venueAddress || "Not specified"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {quote.status === 'quoted' && !isRevising && (
                  <CardFooter className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsRevising(true)}
                    >
                      Request Changes
                    </Button>
                    <div className="flex justify-end gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                      <Button 
                        variant="outline" 
                        onClick={() => respondMutation.mutate({ status: 'rejected' })}
                        disabled={respondMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        Decline
                      </Button>
                      <Button 
                        onClick={() => respondMutation.mutate({ status: 'accepted' })}
                        disabled={respondMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white flex-grow sm:flex-grow-0"
                      >
                        {respondMutation.isPending && respondMutation.variables?.status === 'accepted' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Accept & Book Now
                      </Button>
                    </div>
                  </CardFooter>
                )}

                {isRevising && (
                  <CardFooter className="bg-purple-50 px-6 py-6 flex flex-col gap-4 border-t border-purple-100 animate-in slide-in-from-top-2">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-purple-900 mb-2">
                        What would you like to change?
                      </label>
                      <Textarea 
                        placeholder="e.g. Can we remove the dessert to lower the cost? / Can we add 20 more guests?"
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        className="bg-white border-purple-200 focus-visible:ring-purple-500"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-3 w-full">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setIsRevising(false);
                          setClientMessage("");
                        }}
                        disabled={respondMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => respondMutation.mutate({ status: 'revision_requested', clientMessage })}
                        disabled={!clientMessage.trim() || respondMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {respondMutation.isPending && respondMutation.variables?.status === 'revision_requested' && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Submit Revision Request
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </div>
  );
}
