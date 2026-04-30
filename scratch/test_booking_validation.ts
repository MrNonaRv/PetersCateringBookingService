import "dotenv/config";
import { insertBookingSchema } from "../shared/schema";

const sampleBooking = {
    serviceId: 1,
    packageId: 1,
    eventDate: "2024-05-18",
    eventType: "wedding",
    eventTime: "10:00 AM",
    guestCount: 100,
    venueAddress: "Test Address",
    venueId: 5, // Unknown field
    menuPreference: "package",
    serviceStyle: "buffet",
    totalPrice: 15000000,
    status: "pending_approval",
    paymentStatus: "pending",
    bookingReference: "TEST-REF-123",
    customerId: 0
};

// Simulate the cleaning logic I added to bookings.ts
const { 
    serviceId, packageId, eventDate, eventType, eventTime, 
    guestCount, venueAddress, menuPreference, serviceStyle,
    additionalServices, theme, specialRequests, totalPrice,
    status, paymentStatus, paymentMethod, paymentReference,
    bookingReference, customerId
} = sampleBooking;

const bookingToParse = {
    serviceId, packageId, eventDate, eventType, eventTime, 
    guestCount, venueAddress, menuPreference, serviceStyle,
    additionalServices: (additionalServices as any) || "",
    theme: (theme as any) || "",
    specialRequests: (specialRequests as any) || "",
    totalPrice, status, paymentStatus, 
    paymentMethod: (paymentMethod as any) || null,
    paymentReference: (paymentReference as any) || null,
    bookingReference, customerId
};

try {
    const data = insertBookingSchema.parse(bookingToParse);
    console.log("✅ Validation successful!");
    console.log("Parsed data (should not have venueId):", JSON.stringify(data, null, 2));
} catch (error) {
    console.error("❌ Validation failed:", error);
}
