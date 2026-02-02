import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions • Peter's Creation Catering Services</title>
        <meta name="description" content="Terms and conditions for bookings, room rentals, and Casa Amparo event reception add-on." />
      </Helmet>

      <section className="py-16 container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-heading font-bold text-primary">Terms & Conditions</h1>
          <p className="text-[#343a40] max-w-2xl mx-auto mt-2">
            Please review these terms before submitting your booking or quote request.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              <li>Dates are held only after deposit is received and confirmed.</li>
              <li>Prices may change based on final guest count, venue, and selected options.</li>
              <li>Client is responsible for accurate event details and timely communication.</li>
              <li>Changes after approval may affect availability and pricing.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Room Rentals (Casa Amparo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              <li>Room rental covers venue space only; catering packages are separate.</li>
              <li>Casa Amparo Event Reception add-on is optional and can be added to any event.</li>
              <li>Reception add-on fee is ₱5,000 and includes reception setup/services.</li>
              <li>Add-on may be applied when the venue is Casa Amparo or the venue address indicates Casa Amparo.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              <li>Deposit amount and instructions will be provided upon booking approval.</li>
              <li>Deposit secures the date; balances are due per agreed schedule.</li>
              <li>Failure to pay on time may result in cancellation or rescheduling.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Cancellations & Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <ul className="list-disc list-inside space-y-1">
              <li>Cancellation and change policies depend on timing and service commitments.</li>
              <li>Some fees may be non-refundable once services and materials are secured.</li>
              <li>Contact us immediately for any adjustments needed.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
