import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function CustomersPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Customers | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage customer information for Peter's Creation Catering." />
        </Helmet>
        <AdminDashboard currentPage="customers" />
      </>
    </ProtectedRoute>
  );
}
