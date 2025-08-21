import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function AdminRecentEvents() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Recent Events Management | Admin | Peter's Creation Catering</title>
          <meta name="description" content="Manage recent events showcase for Peter's Creation Catering Services." />
        </Helmet>
        <AdminDashboard currentPage="recent-events" />
      </>
    </ProtectedRoute>
  );
}