import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Edit, FileText, Loader2, Package, Building, Calculator } from "lucide-react";

interface CustomQuote {
  id: number;
  quoteReference: string;
  eventDate: string;
  eventTime: string;
  eventType: string;
  guestCount: number;
  venueAddress: string;
  budget: number;
  theme: string | null;
  description: string | null;
  preferences: string | null;
  specialRequests: string | null;
  status: string;
  proposedPrice: number | null;
  adminNotes: string | null;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
}

export default function CustomQuotesManagement() {
  const [selectedQuote, setSelectedQuote] = useState<CustomQuote | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editQuotedPrice, setEditQuotedPrice] = useState("");
  const [editServiceId, setEditServiceId] = useState<number | null>(null);
  const [editPackageId, setEditPackageId] = useState<number | null>(null);
  const [editVenueId, setEditVenueId] = useState<number | null>(null);
  const [depositPercent, setDepositPercent] = useState<number>(50);
  const [extraChargesPesos, setExtraChargesPesos] = useState<string>("");
  const [menuType, setMenuType] = useState<"package" | "custom">("package");
  const [customPackageName, setCustomPackageName] = useState<string>("");
  const [customPerPersonPesos, setCustomPerPersonPesos] = useState<string>("");
  const [customFeatures, setCustomFeatures] = useState<string>("");
  const [customTheme, setCustomTheme] = useState<string>("");
  const [selectedDishes, setSelectedDishes] = useState<number[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<{id: number, quantity: number}[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery<CustomQuote[]>({
    queryKey: ["/api/custom-quotes"],
  });
  const { data: services = [] } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });
  const { data: allPackages = [] } = useQuery<any[]>({
    queryKey: ["/api/service-packages"],
  });
  const { data: venues = [] } = useQuery<any[]>({
    queryKey: ["/api/venues"],
  });
  const { data: dishes = [] } = useQuery<any[]>({
    queryKey: ["/api/dishes"],
  });
  const { data: addOns = [] } = useQuery<any[]>({
    queryKey: ["/api/add-ons"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; quotedPrice?: number; notes?: string; proposedPackage?: string }) => {
      const res = await apiRequest("PATCH", `/api/custom-quotes/${data.id}/status`, {
        status: data.status,
        quotedPrice: data.quotedPrice,
        notes: data.notes,
        proposedPackage: data.proposedPackage
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-quotes"] });
      toast({
        title: "Quote Updated",
        description: "The quote has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update the quote.",
        variant: "destructive",
      });
    },
  });

  const parseLocalYMD = (dateString: string) => {
    const [y, m, d] = dateString.split("-").map((v) => parseInt(v, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalYMD(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (priceInCents: number) => {
    const pesos = Math.round(priceInCents / 100);
    return `₱${pesos.toLocaleString("en-PH")}`;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewing: "bg-blue-100 text-blue-800",
      revision_requested: "bg-purple-100 text-purple-800",
      quoted: "bg-green-100 text-green-800",
      accepted: "bg-emerald-100 text-emerald-800",
      rejected: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={statusStyles[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const viewQuote = (quote: CustomQuote) => {
    setSelectedQuote(quote);
    setIsViewDialogOpen(true);
  };

  const editQuote = (quote: CustomQuote) => {
    setSelectedQuote(quote);
    setEditStatus(quote.status);
    setEditNotes(quote.adminNotes || "");
    setEditQuotedPrice(quote.proposedPrice ? (quote.proposedPrice / 100).toString() : "");
    setEditServiceId(null);
    setEditPackageId(null);
    setEditVenueId(null);
    setDepositPercent(50);
    setExtraChargesPesos("");
    setMenuType("package");
    setCustomPackageName("");
    setCustomPerPersonPesos("");
    setCustomFeatures("");
    setCustomTheme(quote.theme || "");
    setSelectedDishes([]);
    setSelectedAddOns([]);
    
    // Parse existing proposed package if available
    if (quote.proposedPackage) {
      try {
        const parsed = JSON.parse(quote.proposedPackage);
        if (parsed.theme) setCustomTheme(parsed.theme);
        if (parsed.dishes) setSelectedDishes(parsed.dishes.map((d: any) => d.id));
        if (parsed.addOns) setSelectedAddOns(parsed.addOns.map((a: any) => ({ id: a.id, quantity: a.quantity })));
      } catch (e) {
        console.error("Failed to parse proposedPackage", e);
      }
    }
    
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedQuote) return;
    
    let proposedPackageJson = undefined;
    if (menuType === "custom") {
      const pkgObj = {
        serviceId: finalServiceId,
        theme: customTheme,
        dishes: selectedDishes.map(id => {
          const dish = dishes.find((d: any) => d.id === id);
          return dish ? { id: dish.id, name: dish.name, category: dish.category } : null;
        }).filter(Boolean),
        addOns: selectedAddOns.map(ao => {
          const addon = addOns.find((a: any) => a.id === ao.id);
          return addon ? { id: addon.id, name: addon.name, quantity: ao.quantity, totalPrice: addon.price * ao.quantity } : null;
        }).filter(Boolean),
        customFeatures
      };
      proposedPackageJson = JSON.stringify(pkgObj);
    }
    
    updateMutation.mutate({
      id: selectedQuote.id,
      status: editStatus,
      quotedPrice: editQuotedPrice ? Math.round(parseFloat(editQuotedPrice) * 100) : undefined,
      notes: editNotes || undefined,
      proposedPackage: proposedPackageJson
    });
  };

  const filteredPackages = useMemo(() => {
    if (!editServiceId) return allPackages;
    return allPackages.filter((p: any) => p.serviceId === editServiceId);
  }, [editServiceId, allPackages]);

  const calculatedTotals = useMemo(() => {
    const guestCount = selectedQuote?.guestCount || 0;
    let total = 0;
    const pkg = editPackageId ? filteredPackages.find((p: any) => p.id === editPackageId) : null;
    const svc = editServiceId ? services.find((s: any) => s.id === editServiceId) : null;
    const v = editVenueId ? venues.find((vv: any) => vv.id === editVenueId) : null;
    if (menuType === "custom") {
      const cpp = customPerPersonPesos ? Math.round(parseFloat(customPerPersonPesos) * 100) : 0;
      total += cpp * guestCount;
    } else if (pkg) {
      total += pkg.pricePerPerson || 0;
    } else if (svc) {
      total += (svc.basePrice || 0) * guestCount;
    }
    if (v) {
      total += v.price || 0;
    }
    const extra = extraChargesPesos ? Math.round(parseFloat(extraChargesPesos) * 100) : 0;
    total += extra;
    
    // Add selected Add-ons total
    if (menuType === "custom") {
      selectedAddOns.forEach(ao => {
        const addon = addOns.find((a: any) => a.id === ao.id);
        if (addon) {
          total += addon.price * ao.quantity;
        }
      });
    }

    const deposit = Math.round(total * (depositPercent / 100));
    return { total, deposit };
  }, [menuType, customPerPersonPesos, editPackageId, editServiceId, editVenueId, venues, services, filteredPackages, selectedQuote, depositPercent, extraChargesPesos, selectedAddOns, addOns]);

  const finalServiceId = useMemo(() => {
    if (editServiceId) return editServiceId;
    if (editPackageId) {
      const pkg = allPackages.find((p: any) => p.id === editPackageId);
      return pkg ? pkg.serviceId : null;
    }
    const fallback = services.length > 0 ? services[0].id : null;
    return fallback;
  }, [editServiceId, editPackageId, allPackages, services]);

  const applyCalculatedToQuote = () => {
    if (calculatedTotals.total > 0) {
      setEditQuotedPrice((calculatedTotals.total / 100).toString());
      const pkg = editPackageId ? filteredPackages.find((p: any) => p.id === editPackageId) : null;
      const svc = editServiceId ? services.find((s: any) => s.id === editServiceId) : null;
      const v = editVenueId ? venues.find((vv: any) => vv.id === editVenueId) : null;
      const lines = [
        "Proposed Package:",
        menuType === "custom"
          ? `• Custom: ${customPackageName || "Custom Package"} (₱${customPerPersonPesos || "0"} x ${selectedQuote?.guestCount} guests)`
          : pkg
            ? `• Package: ${pkg.name} (${formatPrice(pkg.pricePerPerson)})`
            : svc
              ? `• Service: ${svc.name} (₱${Math.round((svc.basePrice || 0) / 100)} x ${selectedQuote?.guestCount} guests)`
              : "• Service: Custom",
        menuType === "custom" && customFeatures ? `• Includes: ${customFeatures}` : "",
        v ? `• Venue: ${v.name} (${formatPrice(v.price)})` : "• Venue: Client-provided",
        extraChargesPesos ? `• Extra: ₱${extraChargesPesos}` : "",
        `Total: ${formatPrice(calculatedTotals.total)}`,
        `Deposit (${depositPercent}%): ${formatPrice(calculatedTotals.deposit)}`
      ].filter(Boolean);
      setEditNotes(lines.join("\n"));
    }
  };

  const applyClientBudget = () => {
    if (!selectedQuote || !selectedQuote.budget) return;
    const guestCount = selectedQuote.guestCount || 0;
    const budgetPesos = Math.round(selectedQuote.budget / 100);
    if (menuType === "custom" && guestCount > 0) {
      const perPerson = Math.floor(budgetPesos / guestCount);
      setCustomPerPersonPesos(perPerson.toString());
    }
    setEditQuotedPrice(budgetPesos.toString());
    const lines = [
      "Proposed Package:",
      menuType === "custom"
        ? `• Custom: ${customPackageName || "Custom Package"} (₱${customPerPersonPesos || "0"} x ${selectedQuote?.guestCount} guests)`
        : "• Based on client budget",
      `Total (client budget): ${formatPrice(selectedQuote.budget)}`,
      `Deposit (${depositPercent}%): ${formatPrice(Math.round(selectedQuote.budget * (depositPercent / 100)))}`
    ].filter(Boolean);
    setEditNotes(lines.join("\n"));
  };

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuote) throw new Error("No quote selected");
      if (!finalServiceId) throw new Error("Service is required");
      const totalCents = editQuotedPrice ? Math.round(parseFloat(editQuotedPrice) * 100) : (selectedQuote.proposedPrice || 0);
      const depositCents = Math.round(totalCents * (depositPercent / 100));
      const bookingPayload = {
        booking: {
          serviceId: finalServiceId,
          packageId: editPackageId || undefined,
          eventDate: selectedQuote.eventDate,
          eventType: selectedQuote.eventType,
          eventTime: selectedQuote.eventTime || "Fixed",
          guestCount: selectedQuote.guestCount,
          venueAddress: selectedQuote.venueAddress,
          venueId: editVenueId || undefined,
          menuPreference: menuType,
          serviceStyle: "buffet",
          theme: selectedQuote.theme || "",
          specialRequests: selectedQuote.specialRequests || "",
          totalPrice: totalCents,
          depositAmount: depositCents,
          status: "pending_approval",
          paymentStatus: "pending",
          additionalServices: menuType === "custom" ? (customFeatures || "") : "",
          adminNotes: editNotes || "",
        },
        customer: {
          name: selectedQuote.customer.name,
          email: selectedQuote.customer.email,
          phone: selectedQuote.customer.phone,
          company: "",
        },
        selectedDishes: [],
      };
      const res = await apiRequest("POST", "/api/bookings", bookingPayload);
      return res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({
        title: "Booking Created",
        description: `Reference: ${created.bookingReference}. Share this with client to pay the deposit.`,
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      const msg = error?.message || "Could not create booking from quote.";
      toast({
        title: "Creation Failed",
        description: msg.includes("Service is required") ? "Please select a service or a package." : msg,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Quote Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg font-medium">Custom Quote Requests</CardTitle>
          </div>
          <Badge variant="outline">{quotes.length} quotes</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {quotes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No custom quote requests yet.</p>
              <p className="text-sm mt-1">Custom quotes will appear here when customers submit them.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-sm">
                      {quote.quoteReference}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{quote.customer.name}</div>
                        <div className="text-xs text-gray-500">{quote.customer.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{quote.eventType}</div>
                        <div className="text-xs text-gray-500">{formatDate(quote.eventDate)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{quote.guestCount}</TableCell>
                    <TableCell>{formatPrice(quote.budget)}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => viewQuote(quote)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => editQuote(quote)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quote Details</DialogTitle>
            <DialogDescription>
              {selectedQuote?.quoteReference}
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Customer</h4>
                <p>{selectedQuote.customer.name}</p>
                <p className="text-sm text-gray-600">{selectedQuote.customer.email}</p>
                <p className="text-sm text-gray-600">{selectedQuote.customer.phone}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Event Details</h4>
                <p>{selectedQuote.eventType}</p>
                <p className="text-sm text-gray-600">{formatDate(selectedQuote.eventDate)} at {selectedQuote.eventTime}</p>
                <p className="text-sm text-gray-600">{selectedQuote.guestCount} guests</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Venue</h4>
                <p className="text-sm">{selectedQuote.venueAddress}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Budget</h4>
                <p className="text-lg font-bold text-primary">{formatPrice(selectedQuote.budget)}</p>
              </div>
              {selectedQuote.theme && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Theme</h4>
                  <p className="text-sm">{selectedQuote.theme}</p>
                </div>
              )}
              {selectedQuote.description && (
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Description</h4>
                  <p className="text-sm">{selectedQuote.description}</p>
                </div>
              )}
              {selectedQuote.specialRequests && (
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Special Requests</h4>
                  <p className="text-sm">{selectedQuote.specialRequests}</p>
                </div>
              )}
              {selectedQuote.proposedPrice && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Quoted Price</h4>
                  <p className="text-lg font-bold text-green-600">{formatPrice(selectedQuote.proposedPrice)}</p>
                </div>
              )}
              {selectedQuote.adminNotes && (
                <div className="col-span-2">
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Admin Response</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedQuote.adminNotes}</p>
                </div>
              )}
              {selectedQuote.clientMessage && (
                <div className="col-span-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <h4 className="font-semibold text-sm text-purple-800 mb-1 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Client Revision Request
                  </h4>
                  <p className="text-sm text-purple-900 whitespace-pre-wrap">{selectedQuote.clientMessage}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => { setIsViewDialogOpen(false); if (selectedQuote) editQuote(selectedQuote); }}>
              Edit Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Update Quote</DialogTitle>
            <DialogDescription>
              Update the status and add your proposal for this quote request.
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Menu Type</Label>
                    <Select value={menuType} onValueChange={(v) => setMenuType((v as "package" | "custom") || "package")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="package">Package</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Service</Label>
                    <Select value={(editServiceId ?? "").toString()} onValueChange={(v) => { if (v === "none") { setEditServiceId(null); setEditPackageId(null); } else { const id = parseInt(v); setEditServiceId(isNaN(id) ? null : id); setEditPackageId(null); } }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {services.map((s: any) => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Package</Label>
                    <Select value={(editPackageId ?? "").toString()} onValueChange={(v) => { if (v === "none") { setEditPackageId(null); } else { const id = parseInt(v); setEditPackageId(isNaN(id) ? null : id); } }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a package (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {filteredPackages.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Venue</Label>
                    <Select value={(editVenueId ?? "").toString()} onValueChange={(v) => { if (v === "none") { setEditVenueId(null); } else { const id = parseInt(v); setEditVenueId(isNaN(id) ? null : id); } }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a venue (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Client-provided</SelectItem>
                        {venues.map((vv: any) => (
                          <SelectItem key={vv.id} value={vv.id.toString()}>{vv.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {menuType === "custom" && (
                    <div className="col-span-full border-t border-b py-4 my-4 space-y-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Custom Package Builder</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label>Agreed Theme / Motif</Label>
                          <Input type="text" placeholder="e.g., Rustic, Minimalist, Blue & Gold" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} />
                        </div>
                        <div>
                          <Label>Base Custom Package Name (Optional)</Label>
                          <Input type="text" placeholder="e.g., Birthday Deluxe" value={customPackageName} onChange={(e) => setCustomPackageName(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Select Dishes</Label>
                        <ScrollArea className="h-64 rounded-md border p-4">
                          {["main", "vegetable", "appetizer", "soup", "dessert", "drink"].map(cat => {
                            const categoryDishes = dishes.filter((d: any) => d.category === cat);
                            if (categoryDishes.length === 0) return null;
                            return (
                              <div key={cat} className="mb-6">
                                <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider mb-3">{cat}s</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {categoryDishes.map((dish: any) => (
                                    <div key={dish.id} className="flex items-start space-x-2">
                                      <Checkbox 
                                        id={`dish-${dish.id}`} 
                                        checked={selectedDishes.includes(dish.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedDishes([...selectedDishes, dish.id]);
                                          } else {
                                            setSelectedDishes(selectedDishes.filter(id => id !== dish.id));
                                          }
                                        }}
                                      />
                                      <label htmlFor={`dish-${dish.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {dish.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </ScrollArea>
                        <p className="text-xs text-gray-500">Selected: {selectedDishes.length} dishes</p>
                      </div>

                      <div className="space-y-3">
                        <Label>Select Add-ons</Label>
                        <ScrollArea className="h-48 rounded-md border p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {addOns.map((addon: any) => {
                              const selected = selectedAddOns.find(a => a.id === addon.id);
                              return (
                                <div key={addon.id} className="flex flex-col gap-2 p-3 border rounded bg-gray-50/50">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">{addon.name}</label>
                                    <span className="text-xs font-bold text-primary">{formatPrice(addon.price)}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <Checkbox 
                                      id={`addon-${addon.id}`}
                                      checked={!!selected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedAddOns([...selectedAddOns, { id: addon.id, quantity: 1 }]);
                                        } else {
                                          setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
                                        }
                                      }}
                                    />
                                    <label htmlFor={`addon-${addon.id}`} className="text-xs text-gray-600">Include</label>
                                    {selected && (
                                      <div className="flex items-center gap-2 ml-auto">
                                        <span className="text-xs">Qty:</span>
                                        <Input 
                                          type="number" 
                                          min="1" 
                                          className="h-7 w-16 px-2 py-0 text-sm"
                                          value={selected.quantity}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setSelectedAddOns(selectedAddOns.map(a => a.id === addon.id ? { ...a, quantity: val } : a));
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label>Custom Base Price Per Person (₱)</Label>
                          <Input type="number" placeholder="e.g. 500" value={customPerPersonPesos} onChange={(e) => setCustomPerPersonPesos(e.target.value)} />
                          <p className="text-xs text-gray-500 mt-1">This will be multiplied by {selectedQuote?.guestCount} guests.</p>
                        </div>
                        <div>
                          <Label>Additional Included Services / Notes</Label>
                          <Textarea placeholder="e.g. Basic sound system included..." value={customFeatures} onChange={(e) => setCustomFeatures(e.target.value)} rows={2} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Extra Charges (₱)</Label>
                    <Input type="number" placeholder="0" value={extraChargesPesos} onChange={(e) => setExtraChargesPesos(e.target.value)} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="revision_requested">Revision Requested</SelectItem>
                        <SelectItem value="quoted">Quoted</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">Pricing Summary</span>
                    </div>
                    <div className="text-sm">
                      <p>Guests: {selectedQuote.guestCount}</p>
                      <p>Total: <span className="font-bold text-primary">{formatPrice(calculatedTotals.total)}</span></p>
                      <p>Deposit ({depositPercent}%): <span className="font-bold text-secondary">{formatPrice(calculatedTotals.deposit)}</span></p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deposit Percent</Label>
                    <Input type="number" min="0" max="100" value={depositPercent} onChange={(e) => setDepositPercent(parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quoted Price (₱)</Label>
                    <Input
                      type="number"
                      placeholder="Enter your quoted price"
                      value={editQuotedPrice}
                      onChange={(e) => setEditQuotedPrice(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={applyCalculatedToQuote}>
                      <Calculator className="h-4 w-4 mr-2" />
                      Apply Calculated Proposal
                    </Button>
                    <Button variant="outline" onClick={applyClientBudget} disabled={!selectedQuote?.budget}>
                      Use Client Budget
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label>Admin Response</Label>
                <Textarea
                  placeholder="Describe the package/services you can offer based on their request..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={5}
                />
                <p className="text-xs text-gray-500 mt-1">This message will be sent to the client.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            {(editStatus === "accepted" || editStatus === "quoted") && (editQuotedPrice || selectedQuote?.proposedPrice) && (
              <Button onClick={() => createBookingMutation.mutate()} disabled={createBookingMutation.isPending || !finalServiceId}>
                {createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Booking"
                )}
              </Button>
            )}
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Quote"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
