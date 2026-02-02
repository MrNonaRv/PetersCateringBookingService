import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Info, Package as PackageIcon } from "lucide-react";
import { useState } from "react";

interface Service {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  featured?: boolean;
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

export default function AllPackagesModal({
  isOpen,
  onClose,
  services,
  onSelectPackage,
  onRequestCustomQuote,
}: {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onSelectPackage: (serviceId: number, packageId: number) => void;
  onRequestCustomQuote?: () => void;
}) {
  const { data: packages = [], isLoading } = useQuery<ServicePackage[]>({
    queryKey: ['/api/service-packages'],
    queryFn: async () => {
      const res = await fetch('/api/service-packages');
      if (!res.ok) throw new Error('Failed to fetch service packages');
      return res.json();
    },
    enabled: isOpen,
  });

  const [detailsPkg, setDetailsPkg] = useState<ServicePackage | null>(null);

  const getServiceName = (serviceId: number) => {
    return services.find((s) => s.id === serviceId)?.name || "Unknown Service";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-heading text-primary">All Packages</DialogTitle>
                <DialogDescription>Browse all packages Peter's offers and book instantly</DialogDescription>
              </div>
              {onRequestCustomQuote && (
                <Button variant="outline" onClick={onRequestCustomQuote}>
                  Request Custom Quote
                </Button>
              )}
            </div>
          </DialogHeader>

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
          ) : packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden border-2 border-gray-100 hover:border-primary/20 transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-xl font-bold text-primary">{pkg.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{getServiceName(pkg.serviceId)}</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">{pkg.description}</p>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        className="text-xs px-4"
                        onClick={() => setDetailsPkg(pkg)}
                      >
                        See More
                      </Button>
                      <Button
                        onClick={() => onSelectPackage(pkg.serviceId, pkg.id)}
                        className="bg-secondary hover:bg-opacity-90 text-white text-xs px-4"
                      >
                        Book This Package
                      </Button>
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
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailsPkg} onOpenChange={(open) => !open && setDetailsPkg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailsPkg?.name}</DialogTitle>
            <DialogDescription>
              {detailsPkg ? getServiceName(detailsPkg.serviceId) : ""}
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
                <Button onClick={() => { if (detailsPkg) { onSelectPackage(detailsPkg.serviceId, detailsPkg.id); setDetailsPkg(null); }}}>
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
