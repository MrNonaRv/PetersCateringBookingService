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
import Autoplay from "embla-carousel-autoplay";

interface Service {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
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

  // Format price from cents to Philippine Peso
  const formatPrice = (priceInCents: number) => {
    return `₱${(priceInCents / 100).toFixed(2)}`;
  };

  useEffect(() => {
    if (!api) {
      return;
    }

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
        <div className="flex justify-between items-center">
          <span className="text-secondary font-accent font-bold">
            Starting at {formatPrice(service.basePrice)}/person
          </span>
          <Button 
            onClick={() => onSelectService(service.id)}
            className="bg-primary hover:bg-secondary text-white font-accent text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            Select
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <section id="services" className="py-16 container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-2">Our Catering Services</h2>
        <p className="text-[#343a40] max-w-2xl mx-auto">Choose from our wide range of catering options to make your event memorable</p>
      </div>

      {isLoading ? (
        // Loading skeleton carousel
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
        // Interactive services carousel
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

          {/* Carousel Indicators */}
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

          {/* Progress indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-2 text-sm text-[#343a40]">
              <span className="font-accent">{current}</span>
              <span>/</span>
              <span className="font-accent">{count}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
