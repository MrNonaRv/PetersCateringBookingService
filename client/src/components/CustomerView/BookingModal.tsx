import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Check, Info } from "lucide-react";

// Interface for Services
interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  featured: boolean;
}

// Interface for Availability
interface Availability {
  id: number;
  date: string;
  isAvailable: boolean;
  notes?: string;
}

// Define form schema for booking
const bookingFormSchema = z.object({
  serviceId: z.number().min(1, "Please select a service"),
  eventDate: z.date({
    required_error: "Please select a date",
  }),
  eventType: z.string().min(1, "Please select event type"),
  eventTime: z.string().min(1, "Please select event time"),
  guestCount: z.number().min(10, "Minimum guest count is 10").max(500, "Maximum guest count is 500"),
  venueAddress: z.string().min(5, "Please enter the venue address"),
  menuPreference: z.string().min(1, "Please select a menu preference"),
  serviceStyle: z.string().min(1, "Please select a service style"),
  additionalServices: z.string().optional(),
  specialRequests: z.string().optional(),
  // Customer details
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  company: z.string().optional(),
  termsAgreed: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  selectedServiceId: number | null;
  onBookingSubmitted: (reference: string) => void;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  services, 
  selectedServiceId,
  onBookingSubmitted 
}: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch availabilities
  const { data: availabilities = [] } = useQuery({
    queryKey: ['/api/availability'],
    queryFn: async () => {
      const res = await fetch('/api/availability');
      if (!res.ok) {
        throw new Error('Failed to fetch availabilities');
      }
      return res.json();
    },
    enabled: isOpen
  });

  // Initialize form
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      serviceId: selectedServiceId || 0,
      guestCount: 50,
      additionalServices: "",
      specialRequests: "",
      termsAgreed: false
    }
  });

  // Reset form and current step when modal opens or selected service changes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      form.reset({
        serviceId: selectedServiceId || 0,
        guestCount: 50,
        additionalServices: "",
        specialRequests: "",
        termsAgreed: false
      });
    }
  }, [isOpen, selectedServiceId, form]);

  // Get unavailable dates from availabilities
  const unavailableDates = availabilities
    .filter((a: Availability) => !a.isAvailable)
    .map((a: Availability) => new Date(a.date));

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      // Prepare booking data
      const booking = {
        serviceId: data.serviceId,
        eventDate: data.eventDate.toISOString().split('T')[0],
        eventType: data.eventType,
        eventTime: data.eventTime,
        guestCount: data.guestCount,
        venueAddress: data.venueAddress,
        menuPreference: data.menuPreference,
        serviceStyle: data.serviceStyle,
        additionalServices: data.additionalServices || "",
        specialRequests: data.specialRequests || "",
        // Calculate total price based on base price and guest count
        totalPrice: (services.find(s => s.id === data.serviceId)?.basePrice || 0) * data.guestCount,
        status: "pending",
        paymentStatus: "pending"
      };
      
      // Prepare customer data
      const customer = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company || ""
      };
      
      // Send booking request
      const res = await apiRequest('POST', '/api/bookings', {
        booking,
        customer
      });
      
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate bookings queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      
      // Call the callback with the booking reference
      onBookingSubmitted(data.bookingReference);
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle step navigation
  const nextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      // Validate service selection
      const serviceId = form.getValues("serviceId");
      if (!serviceId) {
        form.setError("serviceId", {
          type: "manual",
          message: "Please select a service"
        });
        return;
      }
    } else if (currentStep === 2) {
      // Validate date selection
      const eventDate = form.getValues("eventDate");
      if (!eventDate) {
        form.setError("eventDate", {
          type: "manual",
          message: "Please select a date"
        });
        return;
      }
    } else if (currentStep === 3) {
      // Validate event details
      const { eventType, eventTime, guestCount, venueAddress, menuPreference, serviceStyle } = form.getValues();
      if (!eventType || !eventTime || !guestCount || !venueAddress || !menuPreference || !serviceStyle) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields before proceeding.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Move to next step
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const onSubmit = (data: BookingFormValues) => {
    createBookingMutation.mutate(data);
  };

  // Handle additional services checkbox changes
  const handleAdditionalServiceChange = (service: string, checked: boolean) => {
    const currentServices = form.getValues("additionalServices") || "";
    const servicesArray = currentServices ? currentServices.split(",").map(s => s.trim()) : [];
    
    if (checked && !servicesArray.includes(service)) {
      servicesArray.push(service);
    } else if (!checked && servicesArray.includes(service)) {
      const index = servicesArray.indexOf(service);
      servicesArray.splice(index, 1);
    }
    
    form.setValue("additionalServices", servicesArray.join(", "));
  };

  // Helper to determine if a step is complete
  const isStepComplete = (step: number) => {
    if (step < currentStep) {
      return true;
    }
    return false;
  };

  // Format price from cents to Philippine Peso
  const formatPrice = (priceInCents: number) => {
    return `₱${(priceInCents / 100).toFixed(2)}`;
  };

  // Render booking form based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-heading text-primary mb-4">Select a Catering Service</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div 
                  key={service.id}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-primary ${form.getValues("serviceId") === service.id ? "border-primary" : "border-gray-200"}`}
                  onClick={() => form.setValue("serviceId", service.id, { shouldValidate: true })}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mr-3 ${form.getValues("serviceId") === service.id ? "bg-primary border-primary" : "border-gray-300"}`} />
                    <div>
                      <h4 className="font-heading font-bold">{service.name}</h4>
                      <p className="text-sm text-[#343a40]">Starting at {formatPrice(service.basePrice)}/person</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {form.formState.errors.serviceId && (
              <p className="text-red-500 text-sm">{form.formState.errors.serviceId.message}</p>
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-heading text-primary mb-4">Select Event Date</h3>
            <div className="flex flex-col items-center">
              <Calendar
                mode="single"
                selected={form.getValues("eventDate")}
                onSelect={(date) => date && form.setValue("eventDate", date, { shouldValidate: true })}
                disabled={(date: Date) => {
                  // Disable past dates and unavailable dates
                  return date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                         unavailableDates.some((unavailableDate: Date) => 
                           unavailableDate.getDate() === date.getDate() && 
                           unavailableDate.getMonth() === date.getMonth() && 
                           unavailableDate.getFullYear() === date.getFullYear()
                         );
                }}
                className="rounded-md border"
              />
            </div>
            {form.formState.errors.eventDate && (
              <p className="text-red-500 text-sm">{form.formState.errors.eventDate.message}</p>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-gray-200 mr-2"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-[#e74c3c] mr-2"></div>
                <span className="text-sm">Unavailable</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-primary mr-2"></div>
                <span className="text-sm">Selected</span>
              </div>
            </div>
            
            {form.getValues("eventDate") && (
              <div className="mt-6 bg-[#f8f9fa] p-4 rounded-lg">
                <p className="text-sm">Selected Date: <span className="font-medium">
                  {form.getValues("eventDate")?.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span></p>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div>
            <h3 className="text-xl font-heading text-primary mb-4">Event Details</h3>
            <Form {...form}>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="eventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="wedding">Wedding</SelectItem>
                              <SelectItem value="corporate">Corporate Event</SelectItem>
                              <SelectItem value="birthday">Birthday Party</SelectItem>
                              <SelectItem value="anniversary">Anniversary</SelectItem>
                              <SelectItem value="holiday">Holiday Party</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="eventTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Time</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="breakfast">Breakfast (7:00 AM - 10:00 AM)</SelectItem>
                              <SelectItem value="lunch">Lunch (11:00 AM - 2:00 PM)</SelectItem>
                              <SelectItem value="dinner">Dinner (5:00 PM - 9:00 PM)</SelectItem>
                              <SelectItem value="evening">Evening (7:00 PM - 11:00 PM)</SelectItem>
                              <SelectItem value="custom">Custom Time</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Guests</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={10}
                              max={500}
                              placeholder="Enter guest count"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="venueAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Address</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Enter venue address"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="menuPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Menu Preference</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select menu preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standard">Standard Menu</SelectItem>
                              <SelectItem value="vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="vegan">Vegan</SelectItem>
                              <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                              <SelectItem value="custom">Custom Menu (Additional Details)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="serviceStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Style</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select service style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="buffet">Buffet Style</SelectItem>
                              <SelectItem value="plated">Plated Service</SelectItem>
                              <SelectItem value="family">Family Style</SelectItem>
                              <SelectItem value="stations">Food Stations</SelectItem>
                              <SelectItem value="cocktail">Cocktail Reception</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel>Additional Services</FormLabel>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center">
                          <Checkbox
                            id="service-bar"
                            checked={form.getValues("additionalServices")?.includes("Bar Service")}
                            onCheckedChange={(checked) => 
                              handleAdditionalServiceChange("Bar Service", checked as boolean)
                            }
                          />
                          <label htmlFor="service-bar" className="ml-2">Bar Service</label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="service-decor"
                            checked={form.getValues("additionalServices")?.includes("Décor Setup")}
                            onCheckedChange={(checked) => 
                              handleAdditionalServiceChange("Décor Setup", checked as boolean)
                            }
                          />
                          <label htmlFor="service-decor" className="ml-2">Décor Setup</label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="service-rentals"
                            checked={form.getValues("additionalServices")?.includes("Equipment Rentals")}
                            onCheckedChange={(checked) => 
                              handleAdditionalServiceChange("Equipment Rentals", checked as boolean)
                            }
                          />
                          <label htmlFor="service-rentals" className="ml-2">Equipment Rentals</label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="service-staff"
                            checked={form.getValues("additionalServices")?.includes("Additional Staff")}
                            onCheckedChange={(checked) => 
                              handleAdditionalServiceChange("Additional Staff", checked as boolean)
                            }
                          />
                          <label htmlFor="service-staff" className="ml-2">Additional Staff</label>
                        </div>
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requests</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={3}
                              placeholder="Any special requests or dietary restrictions"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
          </div>
        );
      
      case 4:
        return (
          <div>
            <h3 className="text-xl font-heading text-primary mb-4">Booking Summary</h3>
            
            <div className="bg-[#f8f9fa] p-6 rounded-lg mb-6">
              <h4 className="font-heading font-bold text-lg mb-4">Your Catering Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-[#343a40]">Service Selected:</p>
                    <p className="font-medium">{services.find(s => s.id === form.getValues("serviceId"))?.name}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#343a40]">Event Date:</p>
                    <p className="font-medium">
                      {form.getValues("eventDate")?.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#343a40]">Event Type:</p>
                    <p className="font-medium">
                      {form.getValues("eventType") === "wedding" ? "Wedding" : 
                       form.getValues("eventType") === "corporate" ? "Corporate Event" :
                       form.getValues("eventType") === "birthday" ? "Birthday Party" :
                       form.getValues("eventType") === "anniversary" ? "Anniversary" :
                       form.getValues("eventType") === "holiday" ? "Holiday Party" : "Other"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#343a40]">Event Time:</p>
                    <p className="font-medium">
                      {form.getValues("eventTime") === "breakfast" ? "Breakfast (7:00 AM - 10:00 AM)" :
                       form.getValues("eventTime") === "lunch" ? "Lunch (11:00 AM - 2:00 PM)" :
                       form.getValues("eventTime") === "dinner" ? "Dinner (5:00 PM - 9:00 PM)" :
                       form.getValues("eventTime") === "evening" ? "Evening (7:00 PM - 11:00 PM)" : "Custom Time"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#343a40]">Number of Guests:</p>
                    <p className="font-medium">{form.getValues("guestCount")}</p>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-[#343a40]">Venue Address:</p>
                    <p className="font-medium">{form.getValues("venueAddress")}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#343a40]">Menu Preference:</p>
                    <p className="font-medium">
                      {form.getValues("menuPreference") === "standard" ? "Standard Menu" :
                       form.getValues("menuPreference") === "vegetarian" ? "Vegetarian" :
                       form.getValues("menuPreference") === "vegan" ? "Vegan" :
                       form.getValues("menuPreference") === "gluten-free" ? "Gluten-Free" : "Custom Menu"}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#343a40]">Service Style:</p>
                    <p className="font-medium">
                      {form.getValues("serviceStyle") === "buffet" ? "Buffet Style" :
                       form.getValues("serviceStyle") === "plated" ? "Plated Service" :
                       form.getValues("serviceStyle") === "family" ? "Family Style" :
                       form.getValues("serviceStyle") === "stations" ? "Food Stations" : "Cocktail Reception"}
                    </p>
                  </div>
                  {form.getValues("additionalServices") && (
                    <div className="mb-4">
                      <p className="text-sm text-[#343a40]">Additional Services:</p>
                      <p className="font-medium">{form.getValues("additionalServices")}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {form.getValues("specialRequests") && (
                <div className="mt-4">
                  <p className="text-sm text-[#343a40]">Special Requests:</p>
                  <p className="font-medium">{form.getValues("specialRequests")}</p>
                </div>
              )}
              
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-[#343a40]">Estimated Total:</p>
                <p className="font-medium text-lg text-primary">
                  {formatPrice((services.find(s => s.id === form.getValues("serviceId"))?.basePrice || 0) * form.getValues("guestCount"))}
                </p>
                <p className="text-xs text-[#343a40]">Final pricing may vary based on menu selection and additional services</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-heading font-bold text-lg mb-4">Contact Information</h4>
              
              <Form {...form}>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company/Organization (if applicable)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="termsAgreed"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the <a href="#" className="text-primary hover:underline">terms and conditions</a> *
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg mb-4 flex items-start gap-2">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Your booking request will be reviewed by our team. We will contact you within 24 hours to confirm availability and discuss any details.
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-heading font-bold text-primary">Book Your Catering Service</DialogTitle>
          <DialogDescription>
            <div className="mt-8 mb-4">
              <div className="flex items-center w-full">
                {/* Step 1 */}
                <div className="relative flex flex-col items-center text-center">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-medium
                      ${isStepComplete(1) 
                        ? "bg-green-500 text-white" 
                        : currentStep === 1 
                          ? "bg-primary text-white" 
                          : "bg-gray-200 text-[#343a40]"
                      }`}
                  >
                    {isStepComplete(1) ? <Check className="h-5 w-5" /> : "1"}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${currentStep === 1 ? "text-primary" : "text-[#343a40]"}`}>Service</div>
                </div>
                
                {/* Line */}
                <div className="w-full h-1 bg-gray-200 flex-grow mx-2">
                  <div className="h-1 bg-primary transition-all duration-300" style={{ width: currentStep > 1 ? "100%" : "0%" }}></div>
                </div>
                
                {/* Step 2 */}
                <div className="relative flex flex-col items-center text-center">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-medium
                      ${isStepComplete(2) 
                        ? "bg-green-500 text-white" 
                        : currentStep === 2 
                          ? "bg-primary text-white" 
                          : "bg-gray-200 text-[#343a40]"
                      }`}
                  >
                    {isStepComplete(2) ? <Check className="h-5 w-5" /> : "2"}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${currentStep === 2 ? "text-primary" : "text-[#343a40]"}`}>Date</div>
                </div>
                
                {/* Line */}
                <div className="w-full h-1 bg-gray-200 flex-grow mx-2">
                  <div className="h-1 bg-primary transition-all duration-300" style={{ width: currentStep > 2 ? "100%" : "0%" }}></div>
                </div>
                
                {/* Step 3 */}
                <div className="relative flex flex-col items-center text-center">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-medium
                      ${isStepComplete(3) 
                        ? "bg-green-500 text-white" 
                        : currentStep === 3 
                          ? "bg-primary text-white" 
                          : "bg-gray-200 text-[#343a40]"
                      }`}
                  >
                    {isStepComplete(3) ? <Check className="h-5 w-5" /> : "3"}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${currentStep === 3 ? "text-primary" : "text-[#343a40]"}`}>Details</div>
                </div>
                
                {/* Line */}
                <div className="w-full h-1 bg-gray-200 flex-grow mx-2">
                  <div className="h-1 bg-primary transition-all duration-300" style={{ width: currentStep > 3 ? "100%" : "0%" }}></div>
                </div>
                
                {/* Step 4 */}
                <div className="relative flex flex-col items-center text-center">
                  <div 
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-medium
                      ${isStepComplete(4) 
                        ? "bg-green-500 text-white" 
                        : currentStep === 4 
                          ? "bg-primary text-white" 
                          : "bg-gray-200 text-[#343a40]"
                      }`}
                  >
                    {isStepComplete(4) ? <Check className="h-5 w-5" /> : "4"}
                  </div>
                  <div className={`text-xs font-medium mt-1 ${currentStep === 4 ? "text-primary" : "text-[#343a40]"}`}>Confirm</div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {renderStepContent()}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={prevStep}
            >
              Previous
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button 
              onClick={nextStep}
              className="bg-primary"
            >
              Next Step
            </Button>
          ) : (
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              className="bg-primary"
              disabled={createBookingMutation.isPending}
            >
              {createBookingMutation.isPending ? "Submitting..." : "Submit Booking"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
