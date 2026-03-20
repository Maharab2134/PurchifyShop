import { useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Home,
  User,
  LogOut,
  ShoppingCart,
  ChevronRight,
  Group,
} from "lucide-react";
import { authApi } from "@/api/auth";
import { logout } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store/hooks";
import type { User as UserType } from "@/store/slices/authSlice";

interface UserMenuProps {
  menuOpen: boolean;
  closeMenu: () => void;
  user: UserType | null;
}

export default function UserMenu({ menuOpen, closeMenu, user }: UserMenuProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen, closeMenu]);

  const handleSignOut = async () => {
    try {
      await authApi.signOut();
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
      dispatch(logout());
      navigate("/sign-in");
    } catch {
      // ignore
    }
  };

  const isSuperAdmin = (user?.role ?? "").toUpperCase() === "SUPERADMIN";
  const menuItems = [
    {
      routes: [
        {
          href: "/",
          label: "Home",
          icon: <Home size={18} className="text-indigo-500" />,
          show: !isSuperAdmin,
        },
        {
          href: "/orders",
          label: "My Orders",
          icon: <ShoppingCart size={18} className="text-emerald-500" />,
          show: !isSuperAdmin,
        },
        {
          href: "/profile",
          label: "Profile",
          icon: <User size={18} className="text-blue-500" />,
          show: true,
        },
        {
          href: "/contact-support",
          label: "Contact Support",
          icon: <Group size={18} className="text-blue-500" />,
          show: !isSuperAdmin,
        },
      ],
    },
    {
      routes: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard size={18} className="text-purple-500" />,
          show:
            user?.role === "ADMIN" ||
            user?.role === "SUPERADMIN" ||
            user?.role === "VENDOR",
        },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 shadow-xl rounded-lg z-50 border border-gray-100 dark:border-gray-700 overflow-hidden"
          style={{
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="absolute top-[-8px] right-4 w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 border-l border-t border-gray-100 dark:border-gray-700" />
          <div className="py-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {menuItems.map((section, sectionIndex) => {
              const visibleRoutes = section.routes.filter(
                (route) => route.show,
              );
              if (visibleRoutes.length === 0) return null;
              return (
                <div key={sectionIndex} className="mb-2 last:mb-0">
                  {visibleRoutes.map((route) => (
                    <Link
                      key={route.href}
                      to={route.href}
                      className="flex items-center px-4 py-2.5 gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 text-sm transition-colors duration-150 relative group"
                      onClick={closeMenu}
                    >
                      <span className="flex-shrink-0">{route.icon}</span>
                      <span className="flex-1">{route.label}</span>
                      <ChevronRight
                        size={16}
                        className="text-gray-300 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400 transition-all duration-200" />
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="mt-1 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => {
                handleSignOut();
                closeMenu();
              }}
              className="flex items-center w-full px-4 py-3 gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors duration-150 text-sm"
            >
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
