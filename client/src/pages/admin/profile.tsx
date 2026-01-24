import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Profile | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage your admin profile for Peter's Creation Catering Services." />
        </Helmet>
        <AdminDashboard currentPage="profile" />
      </>
    </ProtectedRoute>
  );
}
