import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";

const DashboardLayout = lazy(
  () => import("@/components/admin/DashboardLayout"),
);
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ThemeProvider } from "@/context/ThemeContext";
import { setUser, logout } from "@/store/slices/authSlice";
// Lazy-load pages for faster initial load and navigation (code splitting)
const SignIn = lazy(() => import("@/pages/SignIn"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const Home = lazy(() => import("@/pages/Home"));
const Shop = lazy(() => import("@/pages/Shop"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Categories = lazy(() => import("@/pages/Categories"));
const Brands = lazy(() => import("@/pages/Brands"));
const Cart = lazy(() => import("@/pages/Cart"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Wishlist = lazy(() => import("@/pages/Wishlist"));
const ContactSupport = lazy(() => import("@/pages/ContactSupport"));
const Coupons = lazy(() => import("@/pages/Coupons"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetail = lazy(() => import("@/pages/OrderDetail"));
const Invoice = lazy(() => import("@/pages/Invoice"));
const InvoiceVerify = lazy(() => import("@/pages/InvoiceVerify"));
const Profile = lazy(() => import("@/pages/Profile"));
const PasswordReset = lazy(() => import("@/pages/PasswordReset"));
const PasswordResetToken = lazy(() => import("@/pages/PasswordResetToken"));
const Section = lazy(() => import("@/pages/Section"));
const TrackOrder = lazy(() => import("@/pages/TrackOrder"));
const ApplyVendor = lazy(() => import("@/pages/ApplyVendor"));
const Page = lazy(() => import("@/pages/Page"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const LogoDisplay = lazy(() => import("@/pages/LogoDisplay"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const AdminCategories = lazy(() => import("@/pages/admin/Categories"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminAttributes = lazy(() => import("@/pages/admin/Attributes"));
const AdminOrders = lazy(() => import("@/pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("@/pages/admin/OrderDetail"));
const AdminRefundedOrders = lazy(() => import("@/pages/admin/RefundedOrders"));
const AdminTransactions = lazy(() => import("@/pages/admin/Transactions"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminLogs = lazy(() => import("@/pages/admin/Logs"));
const AdminChats = lazy(() => import("@/pages/admin/Chats"));
const AdminReports = lazy(() => import("@/pages/admin/Reports"));
const AdminPaymentMethods = lazy(() => import("@/pages/admin/PaymentMethods"));
const PaymentMethodForm = lazy(() => import("@/pages/admin/PaymentMethodForm"));
const AdminCoupons = lazy(() => import("@/pages/admin/Coupons"));
const AdminReviews = lazy(() => import("@/pages/admin/Reviews"));
const AdminShipping = lazy(() => import("@/pages/admin/Shipping"));
const AdminSteadfastCourier = lazy(
  () => import("@/pages/admin/SteadfastCourier"),
);
const AdminPathaoCourier = lazy(() => import("@/pages/admin/PathaoCourier"));
const AdminCourierSettings = lazy(
  () => import("@/pages/admin/CourierSettings"),
);
const AdminVendors = lazy(() => import("@/pages/admin/Vendors"));
const AdminBrands = lazy(() => import("@/pages/admin/Brands"));
const AdminRoles = lazy(() => import("@/pages/admin/Roles"));
const AdminIncompleteOrders = lazy(
  () => import("@/pages/admin/IncompleteOrders"),
);
const AdminPages = lazy(() => import("@/pages/admin/Pages"));
const AdminHomeSections = lazy(() => import("@/pages/admin/HomeSections"));
const AdminHomeSectionForm = lazy(
  () => import("@/pages/admin/HomeSectionForm"),
);
const AdminProductForm = lazy(() => import("@/pages/admin/ProductForm"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminFooter = lazy(() => import("@/pages/admin/Footer"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminSizes = lazy(() => import("@/pages/admin/Sizes"));
const AdminEmailSettings = lazy(() => import("@/pages/admin/EmailSettings"));
const AdminEmailTemplates = lazy(() => import("@/pages/admin/EmailTemplates"));
const AdminEmailLogs = lazy(() => import("@/pages/admin/EmailLogs"));
const AdminNotices = lazy(() => import("@/pages/admin/Notices"));
const AdminMediaManager = lazy(() => import("@/pages/admin/MediaManager"));
import PageViewTracker from "@/components/PageViewTracker";
import PixelManager from "@/components/analytics/PixelManager";
import SeoMeta from "@/components/seo/SeoMeta";
import AnimationManager from "@/components/animations/AnimationManager";
import { ToastProvider } from "@/context/ToastContext";
import { configApi } from "@/api/config";
import {
  initI18n,
  resolveInitialLanguage,
  type LanguageSettings as I18nLanguageSettings,
  type TranslationsBundle,
} from "@/i18n/i18n";
import { getStoredLanguage } from "@/i18n/LanguageProvider";

function AppRoutes() {
  const userJson =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    if (!userJson || !token) return;
    try {
      const user = JSON.parse(userJson);
      store.dispatch(setUser({ user }));
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      store.dispatch(logout());
    }
  }, []);

  useEffect(() => {
    const onLogout = () => store.dispatch(logout());
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  return (
    <>
      <ScrollToTop />
      <SeoMeta />
      <PageViewTracker />
      <PixelManager />
      <AnimationManager />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div
              className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/logo-display" element={<LogoDisplay />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/section/:slug" element={<Section />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/contact-support" element={<ContactSupport />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/page/:slug" element={<Page />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/apply-vendor" element={<ApplyVendor />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/orders/:orderId/invoice" element={<Invoice />} />
          <Route
            path="/invoice-verify/:trackingNumber"
            element={<InvoiceVerify />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route
            path="/password-reset/:token"
            element={<PasswordResetToken />}
          />
          <Route path="/purchify/login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/add" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="sizes" element={<AdminSizes />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="attributes" element={<AdminAttributes />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="refunded-orders" element={<AdminRefundedOrders />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route
              path="courier/steadfast-management"
              element={<AdminSteadfastCourier />}
            />
            <Route
              path="courier/pathao-management"
              element={<AdminPathaoCourier />}
            />
            <Route path="courier/settings" element={<AdminCourierSettings />} />
            <Route
              path="courier/steadfast-settings"
              element={<Navigate to="/dashboard/courier/settings" replace />}
            />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route
              path="incomplete-orders"
              element={<AdminIncompleteOrders />}
            />
            <Route path="pages" element={<AdminPages />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="media-manager" element={<AdminMediaManager />} />
            <Route path="home-sections" element={<AdminHomeSections />} />
            <Route
              path="home-sections/add"
              element={<AdminHomeSectionForm />}
            />
            <Route
              path="home-sections/:id/edit"
              element={<AdminHomeSectionForm />}
            />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="footer" element={<AdminFooter />} />
            <Route path="email-settings" element={<AdminEmailSettings />} />
            <Route path="email-templates" element={<AdminEmailTemplates />} />
            <Route path="email-logs" element={<AdminEmailLogs />} />
            <Route path="payment-methods" element={<AdminPaymentMethods />} />
            <Route path="payment-methods/new" element={<PaymentMethodForm />} />
            <Route
              path="payment-methods/:id/edit"
              element={<PaymentMethodForm />}
            />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="chats" element={<AdminChats />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="roles" element={<AdminRoles />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  useEffect(() => {
    configApi
      .getConfig()
      .then(({ languageSettings: ls, translations }) => {
        const settings = (ls || {
          isActive: true,
          defaultLang: "en",
          enabled: { en: true, bn: true },
        }) as I18nLanguageSettings;
        const stored = getStoredLanguage();
        const initialLang = resolveInitialLanguage(settings, stored);
        return initI18n({
          languageSettings: settings,
          translations: translations as unknown as TranslationsBundle,
          initialLang,
        });
      })
      .catch(() => {
        // Even if config fails, app should still work with defaults
      });
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}
