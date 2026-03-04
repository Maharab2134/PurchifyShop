import {
  type ReactNode,
  memo,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { User, Bell, MessageSquare } from "lucide-react";
import AdminSidebar from "@/components/admin/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { generateUserAvatar } from "@/utils/placeholderImage";
import withAdmin from "@/components/HOC/WithAdmin";
import { adminApi } from "@/api/admin";

const UserAvatar = memo(() => {
  const { user } = useAuth();
  const avatarSrc = useMemo(() => user?.avatar || null, [user?.avatar]);
  const userName = useMemo(() => user?.name || "User", [user?.name]);
  const avatarUrl = useMemo(() => generateUserAvatar(userName, 80), [userName]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={userName}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = avatarUrl;
            }}
          />
        ) : (
          <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </div>
      {user?.name && (
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 hidden sm:inline">
          {user.name}
        </span>
      )}
    </div>
  );
});
UserAvatar.displayName = "UserAvatar";

function DashboardLayoutInner({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderNotificationCount, setOrderNotificationCount] = useState(0);
  const [chatNotificationCount, setChatNotificationCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prevOrderCountRef = useRef(0);
  const prevChatCountRef = useRef(0);
  /** Count "seen" when user viewed orders/chats page; we only show (current - lastViewed) */
  const lastViewedOrderCountRef = useRef(0);
  const lastViewedChatCountRef = useRef(0);

  const loadNotifications = async () => {
    try {
      const orderRes = await adminApi.orders.notifications();
      const orderCount = orderRes.data.data?.count ?? 0;

      const chatRes = await adminApi.chats.list({ status: "OPEN" });
      const openChats = chatRes.data.data ?? [];
      const chatCount = openChats.reduce(
        (sum, chat) => sum + (chat.unreadCount ?? 0),
        0,
      );

      const onOrdersPage = location.pathname === "/dashboard/orders";
      const onChatsPage = location.pathname === "/dashboard/chats";

      if (onOrdersPage) {
        // Mark as read when on orders page
        adminApi.orders.markNotificationsAsRead().catch(() => {
          // Silent fail
        });
        lastViewedOrderCountRef.current = orderCount;
        setOrderNotificationCount(0);
      } else {
        const prevOrder = prevOrderCountRef.current;
        prevOrderCountRef.current = orderCount;
        const newOrderCount = Math.max(
          0,
          orderCount - lastViewedOrderCountRef.current,
        );
        setOrderNotificationCount(newOrderCount);
        if (orderCount > prevOrder && orderCount > 0) {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 3000);
        }
      }

      if (onChatsPage) {
        lastViewedChatCountRef.current = chatCount;
        setChatNotificationCount(0);
      } else {
        const prevChat = prevChatCountRef.current;
        prevChatCountRef.current = chatCount;
        const newChatCount = Math.max(
          0,
          chatCount - lastViewedChatCountRef.current,
        );
        setChatNotificationCount(newChatCount);
        if (chatCount > prevChat && chatCount > 0) {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 3000);
        }
      }
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 10000);
    pollIntervalRef.current = t;
    return () => {
      clearInterval(t);
      pollIntervalRef.current = null;
    };
  }, [location.pathname]);

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col md:ml-0 ml-[80px] md:ml-0 h-full overflow-hidden">
        <header className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3 sm:gap-0 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {/* Chat Notification Icon - Always visible */}
            <button
              onClick={() => navigate("/dashboard/chats")}
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label={
                chatNotificationCount > 0
                  ? `${chatNotificationCount} new message${chatNotificationCount !== 1 ? "s" : ""}`
                  : "Chats"
              }
              title={
                chatNotificationCount > 0
                  ? `${chatNotificationCount} new message${chatNotificationCount !== 1 ? "s" : ""}`
                  : "Chats"
              }
            >
              <MessageSquare
                size={20}
                className={`transition-all ${isBlinking && chatNotificationCount > 0 ? "notification-blink text-indigo-600 dark:text-indigo-400" : ""}`}
              />
              {chatNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
                  {chatNotificationCount > 99 ? "99+" : chatNotificationCount}
                </span>
              )}
            </button>
            {/* Order Notification Icon */}
            <button
              onClick={async () => {
                if (orderNotificationCount > 0) {
                  try {
                    await adminApi.orders.markNotificationsAsRead();
                  } catch {
                    // Silent fail
                  }
                }
                navigate("/dashboard/orders");
              }}
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="New Orders"
            >
              <Bell
                size={20}
                className={`transition-all ${isBlinking && orderNotificationCount > prevOrderCountRef.current ? "notification-blink text-indigo-600 dark:text-indigo-400" : ""}`}
              />
              {orderNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-bounce">
                  {orderNotificationCount > 99 ? "99+" : orderNotificationCount}
                </span>
              )}
            </button>
            <UserAvatar />
            <Link
              to="/"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              View Store
            </Link>
          </div>
        </header>

        {/* Page scroll container - scroll works inside page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

const MemoizedLayout = memo(DashboardLayoutInner);
MemoizedLayout.displayName = "DashboardLayoutInner";
const DashboardLayout = withAdmin(MemoizedLayout);
export default DashboardLayout;
