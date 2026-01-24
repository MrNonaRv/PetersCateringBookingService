import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Service {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  basePrice: number;
  featured: boolean;
}

export default function ServicesManagement() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [editedPrice, setEditedPrice] = useState<string>("");
  const [editedName, setEditedName] = useState<string>("");
  const [editedDescription, setEditedDescription] = useState<string>("");
  const [editedFeatured, setEditedFeatured] = useState<boolean>(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const updateServiceMutation = useMutation({
    mutationFn: async (service: Partial<Service> & { id: number }) => {
      const res = await apiRequest('PUT', `/api/services/${service.id}`, service);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: "Service updated",
        description: "The service has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditService = (service: Service) => {
    setCurrentService(service);
    setEditedName(service.name);
    setEditedDescription(service.description);
    setEditedPrice(String(Math.round(service.basePrice / 100)));
    setEditedFeatured(service.featured);
    setIsEditDialogOpen(true);
  };

  const handleUpdateService = () => {
    if (!currentService) return;

    const priceInCents = parseInt(editedPrice, 10) * 100;

    if (isNaN(priceInCents)) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    updateServiceMutation.mutate({
      id: currentService.id,
      name: editedName,
      description: editedDescription,
      basePrice: priceInCents,
      featured: editedFeatured,
    });
  };

  return (
    <>
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
                      <span className="font-medium">₱{Math.round(service.basePrice / 100).toLocaleString("en-PH")}/person</span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditService(service)}
                        >
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (₱)
              </Label>
              <Input
                id="price"
                type="number"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
                className="col-span-3"
                placeholder="Price per person"
                step="0.01"
                min="0"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="featured" className="text-right">
                Featured
              </Label>
              <div className="col-span-3 flex items-center">
                <Checkbox
                  id="featured"
                  checked={editedFeatured}
                  onCheckedChange={(checked) => setEditedFeatured(checked as boolean)}
                />
                <label htmlFor="featured" className="ml-2 text-sm">
                  Show as featured service
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleUpdateService}
              disabled={updateServiceMutation.isPending}
            >
              {updateServiceMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
