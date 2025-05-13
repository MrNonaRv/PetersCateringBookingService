import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Bookings | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage all bookings for Peter's Creation Catering Services." />
        </Helmet>
        <AdminDashboard currentPage="bookings" />
      </>
    </ProtectedRoute>
  );
}
