import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Payment Settings | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage payment settings for Peter's Creation Catering Services." />
        </Helmet>
        <AdminDashboard currentPage="settings" />
      </>
    </ProtectedRoute>
  );
}
