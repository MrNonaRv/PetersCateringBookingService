import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function PaymentsPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Payments | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage payments for Peter's Creation Catering Services." />
        </Helmet>
        <AdminDashboard currentPage="payments" />
      </>
    </ProtectedRoute>
  );
}