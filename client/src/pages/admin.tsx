import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Admin() {
  const [, setLocation] = useLocation();
  
  // Redirect to admin dashboard
  useEffect(() => {
    setLocation("/admin/dashboard");
  }, [setLocation]);
  
  return (
    <>
      <Helmet>
        <title>Admin | Peter's Creation Catering</title>
        <meta name="description" content="Admin panel for Peter's Creation Catering Services." />
      </Helmet>
      <div className="flex items-center justify-center h-screen">
        <p>Redirecting to admin dashboard...</p>
      </div>
    </>
  );
}
