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
  MapPin,
  Building
} from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  featured: boolean;
}

interface Venue {
  id: number;
  name: string;
  description: string | null;
  address: string;
  capacityMin: number;
  capacityMax: number | null;
  price: number;
  type: string;
  imageUrl: string | null;
  isAvailable: boolean;
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

import { 
  formatPesos, 
  formatCents, 
  formatLocalYMD, 
  parseLocalYMD 
} from "@/lib/utils";
import { EVENT_TYPES, TIME_SLOTS } from "@/lib/constants";
import { BookingReview } from "./Booking/BookingReview";

const bookingFormSchema = z
  .object({
    bookingType: z.enum(["standard", "custom", "room"]),
    serviceId: z.number().optional(),
    packageId: z.number().optional(),
    eventDate: z.date({ required_error: "Please select a date" }),
    eventType: z.string().optional(),
    eventTime: z.string().optional(),
    guestCount: z
      .number()
      .min(1, "Minimum 1 guest")
      .max(500, "Maximum 500 guests"),
    venueAddress: z.string().optional(),
    venueId: z.number().optional(),
    casaReceptionAddon: z.boolean().default(false),
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
  .superRefine((data, ctx) => {
    if (data.bookingType !== "room") {
      const et = (data.eventType || "").trim();
      if (!et) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select event type",
          path: ["eventType"],
        });
      }
      const tm = (data.eventTime || "").trim();
      if (!tm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select event time",
          path: ["eventTime"],
        });
      }
    }
    if (data.bookingType === "standard" && data.guestCount < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimum 10 guests",
        path: ["guestCount"],
      });
    }
    const requireAddress = !data.casaReceptionAddon && data.bookingType !== "room";
    if (requireAddress) {
      const addr = (data.venueAddress || "").trim();
      if (!addr || addr.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter the venue address",
          path: ["venueAddress"],
        });
      }
    }
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
  initialPackageId?: number | null;
  initialBookingType?: "standard" | "custom" | "room";
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
  room: [
    { id: 1, label: "Date", icon: CalendarIcon },
    { id: 2, label: "Info", icon: User },
    { id: 3, label: "Review", icon: ClipboardCheck },
  ],
};

// EVENT_TYPES moved to @/lib/constants

