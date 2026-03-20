import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function withAdmin<P extends object>(Component: React.ComponentType<P>) {
  return function AdminComponent(props: P) {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);

    // Get user from localStorage as fallback (for initial load)
    useEffect(() => {
      const checkAuth = () => {
        let currentUser = user;

        // If Redux user is null, try localStorage
        if (!currentUser && typeof window !== "undefined") {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            try {
              currentUser = JSON.parse(userStr);
            } catch (e) {
              console.error("Failed to parse user from localStorage:", e);
            }
          }
        }

        if (!currentUser) {
          navigate("/sign-in", { replace: true });
          setChecking(false);
          return;
        }

        const roleUpper = currentUser.role?.toUpperCase();
        const isAdmin =
          roleUpper === "ADMIN" ||
          roleUpper === "SUPERADMIN" ||
          roleUpper === "VENDOR";

        if (!isAdmin) {
          // Clear non-admin user session before redirecting
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
          }
          navigate("/", { replace: true });
          setChecking(false);
          return;
        }

        setChecking(false);
      };

      // Small delay to allow Redux to hydrate from localStorage
      const timer = setTimeout(checkAuth, 100);
      return () => clearTimeout(timer);
    }, [user, isAuthenticated, navigate]);

    // Show loading while checking
    if (checking) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      );
    }

    // Final check before rendering
    const currentUser =
      user ||
      (typeof window !== "undefined"
        ? (() => {
            try {
              const userStr = localStorage.getItem("user");
              return userStr ? JSON.parse(userStr) : null;
            } catch {
              return null;
            }
          })()
        : null);

    if (!currentUser) return null;

    const roleUpper = currentUser.role?.toUpperCase();
    const isAdmin =
      roleUpper === "ADMIN" ||
      roleUpper === "SUPERADMIN" ||
      roleUpper === "VENDOR";

    if (!isAdmin) return null;

    return <Component {...props} />;
  };
}

export default withAdmin;
