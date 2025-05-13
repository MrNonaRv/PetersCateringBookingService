import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Dashboard | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Admin dashboard for Peter's Creation Catering Services." />
        </Helmet>
        <AdminDashboard currentPage="dashboard" />
      </>
    </ProtectedRoute>
  );
}
