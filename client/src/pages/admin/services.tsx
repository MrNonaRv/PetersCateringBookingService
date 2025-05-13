import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function ServicesPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Services | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage catering services for Peter's Creation Catering." />
        </Helmet>
        <AdminDashboard currentPage="services" />
      </>
    </ProtectedRoute>
  );
}
