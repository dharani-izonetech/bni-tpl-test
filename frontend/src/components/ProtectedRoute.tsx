/**
 * Route guard — checks real JWT token, not a mock flag.
 * Redirects to /admin/login if unauthenticated.
 * Also listens for the bni-auth-expired event fired by apiFetch on 401.
 */
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAdminLoggedIn } from "@/lib/adminAuth";

type ProtectedRouteProps = { children: React.ReactNode };

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const [authed, setAuthed] = useState(() => isAdminLoggedIn());

  useEffect(() => {
    const check = () => setAuthed(isAdminLoggedIn());
    // Re-check when token is cleared externally (logout, expiry)
    window.addEventListener("bni-auth-expired",     check);
    window.addEventListener("bni-admin-auth-changed", check);
    window.addEventListener("storage",              check);
    return () => {
      window.removeEventListener("bni-auth-expired",     check);
      window.removeEventListener("bni-admin-auth-changed", check);
      window.removeEventListener("storage",              check);
    };
  }, []);

  if (!authed) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
