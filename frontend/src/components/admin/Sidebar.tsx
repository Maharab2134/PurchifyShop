import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Users,
  LogOut,
  PanelsRightBottom,
  Boxes,
  ChartCandlestick,
  ClipboardCheck,
  Package,
  MessageSquare,
  CreditCard,
  Ticket,
  ChevronDown,
  ChevronRight,
  Star,
  Truck,
  Store,
  FileQuestion,
  FileText,
  LayoutGrid,
  Settings,
  Link2,
  Shield,
  Sparkles,
  Mail,
  Tag,
} from "lucide-react";
import { authApi } from "@/api/auth";
import { logout } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { useAuth } from "@/hooks/useAuth";

const prependDashboard = (href: string) =>
  href.startsWith("/dashboard") ? href : `/dashboard${href}`;

interface MenuSection {
  title: string;
  icon: typeof LayoutDashboard;
  links: Array<{ name: string; href: string; icon: typeof Layers }>;
  defaultOpen?: boolean;
}

const sections: MenuSection[] = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    links: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
    defaultOpen: true,
  },
  {
    title: "Products",
    icon: Package,
    links: [
      { name: "All Products", href: "/dashboard/products", icon: Layers },
      { name: "Categories", href: "/dashboard/categories", icon: Boxes },
      { name: "Brands", href: "/dashboard/brands", icon: Tag },
      { name: "Sizes", href: "/dashboard/sizes", icon: Package },
      { name: "Attributes", href: "/dashboard/attributes", icon: Layers },
    ],
    defaultOpen: true,
  },
  {
    title: "Sales",
    icon: ShoppingCart,
    links: [
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
      {
        name: "Refunded Orders",
        href: "/dashboard/refunded-orders",
        icon: Package,
      },
      {
        name: "Transactions",
        href: "/dashboard/transactions",
        icon: CreditCard,
      },
      {
        name: "Incomplete Orders",
        href: "/dashboard/incomplete-orders",
        icon: FileQuestion,
      },
      { name: "Shipping Amount", href: "/dashboard/shipping", icon: Truck },
      {
        name: "Payment Methods",
        href: "/dashboard/payment-methods",
        icon: CreditCard,
      },
      { name: "Coupons", href: "/dashboard/coupons", icon: Ticket },
    ],
    defaultOpen: false,
  },
  {
    title: "Courier",
    icon: Truck,
    links: [
      {
        name: "Steadfast Courier",
        href: "/dashboard/courier/steadfast-management",
        icon: Package,
      },
      {
        name: "Pathao Courier",
        href: "/dashboard/courier/pathao-management",
        icon: Package,
      },
      { name: "Settings", href: "/dashboard/courier/settings", icon: Shield },
    ],
    defaultOpen: true,
  },
  {
    title: "Users & Support",
    icon: Users,
    links: [
      { name: "Users", href: "/dashboard/users", icon: Users },
      { name: "Roles", href: "/dashboard/roles", icon: Shield },
      { name: "Vendors", href: "/dashboard/vendors", icon: Store },
      { name: "Reviews", href: "/dashboard/reviews", icon: Star },
      { name: "Chats", href: "/dashboard/chats", icon: MessageSquare },
    ],
    defaultOpen: false,
  },
  {
    title: "Analytics",
    icon: ChartCandlestick,
    links: [
      {
        name: "Analytics",
        href: "/dashboard/analytics",
        icon: ChartCandlestick,
      },
      { name: "Reports", href: "/dashboard/reports", icon: FileText },
      { name: "Logs", href: "/dashboard/logs", icon: ClipboardCheck },
    ],
    defaultOpen: false,
  },
  {
    title: "Content",
    icon: FileText,
    links: [
      { name: "Notices", href: "/dashboard/notices", icon: MessageSquare },
      {
        name: "Home Sections",
        href: "/dashboard/home-sections",
        icon: LayoutGrid,
      },
      { name: "Pages", href: "/dashboard/pages", icon: FileText },
      { name: "Footer", href: "/dashboard/footer", icon: Link2 },
    ],
    defaultOpen: false,
  },
  {
    title: "Settings",
    icon: Settings,
    links: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Email Settings", href: "/dashboard/email-settings", icon: Mail },
      {
        name: "Email Templates",
        href: "/dashboard/email-templates",
        icon: Sparkles,
      },
      {
        name: "Email Logs",
        href: "/dashboard/email-logs",
        icon: ClipboardCheck,
      },
    ],
    defaultOpen: false,
  },
];

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // Get user permissions from role
  const getUserPermissions = (): string[] => {
    if (!user) return [];
    // SUPERADMIN has access to everything
    if (user.role === "SUPERADMIN") {
      return sections.map((s) => s.title);
    }
    // Check if user has a role with permissions
    if (
      user.roleModel?.permissions &&
      Array.isArray(user.roleModel.permissions)
    ) {
      return user.roleModel.permissions;
    }
    // Default ADMIN has all access (backward compatibility)
    if (user.role === "ADMIN") {
      return sections.map((s) => s.title);
    }
    return [];
  };

  const userPermissions = getUserPermissions();

  // Filter sections based on permissions
  const filteredSections = sections.filter((section) => {
    return userPermissions.includes(section.title);
  });

  // Persist sidebar open state
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin-sidebar-open");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Persist section open states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("admin-sidebar-sections");
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch {
            // fallback to defaults
          }
        }
      }
      const initial: Record<string, boolean> = {};
      sections.forEach((s) => {
        initial[s.title] = s.defaultOpen ?? false;
      });
      return initial;
    },
  );

  // Save sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin-sidebar-open", JSON.stringify(isOpen));
    }
  }, [isOpen]);

  // Save section states to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "admin-sidebar-sections",
        JSON.stringify(openSections),
      );
    }
  }, [openSections]);

  const toggleSection = useCallback((title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev: boolean) => !prev);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await authApi.signOut();
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("admin-sidebar-open");
      localStorage.removeItem("admin-sidebar-sections");
    }
    dispatch(logout());
    navigate("/sign-in");
  }, [dispatch, navigate]);

  // Memoize active path check
  const activePath = useMemo(() => location.pathname, [location.pathname]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg h-screen flex flex-col p-2 sm:p-3 justify-between md:w-auto w-20 md:static fixed top-0 left-0 z-40 overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden h-full">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2">
          {isOpen && (
            <Link
              to="/dashboard"
              className="text-lg font-bold text-indigo-600 dark:text-indigo-400 px-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Admin Panel
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle sidebar"
          >
            <PanelsRightBottom
              size={20}
              className="text-gray-600 dark:text-gray-400"
            />
          </button>
        </div>

        <nav className="flex flex-col space-y-1 pb-4">
          {filteredSections.map((section) => {
            const SectionIcon = section.icon;
            const isSectionOpen = openSections[section.title];
            const hasMultipleLinks = section.links.length > 1;

            // If only one link, render it directly without collapsible
            if (!hasMultipleLinks) {
              const link = section.links[0];
              const fullHref = prependDashboard(link.href);
              const isActive = location.pathname === fullHref;
              const LinkIcon = link.icon;

              return (
                <Link
                  key={section.title}
                  to={fullHref}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-indigo-100 text-indigo-600 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <LinkIcon className="h-5 w-5 shrink-0" />
                  {isOpen && <span className="text-sm">{link.name}</span>}
                </Link>
              );
            }

            // Multiple links - collapsible section
            return (
              <div key={section.title} className="mb-1">
                {isOpen ? (
                  <>
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center gap-3">
                        <SectionIcon className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium">
                          {section.title}
                        </span>
                      </div>
                      {isSectionOpen ? (
                        <ChevronDown className="h-5 w-5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isSectionOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-8 mt-1 space-y-0.5">
                            {section.links.map((link) => {
                              const fullHref = prependDashboard(link.href);
                              const isActive = activePath === fullHref;
                              const LinkIcon = link.icon;
                              return (
                                <Link
                                  key={link.name}
                                  to={fullHref}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                                    isActive
                                      ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-medium"
                                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  }`}
                                >
                                  <LinkIcon className="h-5 w-5 shrink-0" />
                                  <span>{link.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="relative group">
                    <div className="flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                      <SectionIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="absolute left-full ml-2 top-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                        {section.title}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center ${isOpen ? "justify-start gap-3" : "justify-center"} px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition text-red-600 dark:text-red-400`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </motion.aside>
  );
}

export default memo(AdminSidebar);
