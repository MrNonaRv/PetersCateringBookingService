import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function ServicePackagesPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Service Packages | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage service packages for Peter's Creation Catering." />
        </Helmet>
        <AdminDashboard currentPage="service-packages" />
      </>
    </ProtectedRoute>
  );
}