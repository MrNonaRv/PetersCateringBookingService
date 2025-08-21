import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function CustomerView() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [bookingReference, setBookingReference] = useState("");
  
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
  const openBookingModal = (serviceId?: number) => {
    if (serviceId) {
      setSelectedService(serviceId);
    }
    setIsBookingModalOpen(true);
  };
  
  // Close booking modal
  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedService(null);
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
      <Navigation onBookNow={() => openBookingModal()} />
      <Hero onBookNow={() => openBookingModal()} />
      
      <Services 
        services={services || []} 
        isLoading={isLoading} 
        onSelectService={(serviceId) => openBookingModal(serviceId)} 
      />
      
      <BudgetInquiry 
        services={services || []}
        onSelectService={(serviceId) => openBookingModal(serviceId)}
        onCustomInquiry={() => openBookingModal()}
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
        onBookingSubmitted={handleBookingSubmitted}
      />
      
      <ConfirmationModal 
        isOpen={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        bookingReference={bookingReference}
      />
    </div>
  );
}
