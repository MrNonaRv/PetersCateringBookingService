import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Autoplay from "embla-carousel-autoplay";
import { Check, Info, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Service {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
}

interface ServicePackage {
  id: number;
  serviceId: number;
  name: string;
  description: string;
  pricePerPerson: number;
  minGuests: number;
  features: string[];
}

interface ServicesProps {
  services: Service[];
  isLoading: boolean;
  onSelectService: (serviceId: number) => void;
}

export default function Services({ services, isLoading, onSelectService }: ServicesProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const { data: packages = [], isLoading: isLoadingPackages } = useQuery<ServicePackage[]>({
    queryKey: ["/api/service-packages", selectedServiceId],
    queryFn: async () => {
      if (!selectedServiceId) return [];
      const res = await fetch(`/api/service-packages?serviceId=${selectedServiceId}`);
      if (!res.ok) throw new Error("Failed to fetch packages");
      return res.json();
    },
    enabled: !!selectedServiceId,
  });

  const formatPrice = (priceInCents: number) => {
    return `₱${Math.round(priceInCents / 100).toLocaleString("en-PH")}`;
  };

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const ServiceCard = ({ service }: { service: Service }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl group">
      <div className="relative overflow-hidden">
        <img 
          src={service.imageUrl} 
          alt={`${service.name} Catering Service`} 
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-heading font-bold text-primary mb-2 group-hover:text-secondary transition-colors duration-300">
          {service.name}
        </h3>
        <p className="text-[#343a40] mb-4 line-clamp-3">{service.description}</p>
        <div className="flex justify-center">
          <Button 
            onClick={() => setSelectedServiceId(service.id)}
            className="bg-primary hover:bg-secondary text-white font-accent text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg w-full"
          >
            View Packages & Pricing
          </Button>
        </div>
      </div>
    </div>
  );

  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <section id="services" className="py-16 container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-2">Our Catering Services</h2>
        <p className="text-[#343a40] max-w-2xl mx-auto">Choose from our wide range of catering options to make your event memorable</p>
      </div>

      {isLoading ? (
        <div className="relative">
          <Carousel className="w-full" setApi={setApi}>
            <CarouselContent>
              {Array(6).fill(0).map((_, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-9 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      ) : (
        <div className="relative">
          <Carousel
            className="w-full"
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 4000,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
          >
            <CarouselContent>
              {services.map((service) => (
                <CarouselItem key={service.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/3">
                  <div className="p-2">
                    <ServiceCard service={service} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 bg-white/90 hover:bg-white border-primary/20 hover:border-primary text-primary hover:text-secondary transition-all duration-300" />
            <CarouselNext className="right-4 bg-white/90 hover:bg-white border-primary/20 hover:border-primary text-primary hover:text-secondary transition-all duration-300" />
          </Carousel>

          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: count }, (_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index + 1 === current
                    ? 'bg-secondary scale-125 shadow-lg'
                    : 'bg-gray-300 hover:bg-primary/50 hover:scale-110'
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!selectedServiceId} onOpenChange={(open) => !open && setSelectedServiceId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading text-primary">
              {selectedService?.name} Packages
            </DialogTitle>
            <DialogDescription>
              Explore our available packages and pricing for {selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          {isLoadingPackages ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden border-2 border-gray-100 hover:border-primary/20 transition-all">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-primary">{pkg.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                        {formatPrice(pkg.pricePerPerson)}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-6">
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

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Min. {pkg.minGuests} guests
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedServiceId(null);
                          onSelectService(selectedServiceId!);
                        }}
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
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No specific packages found for this service.</p>
              <Button 
                onClick={() => {
                  setSelectedServiceId(null);
                  onSelectService(selectedServiceId!);
                }}
                className="mt-4"
              >
                Request Custom Quote
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
