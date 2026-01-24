import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Package, Users, DollarSign } from "lucide-react";

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
  isActive: boolean;
  hasThemedCake: boolean;
  sortOrder: number;
}

export default function ServicePackageManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<ServicePackage | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState({
    serviceId: 0,
    name: "",
    description: "",
    pricePerPerson: "",
    minGuests: "10",
    maxGuests: "",
    features: [""],
    isActive: true,
    hasThemedCake: false,
    sortOrder: "0"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatPrice = (priceInCents: number) => {
    const pesos = Math.round(priceInCents / 100);
    return `₱${pesos.toLocaleString("en-PH")}`;
  };

  // Fetch services
  const { data: services } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
  });

  // Fetch all service packages
  const { data: packages, isLoading } = useQuery({
    queryKey: ['/api/service-packages'],
    queryFn: async () => {
      const res = await fetch('/api/service-packages');
      if (!res.ok) throw new Error('Failed to fetch service packages');
      return res.json();
    },
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (packageData: any) => {
      return apiRequest('POST', '/api/service-packages', packageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-packages'] });
      toast({
        title: "Package created",
        description: "The service package has been created successfully.",
      });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create the service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async (packageData: any) => {
      return apiRequest('PUT', `/api/service-packages/${currentPackage?.id}`, packageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-packages'] });
      toast({
        title: "Package updated",
        description: "The service package has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: number) => {
      return apiRequest('DELETE', `/api/service-packages/${packageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/service-packages'] });
      toast({
        title: "Package deleted",
        description: "The service package has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the service package. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      serviceId: 0,
      name: "",
      description: "",
      pricePerPerson: "",
      minGuests: "10",
      maxGuests: "",
      features: [""],
      isActive: true,
      hasThemedCake: false,
      sortOrder: "0"
    });
    setCurrentPackage(null);
  };

  const handleAddPackage = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleEditPackage = (pkg: ServicePackage) => {
    setCurrentPackage(pkg);
    setFormData({
      serviceId: pkg.serviceId,
      name: pkg.name,
      description: pkg.description,
      pricePerPerson: String(Math.round(pkg.pricePerPerson / 100)),
      minGuests: pkg.minGuests.toString(),
      maxGuests: pkg.maxGuests?.toString() || "",
      features: pkg.features.length > 0 ? pkg.features : [""],
      isActive: pkg.isActive,
      hasThemedCake: pkg.hasThemedCake,
      sortOrder: pkg.sortOrder.toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleDeletePackage = (packageId: number) => {
    if (confirm("Are you sure you want to delete this package?")) {
      deletePackageMutation.mutate(packageId);
    }
  };

  const handleSubmit = () => {
    if (!formData.serviceId || !formData.name || !formData.pricePerPerson) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const priceInCents = parseInt(formData.pricePerPerson, 10) * 100;
    const features = formData.features.filter(f => f.trim() !== "");

    const packageData = {
      serviceId: formData.serviceId,
      name: formData.name,
      description: formData.description,
      pricePerPerson: priceInCents,
      minGuests: parseInt(formData.minGuests),
      maxGuests: formData.maxGuests ? parseInt(formData.maxGuests) : null,
      features,
      isActive: formData.isActive,
      hasThemedCake: formData.hasThemedCake,
      sortOrder: parseInt(formData.sortOrder)
    };

    if (currentPackage) {
      updatePackageMutation.mutate(packageData);
    } else {
      createPackageMutation.mutate(packageData);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Filter packages by selected service
  const filteredPackages = selectedServiceId 
    ? packages?.filter((pkg: ServicePackage) => pkg.serviceId === selectedServiceId)
    : packages;

  const getServiceName = (serviceId: number) => {
    return services?.find((s: Service) => s.id === serviceId)?.name || "Unknown Service";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Service Package Management</h2>
          <p className="text-gray-600">Manage packages for each catering service</p>
        </div>
        <Button onClick={handleAddPackage} className="bg-primary hover:bg-secondary">
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Service Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Filter by Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedServiceId.toString()} onValueChange={(value) => setSelectedServiceId(parseInt(value))}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Services</SelectItem>
              {services?.map((service: Service) => (
                <SelectItem key={service.id} value={service.id.toString()}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Packages Grid */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8">Loading packages...</div>
        ) : filteredPackages?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No packages found</h3>
              <p className="text-gray-500 mb-4">
                {selectedServiceId ? "No packages for this service yet." : "No packages created yet."}
              </p>
              <Button onClick={handleAddPackage} className="bg-primary hover:bg-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Create First Package
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPackages?.map((pkg: ServicePackage) => (
            <Card key={pkg.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {pkg.name}
                      {!pkg.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {getServiceName(pkg.serviceId)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPackage(pkg)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{pkg.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="text-sm text-gray-600">Package Price</p>
                      <p className="font-bold text-secondary">{formatPrice(pkg.pricePerPerson)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-gray-600">Guest Range</p>
                      <p className="font-semibold">
                        {pkg.minGuests} - {pkg.maxGuests || "No limit"}
                      </p>
                    </div>
                  </div>
                </div>

                {pkg.features.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Package Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.features.map((feature, index) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Package Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentPackage ? "Edit Package" : "Add New Package"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Service Selection */}
            <div>
              <Label htmlFor="service">Service *</Label>
              <Select 
                value={formData.serviceId.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services?.map((service: Service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Package Name */}
            <div>
              <Label htmlFor="name">Package Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Basic Package, Premium Package"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what's included in this package"
                rows={3}
              />
            </div>

            {/* Price and Guest Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerPerson">Package Price (₱) *</Label>
                <Input
                  id="pricePerPerson"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pricePerPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerPerson: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minGuests">Minimum Guests</Label>
                <Input
                  id="minGuests"
                  type="number"
                  min="1"
                  value={formData.minGuests}
                  onChange={(e) => setFormData(prev => ({ ...prev, minGuests: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="maxGuests">Maximum Guests (optional)</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                  value={formData.maxGuests}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: e.target.value }))}
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <Label>Package Features</Label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Enter a feature"
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFeature}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>

            {/* Active Status and Themed Cake */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Package is active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hasThemedCake"
                  checked={formData.hasThemedCake}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasThemedCake: checked }))}
                />
                <Label htmlFor="hasThemedCake">Includes Themed Cake (Ask client for theme)</Label>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createPackageMutation.isPending || updatePackageMutation.isPending}>
                {currentPackage ? "Update Package" : "Create Package"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
