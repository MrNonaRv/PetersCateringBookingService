import { useState } from "react";
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
import { Eye, Edit, FileText, Loader2 } from "lucide-react";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery<CustomQuote[]>({
    queryKey: ["/api/custom-quotes"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; status: string; quotedPrice?: number; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/custom-quotes/${data.id}/status`, {
        status: data.status,
        quotedPrice: data.quotedPrice,
        notes: data.notes
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
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedQuote) return;
    updateMutation.mutate({
      id: selectedQuote.id,
      status: editStatus,
      quotedPrice: editQuotedPrice ? Math.round(parseFloat(editQuotedPrice) * 100) : undefined,
      notes: editNotes || undefined,
    });
  };

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
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Admin Notes</h4>
                  <p className="text-sm">{selectedQuote.adminNotes}</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Quote</DialogTitle>
            <DialogDescription>
              Update the status and add your proposal for this quote request.
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="quoted">Quoted</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quoted Price (₱)</Label>
                <Input
                  type="number"
                  placeholder="Enter your quoted price"
                  value={editQuotedPrice}
                  onChange={(e) => setEditQuotedPrice(e.target.value)}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add notes about this quote..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
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
