import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Check,
  Info,
  Package,
  FileText,
  Calendar as CalendarIcon,
  User,
  Clock,
  UtensilsCrossed,
  ClipboardCheck,
} from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
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
  sortOrder: number;
}

interface Dish {
  id: number;
  name: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl: string | null;
  additionalCost: number;
  isAvailable: boolean;
}

interface Availability {
  id: number;
  date: string;
  isAvailable: boolean;
  notes?: string;
}

const bookingFormSchema = z
  .object({
    bookingType: z.enum(["standard", "custom"]),
    serviceId: z.number().optional(),
    packageId: z.number().optional(),
    eventDate: z.date({ required_error: "Please select a date" }),
    eventType: z.string().min(1, "Please select event type"),
    eventTime: z.string().min(1, "Please select event time"),
    guestCount: z
      .number()
      .min(10, "Minimum 10 guests")
      .max(500, "Maximum 500 guests"),
    venueAddress: z.string().min(5, "Please enter the venue address"),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    alternateContact: z.string().optional(),
    preferredContactMethod: z.enum(["phone", "email", "sms"]).default("phone"),
    selectedDishes: z.array(z.number()).default([]),
    specialRequests: z.string().optional(),
    theme: z.string().optional(),
    description: z.string().optional(),
    budget: z.number().optional(),
    termsAgreed: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine(
    (data) => {
      if (
        data.bookingType === "standard" &&
        (!data.serviceId || data.serviceId < 1)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a service category",
      path: ["serviceId"],
    },
  )
  .refine(
    (data) => {
      if (data.bookingType === "standard" && !data.packageId) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a package",
      path: ["packageId"],
    },
  );

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  selectedServiceId: number | null;
  onBookingSubmitted: (reference: string) => void;
}

const STEP_CONFIG = {
  standard: [
    { id: 1, label: "Type", icon: Package },
    { id: 2, label: "Date", icon: CalendarIcon },
    { id: 3, label: "Info", icon: User },
    { id: 4, label: "Event", icon: Clock },
    { id: 5, label: "Package", icon: Package },
    { id: 6, label: "Menu", icon: UtensilsCrossed },
    { id: 7, label: "Review", icon: ClipboardCheck },
  ],
  custom: [
    { id: 1, label: "Type", icon: Package },
    { id: 2, label: "Date", icon: CalendarIcon },
    { id: 3, label: "Info", icon: User },
    { id: 4, label: "Details", icon: FileText },
    { id: 5, label: "Review", icon: ClipboardCheck },
  ],
};

const TIME_SLOTS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
];

const EVENT_TYPES = [
  { value: "wedding", label: "Wedding" },
  { value: "debut", label: "Debut (18th Birthday)" },
  { value: "birthday", label: "Birthday Party" },
  { value: "baptism", label: "Baptism/Christening" },
  { value: "corporate", label: "Corporate Event" },
  { value: "anniversary", label: "Anniversary" },
  { value: "graduation", label: "Graduation" },
  { value: "holiday", label: "Holiday Party" },
  { value: "other", label: "Other" },
];

export default function BookingModal({
  isOpen,
  onClose,
  services,
  selectedServiceId,
  onBookingSubmitted,
}: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingType, setBookingType] = useState<"standard" | "custom">(
    "standard",
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      bookingType: "standard",
      serviceId: selectedServiceId || 0,
      guestCount: 100,
      selectedDishes: [],
      preferredContactMethod: "phone",
      termsAgreed: false,
      name: "",
      email: "",
      phone: "",
      alternateContact: "",
    },
  });

  const selectedServiceIdValue = form.watch("serviceId");
  const selectedPackageId = form.watch("packageId");
  const guestCount = form.watch("guestCount");
  const selectedDishes = form.watch("selectedDishes") || [];

  const { data: availabilities = [] } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
    enabled: isOpen,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: packages = [] } = useQuery<ServicePackage[]>({
    queryKey: ["/api/service-packages", selectedServiceIdValue],
    queryFn: async () => {
      if (!selectedServiceIdValue) return [];
      const res = await fetch(
        `/api/service-packages?serviceId=${selectedServiceIdValue}`,
      );
      if (!res.ok) throw new Error("Failed to fetch packages");
      return res.json();
    },
    enabled: !!selectedServiceIdValue && isOpen,
  });

  const { data: dishes = [] } = useQuery<Dish[]>({
    queryKey: ["/api/dishes"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setBookingType("standard");
      form.reset({
        bookingType: "standard",
        serviceId: selectedServiceId || 0,
        guestCount: 100,
        selectedDishes: [],
        preferredContactMethod: "phone",
        termsAgreed: false,
        name: "",
        email: "",
        phone: "",
        alternateContact: "",
      });
    }
  }, [isOpen, selectedServiceId, form]);

  const unavailableDates = availabilities
    .filter((a: Availability) => !a.isAvailable)
    .map((a: Availability) => new Date(a.date));

  const steps = STEP_CONFIG[bookingType];
  const totalSteps = steps.length;

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const selectedPackage = packages.find((p) => p.id === data.packageId);
      const totalPrice = selectedPackage
        ? selectedPackage.pricePerPerson
        : (services.find((s) => s.id === data.serviceId)?.basePrice || 0) *
          data.guestCount;

      const selectedDishNames = dishes
        .filter((d) => data.selectedDishes.includes(d.id))
        .map((d) => d.name);

      const dishesNote =
        selectedDishNames.length > 0
          ? `\n\nSelected Menu Items: ${selectedDishNames.join(", ")}`
          : "";

      if (!data.serviceId || !data.packageId) {
        throw new Error(
          "Service and package selection required for standard booking",
        );
      }

      const booking = {
        serviceId: data.serviceId,
        packageId: data.packageId,
        eventDate: data.eventDate.toISOString().split("T")[0],
        eventType: data.eventType,
        eventTime: data.eventTime,
        guestCount: data.guestCount,
        venueAddress: data.venueAddress,
        menuPreference: "package",
        serviceStyle: "buffet",
        additionalServices: "",
        specialRequests: (data.specialRequests || "") + dishesNote,
        totalPrice,
        status: "pending_approval",
        paymentStatus: "pending",
      };

      const customer = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: "",
      };

      const res = await apiRequest("POST", "/api/bookings", {
        booking,
        customer,
        selectedDishes: data.selectedDishes,
      });

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      onBookingSubmitted(data.bookingReference);
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description:
          "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const quote = {
        eventDate: data.eventDate.toISOString().split("T")[0],
        eventTime: data.eventTime,
        eventType: data.eventType,
        guestCount: data.guestCount,
        venueAddress: data.venueAddress,
        budget: data.budget || 0,
        theme: data.theme || "",
        description: data.description || "",
        preferences: "",
        specialRequests: data.specialRequests || "",
      };

      const customer = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: "",
      };

      const res = await apiRequest("POST", "/api/custom-quotes", {
        quote,
        customer,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-quotes"] });
      onBookingSubmitted(data.quoteReference);
    },
    onError: () => {
      toast({
        title: "Quote Request Failed",
        description:
          "There was an error submitting your quote request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const nextStep = async () => {
    let fieldsToValidate: (keyof BookingFormValues)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["bookingType"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["eventDate"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["name", "email", "phone"];
    } else if (currentStep === 4) {
      fieldsToValidate = [
        "eventType",
        "eventTime",
        "venueAddress",
        "guestCount",
      ];
    } else if (currentStep === 5 && bookingType === "standard") {
      fieldsToValidate = ["serviceId", "packageId"];
      const serviceId = form.getValues("serviceId");
      const packageId = form.getValues("packageId");

      if (!serviceId || serviceId < 1) {
        form.setError("serviceId", {
          message: "Please select a service category",
        });
        return;
      }
      if (!packageId) {
        form.setError("packageId", { message: "Please select a package" });
        return;
      }
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: BookingFormValues) => {
    if (bookingType === "custom") {
      createQuoteMutation.mutate(data);
    } else {
      createBookingMutation.mutate(data);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `₱${(priceInCents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  const isStepComplete = (step: number) => step < currentStep;

  const getEligiblePackages = () => {
    return packages.filter((pkg) => {
      const meetsMin = guestCount >= pkg.minGuests;
      const meetsMax = !pkg.maxGuests || guestCount <= pkg.maxGuests;
      return meetsMin && meetsMax && pkg.isActive;
    });
  };

  const getDishesByCategory = (category: string) => {
    const categoryMapping: Record<string, string> = {
      "Pork Menu": "pork",
      "Chicken Menu": "chicken",
      "Beef Menu": "beef",
      "Fish Menu": "fish",
      "Appetizers (Pasta/Vegetables)": "appetizer",
      "Dessert": "dessert",
      "Standard Inclusions": "standard_inclusion",
      "Freebies (Amenities)": "amenity"
    };
    const dbCategory = categoryMapping[category] || category.toLowerCase();
    return dishes.filter((d) => d.category === dbCategory && d.isAvailable);
  };

  const toggleDish = (dishId: number) => {
    const current = form.getValues("selectedDishes") || [];
    if (current.includes(dishId)) {
      form.setValue(
        "selectedDishes",
        current.filter((id) => id !== dishId),
      );
    } else {
      form.setValue("selectedDishes", [...current, dishId]);
    }
  };

  const getDishSelectionCount = (categoryLabel: string) => {
    const categoryMapping: Record<string, string> = {
      "Pork Menu": "pork",
      "Chicken Menu": "chicken",
      "Beef Menu": "beef",
      "Fish Menu": "fish",
      "Appetizers (Pasta/Vegetables)": "appetizer",
      "Dessert": "dessert",
      "Standard Inclusions": "standard_inclusion",
      "Freebies (Amenities)": "amenity"
    };
    const dbCategory = categoryMapping[categoryLabel] || categoryLabel.toLowerCase();
    const categoryDishes = dishes.filter((d) => d.category === dbCategory);
    return selectedDishes.filter((id) =>
      categoryDishes.some((d) => d.id === id),
    ).length;
  };

  useEffect(() => {
    if (isOpen && currentStep === 5 && !selectedServiceIdValue) {
      const eventType = form.getValues("eventType");
      const matchedService = services.find(
        (s) =>
          s.name.toLowerCase().includes(eventType.toLowerCase()) ||
          eventType.toLowerCase().includes(s.name.toLowerCase()),
      );
      if (matchedService) {
        form.setValue("serviceId", matchedService.id);
      }
    }
  }, [currentStep, isOpen, services, form, selectedServiceIdValue]);

  const renderReviewStep = () => {
    const selectedPackage = packages.find((p) => p.id === selectedPackageId);
    const selectedService = services.find(
      (s) => s.id === selectedServiceIdValue,
    );
    const totalPrice = selectedPackage
      ? selectedPackage.pricePerPerson * guestCount
      : (selectedService?.basePrice || 0) * guestCount;

    const selectedDishNames = dishes
      .filter((d) => selectedDishes.includes(d.id))
      .map((d) => d.name);

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-heading text-primary mb-4">
          Review Your {bookingType === "custom" ? "Quote Request" : "Booking"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-gray-500 mb-2">
                EVENT DETAILS
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Date:</span>{" "}
                  {form.getValues("eventDate")?.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p>
                  <span className="text-gray-500">Time:</span>{" "}
                  {form.getValues("eventTime")}
                </p>
                <p>
                  <span className="text-gray-500">Type:</span>{" "}
                  {
                    EVENT_TYPES.find(
                      (t) => t.value === form.getValues("eventType"),
                    )?.label
                  }
                </p>
                <p>
                  <span className="text-gray-500">Guests:</span> {guestCount}
                </p>
                <p>
                  <span className="text-gray-500">Venue:</span>{" "}
                  {form.getValues("venueAddress")}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-gray-500 mb-2">
                CONTACT INFORMATION
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Name:</span>{" "}
                  <span className="whitespace-pre-wrap break-words">
                    {form.getValues("name")}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Email:</span>{" "}
                  {form.getValues("email")}
                </p>
                <p>
                  <span className="text-gray-500">Phone:</span>{" "}
                  {form.getValues("phone")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {bookingType === "standard" && selectedPackage && (
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                <h4 className="font-bold text-sm text-gray-500 mb-2">
                  SELECTED PACKAGE
                </h4>
                <p className="font-bold text-lg">{selectedPackage.name}</p>
                <p className="text-2xl font-bold text-primary mt-2">
                  {formatPrice(selectedPackage.pricePerPerson)}
                </p>
              </div>
            )}

            {bookingType === "standard" && selectedDishNames.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-sm text-gray-500 mb-2">
                  SELECTED MENU ({selectedDishNames.length} items)
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedDishNames.map((name, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {bookingType === "custom" && form.getValues("theme") && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-sm text-gray-500 mb-2">
                  EVENT THEME
                </h4>
                <p className="text-sm">{form.getValues("theme")}</p>
              </div>
            )}

            {bookingType === "custom" && form.getValues("description") && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-sm text-gray-500 mb-2">
                  EVENT DESCRIPTION
                </h4>
                <p className="text-sm whitespace-pre-wrap">{form.getValues("description")}</p>
              </div>
            )}

            {bookingType === "custom" && form.getValues("budget") && (
              <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-lg">
                <h4 className="font-bold text-sm text-gray-500 mb-2">
                  YOUR BUDGET
                </h4>
                <p className="text-2xl font-bold text-secondary">
                  {formatPrice(form.getValues("budget") || 0)}
                </p>
              </div>
            )}

            {form.getValues("specialRequests") && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold text-sm text-gray-500 mb-2">
                  SPECIAL REQUESTS
                </h4>
                <p className="text-sm">{form.getValues("specialRequests")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg flex items-start gap-2">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">What happens next?</p>
            <p className="text-gray-600 mt-1">
              {bookingType === "custom"
                ? "Your quote request will be reviewed by our team. We'll prepare a custom proposal and contact you within 24-48 hours."
                : "Your booking request will be reviewed by our team. Once approved, you'll receive payment instructions for the deposit to secure your date."}
            </p>
          </div>
        </div>

        {bookingType === "standard" && (
          <div className="border-t pt-4 mt-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Estimated Total Price</p>
                <p className="text-xs text-gray-400">Final price will be confirmed upon review</p>
              </div>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="termsAgreed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer">
                  I agree to the{" "}
                  <a href="#" className="text-primary hover:underline">
                    terms and conditions
                  </a>{" "}
                  *
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-heading text-primary mb-4">
              Choose Booking Type
            </h3>
            <p className="text-gray-600 mb-6">
              Select how you'd like to proceed with your catering booking.
            </p>

            <RadioGroup
              value={bookingType}
              onValueChange={(value: "standard" | "custom") => {
                setBookingType(value);
                form.setValue("bookingType", value);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${bookingType === "standard" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
              >
                <RadioGroupItem
                  value="standard"
                  id="standard"
                  className="sr-only"
                />
                <Label htmlFor="standard" className="cursor-pointer">
                  <div className="flex items-start gap-4">
                    <Package className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-2">
                        Standard Package
                      </h4>
                      <p className="text-sm text-gray-600">
                        Choose from our pre-designed packages with fixed
                        pricing. Perfect for weddings, debuts, and celebrations.
                      </p>
                      <ul className="mt-3 text-sm text-gray-600 space-y-1">
                        <li>• Browse available packages</li>
                        <li>• Select your menu items</li>
                        <li>• Instant price calculation</li>
                      </ul>
                    </div>
                  </div>
                </Label>
              </div>

              <div
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${bookingType === "custom" ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
              >
                <RadioGroupItem
                  value="custom"
                  id="custom"
                  className="sr-only"
                />
                <Label htmlFor="custom" className="cursor-pointer">
                  <div className="flex items-start gap-4">
                    <FileText className="h-8 w-8 text-secondary flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-lg mb-2">Custom Quote</h4>
                      <p className="text-sm text-gray-600">
                        Tell us your requirements and budget, and we'll create a
                        personalized proposal for you.
                      </p>
                      <ul className="mt-3 text-sm text-gray-600 space-y-1">
                        <li>• Describe your needs</li>
                        <li>• Set your budget range</li>
                        <li>• Receive a custom proposal</li>
                      </ul>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-heading text-primary mb-4">
              Select Event Date
            </h3>
            <div className="flex flex-col items-center">
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center">
                    <FormControl>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date: Date) => {
                          return (
                            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                            unavailableDates.some(
                              (unavailableDate: Date) =>
                                unavailableDate.getDate() === date.getDate() &&
                                unavailableDate.getMonth() ===
                                  date.getMonth() &&
                                unavailableDate.getFullYear() ===
                                  date.getFullYear(),
                            )
                          );
                        }}
                        className="rounded-md border"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-gray-200 mr-2"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 mr-2"></div>
                <span className="text-sm">Fully Booked</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-primary mr-2"></div>
                <span className="text-sm">Selected</span>
              </div>
            </div>

            {form.getValues("eventDate") && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg text-center">
                <p className="text-sm">
                  Selected Date:{" "}
                  <span className="font-medium">
                    {form.getValues("eventDate")?.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
              </div>
            )}
          </div>
        );

      case 3:
      return (
        <div className="space-y-6" key="step-personal-info"> {/* Add unique key here */}
          <h3 className="text-xl font-heading text-primary mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name" // Ensure this name is exactly "name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input 
                      key="full-name-input" // Add a specific key to this input
                      placeholder="Juan Dela Cruz" 
                      {...field} 
                      value={field.value || ""} 
                    />
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
                      <Input
                        type="email"
                        placeholder="juan@email.com"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="09XX XXX XXXX"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alternateContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Contact (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Alternate phone or email"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-heading text-primary mb-4">
              Event Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type *</FormLabel>
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
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
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
                    <FormLabel>Event Time *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_SLOTS.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venueAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Venue Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="House No., Street, Barangay, City"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {bookingType === "custom" && (
                <>
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Theme</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Enchanted Forest, Modern Minimalist" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Budget (₱)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter your budget" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Event Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the event you want (e.g., style, atmosphere, specific requirements)" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest Count: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={10}
                        max={500}
                        step={5}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="mt-4"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10 guests</span>
                      <span>500 guests</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </div>
        );

      case 5:
        if (bookingType === "custom") {
          return renderReviewStep();
        }

        const eligiblePackages = getEligiblePackages();

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-heading text-primary">
                Select Package
              </h3>
              <Badge variant="outline">{guestCount} guests</Badge>
            </div>

            <div className="mb-4">
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Category</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        form.setValue("packageId", undefined);
                      }}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem
                            key={service.id}
                            value={service.id.toString()}
                          >
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {eligiblePackages.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {eligiblePackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedPackageId === pkg.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                    onClick={() => form.setValue("packageId", pkg.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg">{pkg.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {pkg.description}
                        </p>
                        {pkg.features && pkg.features.length > 0 && (
                          <ul className="space-y-1 mt-2">
                            {pkg.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-gray-700"
                              >
                                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-xl font-bold text-primary">
                          {formatPrice(pkg.pricePerPerson)}
                        </div>
                        <div className="text-xs text-gray-500">per person</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {pkg.minGuests}-{pkg.maxGuests || "500+"} guests
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {selectedServiceIdValue ? (
                  <p>
                    No packages available for {guestCount} guests in this
                    category. Try adjusting your guest count or selecting a
                    different service.
                  </p>
                ) : (
                  <p>
                    Please select a service category to see available packages.
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 6:
        if (bookingType === "standard") {
          const selectedPackage = packages.find(p => p.id === selectedPackageId);
          
          // Improved logic to detect package requirements from features or name
          const parseRequirement = (categoryLabel: string) => {
            const lowerLabel = categoryLabel.toLowerCase();
            const feature = selectedPackage?.features?.find(f => 
              f.toLowerCase().includes(lowerLabel) && /\d/.test(f)
            );
            if (feature) {
              const match = feature.match(/(\d+)/);
              return match ? parseInt(match[1]) : 1;
            }
            return 1;
          };

          const porkDishes = getDishesByCategory("Pork Menu");
          const chickenDishes = getDishesByCategory("Chicken Menu");
          const beefDishes = getDishesByCategory("Beef Menu");
          const fishDishes = getDishesByCategory("Fish Menu");
          const appetizerDishes = getDishesByCategory("Appetizers (Pasta/Vegetables)");
          const dessertDishes = getDishesByCategory("Dessert");
          const inclusionDishes = getDishesByCategory("Standard Inclusions");
          const amenityDishes = getDishesByCategory("Freebies (Amenities)");

          const categories = [
            { label: "Pork Menu", dishes: porkDishes, min: parseRequirement("Pork") },
            { label: "Chicken Menu", dishes: chickenDishes, min: parseRequirement("Chicken") },
            { label: "Beef Menu", dishes: beefDishes, min: parseRequirement("Beef") },
            { label: "Fish Menu", dishes: fishDishes, min: parseRequirement("Fish") },
            { label: "Appetizers (Pasta/Vegetables)", dishes: appetizerDishes, min: parseRequirement("Appetizer") },
            { label: "Dessert", dishes: dessertDishes, min: parseRequirement("Dessert") },
            { label: "Standard Inclusions", dishes: inclusionDishes, min: 0 },
            { label: "Freebies (Amenities)", dishes: amenityDishes, min: 0 },
          ];

          return (
            <div className="space-y-6">
              <h3 className="text-xl font-heading text-primary mb-4">
                Select Your Menu
              </h3>

              {selectedPackage && (
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg mb-4">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    {selectedPackage.name} Requirements:
                  </p>
                  <ul className="text-xs text-primary/80 mt-2 list-disc list-inside">
                    {selectedPackage.features?.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((cat) => (
                  <Badge
                    key={cat.label}
                    variant={
                      getDishSelectionCount(cat.label) >= cat.min ? "default" : "outline"
                    }
                  >
                    {cat.label.split(' ')[0]}: {getDishSelectionCount(cat.label)}/{cat.min}+
                  </Badge>
                ))}
              </div>

              <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2">
                {categories.map((cat) => cat.dishes.length > 0 && (
                  <div key={cat.label}>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      <UtensilsCrossed className="h-4 w-4" />
                      {cat.label}
                      {cat.min > 0 && (
                        <span className="text-sm font-normal text-gray-500">
                          (Select at least {cat.min})
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {cat.dishes.map((dish) => (
                        <div
                          key={dish.id}
                          className={cn(
                            "border rounded-lg p-3 cursor-pointer transition-all",
                            selectedDishes.includes(dish.id) 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          onClick={() => toggleDish(dish.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedDishes.includes(dish.id)}
                            />
                            <span className="text-sm font-medium">
                              {dish.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;

      case 7:
        return renderReviewStep();

      default:
        return null;
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center w-full overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="relative flex flex-col items-center text-center min-w-[60px]">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all
                  ${
                    isStepComplete(step.id)
                      ? "bg-green-500 text-white"
                      : currentStep === step.id
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
              >
                {isStepComplete(step.id) ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div
                className={`text-xs font-medium mt-1 ${currentStep === step.id ? "text-primary" : "text-gray-500"}`}
              >
                {step.label}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="w-8 md:w-12 h-1 bg-gray-200 mx-1">
                <div
                  className="h-1 bg-primary transition-all duration-300"
                  style={{ width: currentStep > step.id ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const isSubmitStep = currentStep === totalSteps;
  const isPending =
    createBookingMutation.isPending || createQuoteMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid grid-rows-[auto_1fr_auto] w-[95vw] max-w-[95vw] sm:w-full sm:max-w-4xl h-[95vh] sm:h-[90vh] p-0 overflow-hidden sm:rounded-lg">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-heading font-bold text-primary">
            {bookingType === "custom"
              ? "Request a Custom Quote"
              : "Book Your Catering Service"}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-6 mb-4">{renderStepIndicator()}</div>
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 overflow-y-auto">
          <Form {...form}>{renderStepContent()}</Form>
        </div>

        <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:justify-between items-stretch sm:items-center">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="w-full sm:w-auto"
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            {isSubmitStep ? (
              <Button
                onClick={form.handleSubmit(onSubmit)}
                className="bg-primary w-full sm:w-auto"
                disabled={isPending}
              >
                {isPending
                  ? "Submitting..."
                  : bookingType === "custom"
                    ? "Submit Quote Request"
                    : "Submit Booking"}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-primary w-full sm:w-auto"
              >
                Next Step
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
