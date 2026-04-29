import React from "react";
import { Badge } from "@/components/ui/badge";
import { Info, User, Calendar, Utensils, Users, CreditCard } from "lucide-react";
import { formatCents, formatPesos } from "@/lib/utils";
import { EVENT_TYPES } from "@/lib/constants";

interface BookingReviewProps {
  bookingType: string;
  formValues: any;
  selectedService?: any;
  selectedPackage?: any;
  selectedVenue?: any;
  selectedDishNames: string[];
  totalPrice: number;
}

export const BookingReview: React.FC<BookingReviewProps> = ({
  bookingType,
  formValues,
  selectedService,
  selectedPackage,
  selectedVenue,
  selectedDishNames,
  totalPrice,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-heading text-primary mb-4">
        Review Your {bookingType === "custom" ? "Quote Request" : "Booking"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-sm text-gray-500 mb-2">EVENT DETAILS</h4>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Date:</span>{" "}
                {formValues.eventDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              {bookingType !== "room" && (
                <p>
                  <span className="text-gray-500">Time:</span> {formValues.eventTime}
                </p>
              )}
              {bookingType !== "room" && formValues.eventType && (
                <p>
                  <span className="text-gray-500">Type:</span>{" "}
                  {EVENT_TYPES.find((t) => t.value === formValues.eventType)?.label}
                </p>
              )}
              <p>
                <span className="text-gray-500">Guests:</span> {formValues.guestCount}
              </p>
              <p>
                <span className="text-gray-500">Venue:</span> {formValues.venueAddress}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-bold text-sm text-gray-500 mb-2">CONTACT INFORMATION</h4>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="whitespace-pre-wrap break-words">{formValues.name}</span>
              </p>
              <p>
                <span className="text-gray-500">Email:</span> {formValues.email}
              </p>
              <p>
                <span className="text-gray-500">Phone:</span> {formValues.phone}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {bookingType === "standard" && selectedPackage && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-gray-500 mb-2">SELECTED PACKAGE</h4>
              <p className="font-bold text-lg">{selectedPackage.name}</p>
              <p className="text-sm text-gray-600 mt-1 mb-2">{selectedPackage.description}</p>
              {selectedPackage.features && selectedPackage.features.length > 0 && (
                <ul className="text-xs text-gray-600 list-disc list-inside mb-3 space-y-1">
                  {selectedPackage.features.map((feature: string, idx: number) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              )}
              <p className="text-2xl font-bold text-primary mt-2">
                {formatCents(selectedPackage.pricePerPerson)}
              </p>
            </div>
          )}

          {(bookingType === "standard" || bookingType === "room") && selectedVenue && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-gray-500 mb-2">
                {bookingType === "room" ? "SELECTED ROOM" : "SELECTED VENUE"}
              </h4>
              <p className="font-bold text-lg">{selectedVenue.name}</p>
              {selectedVenue.description && (
                <p className="text-sm text-gray-600 mt-1">{selectedVenue.description}</p>
              )}
              <div className="text-xs text-gray-500 mt-2 mb-2">
                <p>
                  Capacity: {selectedVenue.capacityMin} -{" "}
                  {selectedVenue.capacityMax || "Unlimited"} pax
                </p>
              </div>
              <p className="text-2xl font-bold text-primary mt-2">
                {formatCents(selectedVenue.price)}
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

          {formValues.theme && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-gray-500 mb-2">
                {bookingType === "standard" ? "CAKE THEME" : "EVENT THEME"}
              </h4>
              <p className="text-sm">{formValues.theme}</p>
            </div>
          )}

          {bookingType === "custom" && formValues.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-gray-500 mb-2">EVENT DESCRIPTION</h4>
              <p className="text-sm whitespace-pre-wrap">{formValues.description}</p>
            </div>
          )}

          {bookingType === "custom" && formValues.budget && (
            <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-gray-500 mb-2">YOUR BUDGET</h4>
              <p className="text-2xl font-bold text-secondary">
                {formatPesos(formValues.budget || 0)}
              </p>
            </div>
          )}

          {formValues.specialRequests && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-sm text-gray-500 mb-2">SPECIAL REQUESTS</h4>
              <p className="text-sm">{formValues.specialRequests}</p>
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

      {bookingType !== "custom" && (
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                Estimated Total Price
              </p>
              <p className="text-xs text-gray-400">Final price will be confirmed upon review</p>
            </div>
            <p className="text-3xl font-bold text-primary">{formatCents(totalPrice)}</p>
          </div>
        </div>
      )}
    </div>
  );
};
