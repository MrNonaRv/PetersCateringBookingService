import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/AdminDashboard";
import { ProtectedRoute } from "@/components/providers/ProtectedRoute";

export default function GalleryPage() {
  return (
    <ProtectedRoute>
      <>
        <Helmet>
          <title>Gallery | Admin - Peter's Creation Catering</title>
          <meta name="description" content="Manage gallery images for Peter's Creation Catering." />
        </Helmet>
        <AdminDashboard currentPage="gallery" />
      </>
    </ProtectedRoute>
  );
}