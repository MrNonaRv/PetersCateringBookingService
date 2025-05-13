import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  // Format price from cents to dollars
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };
  
  return (
    <section id="services" className="py-16 container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-2">Our Catering Services</h2>
        <p className="text-[#343a40] max-w-2xl mx-auto">Choose from our wide range of catering options to make your event memorable</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          // Skeleton loading state
          Array(6).fill(0).map((_, index) => (
            <Card key={index} className="overflow-hidden">
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
          ))
        ) : (
          // Actual services
          services.map((service) => (
            <div 
              key={service.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden transition transform hover:scale-105"
            >
              <img 
                src={service.imageUrl} 
                alt={`${service.name} Catering Service`} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-heading font-bold text-primary mb-2">{service.name}</h3>
                <p className="text-[#343a40] mb-4">{service.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-secondary font-accent">Starting at {formatPrice(service.basePrice)}/person</span>
                  <Button 
                    onClick={() => onSelectService(service.id)}
                    className="bg-primary hover:bg-opacity-90 text-white font-accent text-sm"
                  >
                    Select
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
