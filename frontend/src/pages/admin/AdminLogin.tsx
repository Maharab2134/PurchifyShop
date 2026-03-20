import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, Shield } from "lucide-react";
import Input from "@/components/atoms/Input";
import PasswordInput from "@/components/atoms/PasswordInput";
import { authApi } from "@/api/auth";
import { setUser, logout } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

interface Form {
  email: string;
  password: string;
}

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if a non-admin user is already logged in
  useEffect(() => {
    const checkExistingSession = () => {
      let currentUser = user;

      // Check localStorage if Redux user is not available
      if (!currentUser && typeof window !== "undefined") {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            currentUser = JSON.parse(userStr);
          } catch (e) {
            // Invalid user data, clear it
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            return;
          }
        }
      }

      // If user exists and is not admin, clear their session
      if (currentUser) {
        const role = (currentUser.role ?? "").toUpperCase();
        if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "VENDOR") {
          // Clear non-admin user session
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
          }
          dispatch(logout());
        } else if (
          role === "ADMIN" ||
          role === "SUPERADMIN" ||
          role === "VENDOR"
        ) {
          // Admin/vendor is already logged in, redirect accordingly
          navigate(role === "VENDOR" ? "/dashboard/products" : "/dashboard", {
            replace: true,
          });
        }
      }
    };

    // Small delay to allow Redux to hydrate
    const timer = setTimeout(checkExistingSession, 100);
    return () => clearTimeout(timer);
  }, [user, dispatch, navigate]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: Form) => {
    setError(null);
    setLoading(true);
    try {
      const { data: res } = await authApi.signIn(data);
      const token = res.data.accessToken;
      const user = res.data.user;

      // Check if user is admin
      const role = (user?.role ?? "").toUpperCase();
      if (role !== "ADMIN" && role !== "SUPERADMIN" && role !== "VENDOR") {
        setError("Access denied. Admin or vendor credentials required.");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      dispatch(setUser({ user }));

      requestAnimationFrame(() => {
        navigate(role === "VENDOR" ? "/dashboard/products" : "/dashboard");
      });
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { message?: string }; status?: number };
      };
      setError(
        err.response?.data?.message ||
          (err.response?.status === 422
            ? "Email or password is incorrect."
            : "An unexpected error occurred."),
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Admin Login
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Sign in to access the admin panel
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm p-4 rounded-lg mb-6 flex items-center gap-2">
              <span className="text-red-500">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                  <Mail
                    size={20}
                    className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                  />
                </div>
                <Input<Form>
                  name="email"
                  type="email"
                  placeholder="Enter admin email"
                  control={control}
                  validation={{ required: "Email is required" }}
                  error={errors.email?.message}
                  className="pl-12 py-3 text-base"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                  <Lock
                    size={20}
                    className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                  />
                </div>
                <PasswordInput<Form>
                  name="password"
                  placeholder="Enter your password"
                  control={control}
                  validation={{
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  }}
                  error={errors.password?.message}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-base ${
                loading ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In to Admin Panel</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
