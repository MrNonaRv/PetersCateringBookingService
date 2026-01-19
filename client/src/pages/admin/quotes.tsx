import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function QuotesPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Custom Quotes | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage custom quote requests for Peter's Creation Catering Services." />
        </Helmet>
        <AdminDashboard currentPage="quotes" />
      </>
    </ProtectedRoute>
  );
}
