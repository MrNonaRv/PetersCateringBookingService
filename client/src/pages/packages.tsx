import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import BookingModal from "@/components/CustomerView/BookingModal";
import { useToast } from "@/hooks/use-toast";
import { Check, Info, Package as PackageIcon } from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  featured: boolean;
}

interface ServicePackage {
  id: number;
  serviceId: number;
  name: string;
  description: string;
  pricePerPerson: number;
  minGuests: number;
  maxGuests: number | null;
  features: string[];
  sortOrder?: number;
}

export default function Packages() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recommended" | "price_asc" | "price_desc" | "name_asc">("recommended");
  const [initialBookingType, setInitialBookingType] = useState<"standard" | "custom" | "room">("standard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [detailsPkg, setDetailsPkg] = useState<ServicePackage | null>(null);
  const { toast } = useToast();

  const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
  });

  const { data: packages = [], isLoading: isLoadingPackages } = useQuery<ServicePackage[]>({
    queryKey: ['/api/service-packages'],
    queryFn: async () => {
      const res = await fetch('/api/service-packages');
      if (!res.ok) throw new Error('Failed to fetch service packages');
      return res.json();
    },
  });

  const formatPrice = (priceInCents: number) => {
    return `₱${Math.round(priceInCents / 100).toLocaleString("en-PH")}`;
  };

  const getServiceName = (serviceId: number) => {
    return services.find((s) => s.id === serviceId)?.name || "Unknown Service";
  };
  const getServiceById = (serviceId: number) => {
    return services.find((s) => s.id === serviceId) || null;
  };

  const openBookingFor = (serviceId: number, packageId: number) => {
    setSelectedServiceId(serviceId);
    setSelectedPackageId(packageId);
    const svc = getServiceById(serviceId);
    const name = (svc?.name || "").toLowerCase();
    const mode: "standard" | "custom" = (name.includes("venue") || name.includes("room")) ? "room" as any : "standard";
    setInitialBookingType(mode as any);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedServiceId(null);
    setSelectedPackageId(null);
  };
  const openCustomQuote = () => {
    setSelectedPackageId(null);
    setInitialBookingType("custom");
    setIsBookingModalOpen(true);
  };

  const handleBookingSubmitted = (reference: string) => {
    toast({
      title: "Booking Submitted",
      description: `Reference: ${reference}`,
    });
    setIsBookingModalOpen(false);
  };

  const isLoading = isLoadingServices || isLoadingPackages;
  const filteredPackages = (selectedServiceId ? packages.filter(p => p.serviceId === selectedServiceId) : packages)
    .filter(p => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      const inName = p.name.toLowerCase().includes(q);
      const inDesc = (p.description || "").toLowerCase().includes(q);
      const inFeatures = (p.features || []).some(f => (f || "").toLowerCase().includes(q));
      const svc = getServiceById(p.serviceId);
      const inService = (svc?.name || "").toLowerCase().includes(q);
      return inName || inDesc || inFeatures || inService;
    });
  const sortedPackages = [...filteredPackages].sort((a, b) => {
    if (sortBy === "price_asc") return a.pricePerPerson - b.pricePerPerson;
    if (sortBy === "price_desc") return b.pricePerPerson - a.pricePerPerson;
    if (sortBy === "name_asc") return a.name.localeCompare(b.name);
    const aService = getServiceById(a.serviceId);
    const bService = getServiceById(b.serviceId);
    const aFeat = aService?.featured ? 1 : 0;
    const bFeat = bService?.featured ? 1 : 0;
    if (bFeat - aFeat !== 0) return bFeat - aFeat;
    const aOrder = typeof a.sortOrder === "number" ? a.sortOrder : 0;
    const bOrder = typeof b.sortOrder === "number" ? b.sortOrder : 0;
    if (aOrder - bOrder !== 0) return aOrder - bOrder;
    return a.pricePerPerson - b.pricePerPerson;
  });

  return (
    <>
      <Helmet>
        <title>All Packages • Peter's Creation Catering Services</title>
        <meta name="description" content="Browse all catering packages from Peter's Creation and book the perfect option for your event." />
      </Helmet>

      <div className="fixed z-50 right-4 md:top-24 top-auto bottom-6">
        <Button
          onClick={openCustomQuote}
          aria-label="Request Custom Quote"
          className="bg-gradient-to-r from-secondary to-primary hover:from-primary hover:to-secondary text-white shadow-lg transition-colors"
        >
          Request Custom Quote
        </Button>
      </div>

      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-primary mb-2">All Packages</h2>
          <p className="text-[#343a40] max-w-2xl mx-auto">
            Explore all the packages Peter's Creation offers across our different services
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <Button variant="outline" onClick={openCustomQuote}>
              Request Custom Quote
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Service</p>
              <Select value={selectedServiceId?.toString() || "0"} onValueChange={(v) => setSelectedServiceId(v === "0" ? null : parseInt(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Services</SelectItem>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Sort</p>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="name_asc">Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 mb-2">Search Packages</p>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by package, service, or feature"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array(6).fill(0).map((_, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-5/6 mb-3" />
                  <div className="flex justify-between items-center pt-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedPackages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden border-2 border-gray-100 hover:border-primary/20 transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xl font-bold text-primary">{pkg.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{getServiceName(pkg.serviceId)}</p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                      {formatPrice(pkg.pricePerPerson)}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">{pkg.description}</p>

                  {pkg.features.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Info className="h-3 w-3" /> Includes:
                      </p>
                      <ul className="grid grid-cols-1 gap-2">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Min. {pkg.minGuests} guests{pkg.maxGuests ? ` • Max. ${pkg.maxGuests}` : ""}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="text-xs px-4"
                        onClick={() => setDetailsPkg(pkg)}
                      >
                        See More
                      </Button>
                      <Button
                        onClick={() => openBookingFor(pkg.serviceId, pkg.id)}
                        className="bg-secondary hover:bg-opacity-90 text-white text-xs px-4"
                      >
                        Book This Package
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-gray-50 rounded-xl border border-dashed">
            <PackageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No packages available yet.</p>
          </div>
        )}
      </section>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={closeBookingModal}
        services={services}
        selectedServiceId={selectedServiceId}
        initialPackageId={selectedPackageId}
        initialBookingType={initialBookingType}
        onBookingSubmitted={handleBookingSubmitted}
      />

      <Dialog open={!!detailsPkg} onOpenChange={(o) => !o && setDetailsPkg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailsPkg?.name}</DialogTitle>
            <DialogDescription>
              {detailsPkg ? `${getServiceName(detailsPkg.serviceId)} • ${formatPrice(detailsPkg.pricePerPerson)}` : ""}
            </DialogDescription>
          </DialogHeader>
          {detailsPkg && (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">{detailsPkg.description}</p>
              {detailsPkg.features?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Info className="h-3 w-3" /> Includes:
                  </p>
                  <ul className="grid grid-cols-1 gap-2">
                    {detailsPkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="text-xs text-gray-500">
                Min. {detailsPkg.minGuests} guests{detailsPkg.maxGuests ? ` • Max. ${detailsPkg.maxGuests}` : ""}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailsPkg(null)}>Close</Button>
                <Button onClick={() => { if (detailsPkg) { openBookingFor(detailsPkg.serviceId, detailsPkg.id); setDetailsPkg(null); }}}>
                  Book This Package
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
