import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function AboutAdminPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>About Image | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage About section image." />
        </Helmet>
        <AdminDashboard currentPage="about" />
      </>
    </ProtectedRoute>
  );
}