export default function BookingModal({
  isOpen,
  onClose,
  services,
  selectedServiceId,
  initialPackageId,
  initialBookingType = "standard",
  onBookingSubmitted,
}: BookingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingType, setBookingType] = useState<"standard" | "custom" | "room">(initialBookingType);
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
  const casaAddon = form.watch("casaReceptionAddon");
  const [expandedPackageId, setExpandedPackageId] = useState<number | null>(null);

  const { data: availabilities = [] } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
    enabled: isOpen,
    staleTime: 0,
    gcTime: 0,
  });
  const selectedDateStr = form.watch("eventDate") ? formatLocalYMD(form.watch("eventDate") as Date) : "";
  const { data: capacity } = useQuery<any>({
    queryKey: ["/api/capacity-calendar", selectedDateStr],
    queryFn: async () => {
      const res = await fetch(`/api/capacity-calendar/${selectedDateStr}`);
      if (!res.ok) throw new Error("Failed to fetch capacity");
      return res.json();
    },
    enabled: isOpen && !!selectedDateStr,
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

  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      const mode = initialBookingType || "standard";
      setBookingType(mode);
      const initialStep = mode === "room" ? 1 : (initialPackageId || mode === "custom" ? 2 : 1);
      setCurrentStep(initialStep);

      let autoEventType = "";
      if (selectedServiceId) {
        const service = services.find(s => s.id === selectedServiceId);
        if (service) {
          const matchedType = EVENT_TYPES.find(
            t => service.name.toLowerCase().includes(t.value) || 
                 service.name.toLowerCase().includes(t.label.toLowerCase()) ||
                 t.label.toLowerCase().includes(service.name.toLowerCase())
          );
          if (matchedType) {
            autoEventType = matchedType.value;
          }
        }
      }

      form.reset({
        bookingType: mode,
        serviceId: selectedServiceId || 0,
        packageId: initialPackageId || undefined,
        guestCount: 100,
        selectedDishes: [],
        preferredContactMethod: "phone",
        termsAgreed: false,
        name: "",
        email: "",
        phone: "",
        alternateContact: "",
        casaReceptionAddon: false,
        eventType: autoEventType,
      });
    }
  }, [isOpen, selectedServiceId, initialPackageId, form, services]);

  useEffect(() => {
    if (isOpen && bookingType === "room" && venues.length > 0) {
      const casa = venues.find((v) => v.name.toLowerCase().includes("amparo"));
      if (casa) {
        form.setValue("venueId", casa.id);
        form.setValue("venueAddress", casa.address);
      }
    }
  }, [isOpen, bookingType, venues, form]);
  useEffect(() => {
    if (casaAddon) {
      const addr = (form.getValues("venueAddress") || "").toLowerCase();
      if (!addr.includes("amparo")) {
        form.setValue("venueAddress", "Casa Amparo Events Place");
      }
    }
  }, [casaAddon, form]);

  const unavailableDates = availabilities
    .filter((a: Availability) => !a.isAvailable)
    .map((a: Availability) => parseLocalYMD(a.date));

  const stepsConfig = (STEP_CONFIG as Record<string, { id: number; label: string; icon: any }[]>)[bookingType] || STEP_CONFIG.standard;
  const totalSteps = stepsConfig.length;

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      const selectedPackage = packages.find((p) => p.id === data.packageId);
      const currentSelectedService = services.find((s) => s.id === data.serviceId);
      const selectedVenue = venues.find((v) => v.id === data.venueId);

      let totalPrice = selectedPackage
        ? (selectedPackage.pricePerPerson * data.guestCount)
        : (currentSelectedService?.basePrice || 0) * data.guestCount;

      if (selectedVenue) {
        totalPrice += selectedVenue.price;
      }
      if (data.casaReceptionAddon) {
        totalPrice += 500000;
      }

      const selectedDishNames = dishes
        .filter((d) => data.selectedDishes.includes(d.id))
        .map((d) => d.name);

      const dishesNote =
        selectedDishNames.length > 0
          ? `\n\nSelected Menu Items: ${selectedDishNames.join(", ")}`
          : "";
      const casaNote =
        data.casaReceptionAddon
          ? `\n\nAdd-on: Casa Amparo Event Reception (₱5,000)`
          : "";

      if (!data.serviceId || !data.packageId) {
        throw new Error(
          "Service and package selection required for standard booking",
        );
      }

      const booking = {
        serviceId: data.serviceId,
        packageId: data.packageId,
        eventDate: formatLocalYMD(data.eventDate),
        eventType: data.eventType,
        eventTime: data.eventTime || "Fixed",
        guestCount: data.guestCount,
        venueAddress: data.venueAddress,
        venueId: data.venueId,
        menuPreference: "package",
        serviceStyle: "buffet",
        additionalServices: "",
        theme: data.theme || "",
        specialRequests: (data.specialRequests || "") + dishesNote + casaNote,
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
        eventDate: formatLocalYMD(data.eventDate),
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

    if (bookingType === "room") {
      if (currentStep === 1) {
        fieldsToValidate = ["eventDate"];
      } else if (currentStep === 2) {
        fieldsToValidate = ["name", "email", "phone"];
      }
      const isValidRoom = await form.trigger(fieldsToValidate);
      if (!isValidRoom) return;
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }

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
      ];
      if (bookingType === "custom") {
        fieldsToValidate.push("guestCount");
      }
      if (bookingType === "room") {
        fieldsToValidate = ["eventTime"];
        const venueId = form.getValues("venueId");
        if (!venueId) {
          form.setError("venueId", { message: "Please select a room" });
          return;
        }
      }
      if (form.getValues("casaReceptionAddon")) {
        fieldsToValidate = fieldsToValidate.filter((f) => f !== "venueAddress");
      }
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
    } else if (currentStep === 6 && bookingType === "standard") {
      const selectedPackage = packages.find(p => p.id === selectedPackageId);
      if (selectedPackage?.hasThemedCake) {
        const theme = form.getValues("theme");
        if (!theme || theme.trim() === "") {
          form.setError("theme", { message: "Please specify a cake theme" });
          return; // Stop if theme is required but missing
        }
      }
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    if (currentStep < totalSteps) {
      let next = currentStep + 1;
      if (
        bookingType === "standard" &&
        currentStep === 4 &&
        !!form.getValues("packageId")
      ) {
        next = 6; // Skip step 5 (Package) if a package is already selected
      }
      setCurrentStep(next);
    }
  };

  const prevStep = () => {
    if (initialBookingType === "custom" && currentStep === 2) {
      return;
    }
    if (currentStep > 1) {
      let prev = currentStep - 1;
      if (
        bookingType === "standard" &&
        currentStep === 6 &&
        !!form.getValues("packageId")
      ) {
        prev = 4; // Skip back over step 5 if it was skipped
      }
      setCurrentStep(prev);
    }
  };

  const onSubmit = (data: BookingFormValues) => {
    if (bookingType === "custom") {
      createQuoteMutation.mutate(data);
    } else {
      createBookingMutation.mutate(data);
    }
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
      if (eventType) {
        const matchedService = services.find(
          (s) =>
            s.name.toLowerCase().includes(eventType.toLowerCase()) ||
            eventType.toLowerCase().includes(s.name.toLowerCase()),
        );
        if (matchedService) {
          form.setValue("serviceId", matchedService.id);
        }
      }
    }
  }, [currentStep, isOpen, services, form, selectedServiceIdValue]);

  useEffect(() => {
    if (selectedPackageId && bookingType === "standard") {
      const pkg = packages.find((p) => p.id === selectedPackageId);
      if (pkg) {
        // Always set to minGuests when a package is selected
        // This ensures the guest count aligns with the package baseline
        // instead of sticking to the default 100
        form.setValue("guestCount", pkg.minGuests);
      }
    }
  }, [selectedPackageId, packages, form, bookingType]);

  const renderReviewStep = () => {
    const selectedPackage = packages.find((p) => p.id === selectedPackageId);
    const selectedService = services.find(
      (s) => s.id === selectedServiceIdValue,
    );
    const selectedVenue = venues.find((v) => v.id === form.getValues("venueId"));

    let totalPriceCalc = selectedPackage
      ? (selectedPackage.pricePerPerson * guestCount)
      : (selectedService?.basePrice || 0) * guestCount;

    if (selectedVenue) {
      totalPriceCalc += selectedVenue.price;
    }
    if (form.getValues("casaReceptionAddon")) {
      totalPriceCalc += 500000;
    }

    const selectedDishNames = dishes
      .filter((d) => selectedDishes.includes(d.id))
      .map((d) => d.name);

    return (
      <div className="space-y-6">
        <BookingReview
          bookingType={bookingType}
          formValues={form.getValues()}
          selectedService={selectedService}
          selectedPackage={selectedPackage}
          selectedVenue={selectedVenue}
          selectedDishNames={selectedDishNames}
          totalPrice={totalPriceCalc}
        />
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
                  I have read and agree to the terms and conditions{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    View full terms
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
        if (bookingType === "room") {
          return (
            <div className="space-y-6">
              <h3 className="text-xl font-heading text-primary mb-4">
                Select Date
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
                  {capacity && (
                    <p className="text-xs text-gray-600 mt-1">
                      Slots available: <span className="font-bold">{Math.max(0, (capacity.maxSlots || 0) - (capacity.bookedSlots || 0))}</span> of {capacity.maxSlots}
                      {capacity.dayType ? ` • ${capacity.dayType}` : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        }
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
        if (bookingType === "room") {
          return (
            <div className="space-y-6" key="step-personal-info">
              <h3 className="text-xl font-heading text-primary mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Dela Cruz" {...field} value={field.value || ""} />
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
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan@email.com" {...field} value={field.value || ""} />
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
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="0912 345 6789" {...field} value={field.value || ""} />
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
                      <FormLabel>Alternate Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          );
        }
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
      if (bookingType === "room") {
        return renderReviewStep();
      }
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

              <div className="md:col-span-2 space-y-4">
                <Label>Venue Selection *</Label>

                {venues.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {venues.map((venue) => (
                      <div
                        key={venue.id}
                        className={cn(
                          "border rounded-lg p-4 cursor-pointer transition-all flex flex-col gap-2",
                          form.getValues("venueId") === venue.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => {
                          form.setValue("venueId", venue.id);
                          form.setValue("venueAddress", venue.address);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary" />
                            {venue.name}
                          </h4>
                          {venue.price > 0 && (
                            <Badge variant="secondary">
                              {formatPesos(venue.price / 100)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{venue.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {venue.address}
                        </div>
                        <div className="text-xs text-gray-500">
                          Capacity: {venue.capacityMin} - {venue.capacityMax || "Unlimited"} pax
                        </div>
                      </div>
                    ))}

                    <div
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all flex flex-col gap-2 justify-center",
                        !form.getValues("venueId")
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => {
                        form.setValue("venueId", undefined);
                        form.setValue("venueAddress", "");
                      }}
                    >
                      <h4 className="font-bold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        Other Location
                      </h4>
                      <p className="text-sm text-gray-600">Specify your own venue address</p>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="venueAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Address {form.getValues("venueId") ? "(Auto-filled)" : "*"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="House No., Street, Barangay, City"
                          {...field}
                          disabled={!!form.getValues("venueId") || !!form.getValues("casaReceptionAddon")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(() => {
                  const v = venues.find((vv) => vv.id === form.getValues("venueId"));
                  const bySelect = v?.name?.toLowerCase().includes("amparo");
                  const byAddress = (form.getValues("venueAddress") || "").toLowerCase().includes("amparo");
                  const isCasa = bySelect || byAddress;
                  return (
                    <FormField
                      control={form.control}
                      name="casaReceptionAddon"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormLabel>Casa Amparo Event Reception Add-on (₱5,000)</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <span className="text-sm text-gray-600">
                                Add reception setup and services for any event
                                {!isCasa && " — Fee applies only when the venue is Casa Amparo"}
                              </span>
                            </div>
                          </FormControl>
                          {!isCasa && (
                            <p className="text-xs text-gray-500">
                              You can preselect this add-on now; the ₱5,000 fee will be applied only if the venue is Casa Amparo.
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })()}
              </div>

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
                </>
              )}
            </div>
          </div>
        );

      case 5:
        if (bookingType === "custom" || bookingType === "room") {
          return renderReviewStep();
        }

        const eligiblePackages = bookingType === "standard" 
          ? packages.filter(p => p.isActive) 
          : getEligiblePackages();

        const selectedPkg = packages.find(p => p.id === selectedPackageId);

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-heading text-primary">
                Select Package
              </h3>
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
                        <div className="mt-3 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id);
                            }}
                          >
                            {expandedPackageId === pkg.id ? "Hide Details" : "See More"}
                          </Button>
                          <Button
                            type="button"
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              form.setValue("packageId", pkg.id);
                            }}
                          >
                            Select
                          </Button>
                        </div>
                        {expandedPackageId === pkg.id && (
                          <div className="mt-4">
                            {pkg.features && pkg.features.length > 0 && (
                              <ul className="space-y-1">
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
                            <div className="text-xs text-gray-500 mt-2">
                              Min. {pkg.minGuests} guests{pkg.maxGuests ? ` • Max. ${pkg.maxGuests}` : ""}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4"></div>
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

            {bookingType === "standard" && selectedPkg && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Guest Count
                </h4>
                <FormField
                  control={form.control}
                  name="guestCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        How many guests? ({selectedPkg.minGuests} - {selectedPkg.maxGuests || "500+"})
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={selectedPkg.minGuests}
                          max={selectedPkg.maxGuests || 500}
                          step={5}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="mt-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{selectedPkg.minGuests} guests</span>
                        <span>{selectedPkg.maxGuests || "500+"} guests</span>
                      </div>
                      <div className="mt-2 text-center font-bold text-lg text-primary">
                        {field.value} Guests
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        );

      case 6:
        if (bookingType === "standard") {
          const selectedPackage = packages.find(p => p.id === selectedPackageId);

          const extractRequirement = (label: string, fallback: number) => {
            const features = selectedPackage?.features || [];
            for (const f of features) {
              const m = f.match(new RegExp(`^\\s*${label}\\s*(?:[:\\-])?\\s*(\\d+)`, "i"));
              if (m) {
                const n = parseInt(m[1], 10);
                if (Number.isFinite(n) && n > 0 && n <= 20) return n;
                return fallback;
              }
            }
            return fallback;
          };

          const porkDishes = getDishesByCategory("Pork Menu");
          const chickenDishes = getDishesByCategory("Chicken Menu");
          const beefDishes = getDishesByCategory("Beef Menu");
          const fishDishes = getDishesByCategory("Fish Menu");
          const appetizerDishes = getDishesByCategory("Appetizers (Pasta/Vegetables)");
          const dessertDishes = getDishesByCategory("Dessert");
          const inclusionDishes = getDishesByCategory("Standard Inclusions");
          const amenityDishes = getDishesByCategory("Freebies (Amenities)");

          const mainCourseRequired = extractRequirement("Main Courses", 4);
          const vegetableRequired = extractRequirement("Vegetable", 1);
          const dessertRequired = extractRequirement("Dessert", 1);

          const mainCourseCategories = ["pork","chicken","beef","fish"];
          const countSelectedInCats = (cats: string[]) => {
            const catDishes = dishes.filter(d => cats.includes(d.category));
            return selectedDishes.filter(id => catDishes.some(d => d.id === id)).length;
          };
          const mainSelectedCount = countSelectedInCats(mainCourseCategories);
          const vegSelectedCount = countSelectedInCats(["appetizer"]);
          const dessertSelectedCount = countSelectedInCats(["dessert"]);

          const categories = [
            { label: "Appetizers (Pasta/Vegetables)", dishes: appetizerDishes, min: vegetableRequired },
            { label: "Pork Menu", dishes: porkDishes, min: 0 },
            { label: "Chicken Menu", dishes: chickenDishes, min: 0 },
            { label: "Beef Menu", dishes: beefDishes, min: 0 },
            { label: "Fish Menu", dishes: fishDishes, min: 0 },
            { label: "Dessert", dishes: dessertDishes, min: dessertRequired },
            { label: "Standard Inclusions", dishes: inclusionDishes, min: 0 },
            { label: "Freebies (Amenities)", dishes: amenityDishes, min: 0 },
          ];

          return (
            <div className="space-y-6">
              <h3 className="text-xl font-heading text-primary mb-4">
                Select Your Menu
              </h3>

              {selectedPackage && selectedPackage.hasThemedCake && (
                 <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-lg mb-4">
                   <h4 className="font-bold text-secondary mb-2 flex items-center gap-2">
                     <Package className="h-4 w-4" />
                     Themed Cake Included
                   </h4>
                   <p className="text-sm text-gray-600 mb-3">
                     This package includes a themed cake. Please specify your desired theme below.
                   </p>
                   <FormField
                     control={form.control}
                     name="theme"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Cake Theme *</FormLabel>
                         <FormControl>
                           <Input 
                             placeholder="e.g. Unicorn, Superhero, Floral, Minimalist" 
                             {...field} 
                           />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
               )}

              {selectedPackage && (
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-lg mb-4">
                  <div className="text-xs text-gray-600 font-medium">
                    <span className="mr-4">Main Courses: {mainSelectedCount}/{mainCourseRequired}</span>
                    <span className="mr-4">Vegetable: {vegSelectedCount}/{vegetableRequired}</span>
                    <span>Dessert: {dessertSelectedCount}/{dessertRequired}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Appetizers</Badge>
                  <Badge variant="secondary">Main Courses</Badge>
                  <Badge variant="secondary">Dessert</Badge>
                  <Badge variant="secondary">Inclusions</Badge>
                  <Badge variant="secondary">Freebies</Badge>
                </div>
              </div>

              <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2">
                {[
                  { title: "Appetizers", cats: categories.filter(c => c.label.startsWith("Appetizers")) },
                  { title: "Main Courses", cats: categories.filter(c => ["Pork Menu","Chicken Menu","Beef Menu","Fish Menu"].includes(c.label)) },
                  { title: "Dessert", cats: categories.filter(c => c.label === "Dessert") },
                  { title: "Standard Inclusions", cats: categories.filter(c => c.label === "Standard Inclusions") },
                  { title: "Freebies (Amenities)", cats: categories.filter(c => c.label === "Freebies (Amenities)") },
                ].map(group => (
                  <div key={group.title}>
                    <h3 className="text-lg font-heading text-primary mb-2">{group.title}</h3>
                    {group.cats.map((cat) => cat.dishes.length > 0 && (
                      <div key={cat.label} className="mb-4">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                          <UtensilsCrossed className="h-4 w-4" />
                          {cat.label}
                          {cat.min > 0 && group.title !== "Main Courses" && (
                            <span className="text-sm font-normal text-gray-500">
                              (Select at least {cat.min})
                            </span>
                          )}
                          {group.title === "Main Courses" && (
                            <span className="text-sm font-normal text-gray-500">
                              (Select total {mainCourseRequired} items across Beef, Pork, Chicken, Fish)
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
                              onClick={() => {
                                const dcat = dish.category;
                                const isMain = mainCourseCategories.includes(dcat);
                                const isVeg = dcat === "appetizer";
                                const isDess = dcat === "dessert";
                                if (!selectedDishes.includes(dish.id)) {
                                  if (isMain && mainSelectedCount >= mainCourseRequired) return;
                                  if (isVeg && vegSelectedCount >= vegetableRequired) return;
                                  if (isDess && dessertSelectedCount >= dessertRequired) return;
                                }
                                toggleDish(dish.id);
                              }}
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
        {stepsConfig.map((step, index) => (
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

            {index < stepsConfig.length - 1 && (
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
              : bookingType === "room"
                ? "Book Your Room"
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
            {currentStep > (initialBookingType === "custom" ? 2 : 1) && (
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
