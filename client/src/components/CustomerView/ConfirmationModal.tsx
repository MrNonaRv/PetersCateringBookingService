import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Phone, Clock, CreditCard } from "lucide-react";

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
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading font-bold text-primary mb-2">
              Booking Request Submitted!
            </DialogTitle>
            <DialogDescription className="text-base text-[#343a40]">
              Thank you for choosing Peter's Creation Catering Services.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-primary/10 p-4 rounded-lg text-left my-6">
            <p className="text-sm font-medium">
              Booking Reference: <span className="text-primary font-bold">{bookingReference}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">Please save this reference number for your records.</p>
          </div>

          <div className="text-left space-y-4 mb-6">
            <h4 className="font-semibold text-gray-800">What happens next?</h4>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Review within 24 hours</p>
                <p className="text-xs text-gray-600">Our team will review your booking request and confirm availability.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Phone className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">We'll contact you</p>
                <p className="text-xs text-gray-600">Expect a call or message to discuss your event details and finalize the menu.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Deposit payment</p>
                <p className="text-xs text-gray-600">Once approved, you'll receive a payment link to secure your booking with a 50% deposit.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Mail className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Confirmation email</p>
                <p className="text-xs text-gray-600">A confirmation email has been sent to your email address with booking details.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-left mb-4">
            <p className="text-xs text-gray-600">
              <strong>Questions?</strong> Contact us at <a href="tel:+639123456789" className="text-primary hover:underline">+63 912 345 6789</a> or email <a href="mailto:book@peterscreation.com" className="text-primary hover:underline">book@peterscreation.com</a>
            </p>
          </div>
          
          <Button 
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
