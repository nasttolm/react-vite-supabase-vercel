import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import supabase from "../utils/supabase";
import toast from "react-hot-toast";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setUser(data.session.user);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  if (!user) {
    // Show toast notification before redirecting
    toast.error("You must be logged in to access this page");
    
    // Redirect to the sign-in page
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  return children;
}