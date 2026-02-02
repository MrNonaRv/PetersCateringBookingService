import cron from 'node-cron';
import { storage } from './storage';
import { sendBookingCancelled, sendCustomMessage } from './sms';

export function startBookingCleanupJob() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('Running booking cleanup job...');
    try {
      const bookings = await storage.getBookings();
      const now = new Date();

      for (const booking of bookings) {
        // Only check approved bookings that haven't paid deposit
        if (booking.status === 'approved' && !booking.depositPaid) {
            const createdAt = new Date(booking.createdAt);
            const diffMs = now.getTime() - createdAt.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            // Warning: 23 hours to 23.25 hours (to avoid spamming, matches cron interval)
            if (diffHours >= 23 && diffHours < 23.25) {
                 await sendCustomMessage({
                    customerPhone: booking.customer.phone,
                    message: `Hi ${booking.customer.name}, your booking ${booking.bookingReference} is awaiting deposit. Please pay within 1 hour to avoid cancellation. - Peters Catering`
                 });
                 console.log(`Sent warning for booking ${booking.id}`);
            }

            // Cancellation: > 24 hours
            if (diffHours >= 24) {
                await storage.updateBookingStatus(booking.id, 'cancelled');
                await sendBookingCancelled({
                    customerPhone: booking.customer.phone,
                    customerName: booking.customer.name,
                    bookingReference: booking.bookingReference
                });
                console.log(`Cancelled booking ${booking.id} due to non-payment`);
            }
        }
      }
    } catch (error) {
      console.error('Error in booking cleanup job:', error);
    }
  });
}
