import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingReference: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  bookingReference
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#2ecc71] mb-4">
            <i className="fas fa-check text-white text-xl"></i>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-bold text-primary mb-2">Booking Confirmed!</DialogTitle>
            <DialogDescription className="text-base text-[#343a40]">
              Thank you for booking with Peter's Creation Catering Services.
              <p className="mt-2 mb-6">A confirmation email has been sent to your email address. Our team will contact you shortly to discuss the details of your event.</p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-primary bg-opacity-10 p-4 rounded-lg text-left mb-4 mt-6">
            <p className="text-sm font-medium">Booking Reference: <span className="text-primary">{bookingReference}</span></p>
            <p className="text-sm">Please keep this reference number for your records.</p>
          </div>
          
          <Button 
            onClick={onClose}
            className="mt-4 w-full sm:w-auto bg-primary hover:bg-opacity-90"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
