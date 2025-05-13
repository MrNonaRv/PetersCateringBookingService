import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash } from "lucide-react";

export default function ServicesManagement() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) {
        throw new Error('Failed to fetch services');
      }
      return res.json();
    },
  });

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-lg font-medium">Catering Services</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 flex justify-end">
          <Button className="bg-primary">
            <Plus className="mr-2 h-4 w-4" /> Add New Service
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Skeleton loading
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
            services && services.map((service: any) => (
              <Card key={service.id} className="overflow-hidden">
                <div className="relative h-48 w-full">
                  <img 
                    src={service.imageUrl} 
                    alt={service.name}
                    className="h-full w-full object-cover"
                  />
                  {service.featured && (
                    <div className="absolute top-2 right-2 bg-secondary text-white px-2 py-1 rounded text-xs">
                      Featured
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-2">{service.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">₱{(service.basePrice / 100).toFixed(2)}/person</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}