import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "./Navigation";
import Hero from "./Hero";
import Services from "./Services";
import BudgetInquiry from "./BudgetInquiry";
import About from "./About";
import Gallery from "./Gallery";
import { RecentEvents } from "./RecentEvents";
import { PaymentMethods } from "./PaymentMethods";
import Testimonials from "./Testimonials";
import Contact from "./Contact";
import Footer from "./Footer";
import BookingModal from "./BookingModal";
import ConfirmationModal from "./ConfirmationModal";
import Chatbot from "./Chatbot";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import AllPackagesModal from "./AllPackagesModal";

export default function CustomerView() {
  const [, setLocation] = useLocation();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isAllPackagesOpen, setIsAllPackagesOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [bookingReference, setBookingReference] = useState("");
  const [initialBookingType, setInitialBookingType] = useState<"standard" | "custom">("standard");

  const { toast } = useToast();

  // Fetch services
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const res = await fetch('/api/services');
      if (!res.ok) {
        throw new Error('Failed to fetch services');
      }
      return res.json();
    }
  });

  // Open booking modal
  const openBookingModal = (serviceId?: number, packageId?: number, mode?: "standard" | "custom" | "room") => {
    if (serviceId) {
      setSelectedService(serviceId);
    }
    if (packageId) {
      setSelectedPackage(packageId);
    }
    let computedMode: "standard" | "custom" | "room" = mode || "standard";
    if (!mode && serviceId && services) {
      const svc = services.find(s => s.id === serviceId);
      const name = (svc?.name || "").toLowerCase();
      if (name.includes("venue") || name.includes("room")) {
        computedMode = "room";
      }
    }
    setInitialBookingType(computedMode);
    setIsBookingModalOpen(true);
  };

  // Close booking modal
  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedService(null);
    setSelectedPackage(null);
  };

  // Handle booking submission
  const handleBookingSubmitted = (reference: string) => {
    setBookingReference(reference);
    setIsBookingModalOpen(false);
    setIsConfirmationModalOpen(true);
    toast({
      title: "Booking Submitted",
      description: "Your booking has been successfully submitted!",
    });
  };

  // Close confirmation modal
  const closeConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
  };

  return (
    <div className="relative">
      <Navigation onBookNow={() => setIsAllPackagesOpen(true)} />
      <Hero onBookNow={() => setIsAllPackagesOpen(true)} />

      <Services 
        services={services || []} 
        isLoading={isLoading} 
        onSelectService={(serviceId, packageId) => openBookingModal(serviceId, packageId)} 
        onRequestCustomQuote={(serviceId) => openBookingModal(serviceId, undefined, "custom")}
      />

      <About />
      <RecentEvents />
      <Gallery />
      <PaymentMethods />
      <Testimonials />
      <Contact />
      <Footer />

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={closeBookingModal} 
        services={services || []}
        selectedServiceId={selectedService}
        initialPackageId={selectedPackage}
        initialBookingType={initialBookingType}
        onBookingSubmitted={handleBookingSubmitted}
      />
      <AllPackagesModal
        isOpen={isAllPackagesOpen}
        onClose={() => setIsAllPackagesOpen(false)}
        services={services || []}
        onSelectPackage={(serviceId, packageId) => {
          setIsAllPackagesOpen(false);
          openBookingModal(serviceId, packageId, "standard");
        }}
        onRequestCustomQuote={() => {
          setIsAllPackagesOpen(false);
          openBookingModal(undefined, undefined, "custom");
        }}
      />

      <ConfirmationModal 
        isOpen={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        bookingReference={bookingReference}
      />

      <Chatbot services={services || []} />
    </div>
  );
}
