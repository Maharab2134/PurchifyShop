import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Menu, X, Search, LogOut } from "lucide-react";
import UserMenu from "@/components/molecules/UserMenu";
import SearchBar from "@/components/molecules/SearchBar";
import ThemeToggle from "@/components/atoms/ThemeToggle";
import useClickOutside from "@/hooks/useClickOutside";
import useEventListener from "@/hooks/useEventListener";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { authApi } from "@/api/auth";
import { cartApi } from "@/api/cart";
import { wishlistApi } from "@/api/wishlist";
import { storeInfoApi, type StoreInfo } from "@/api/storeInfo";
import { generateUserAvatar } from "@/utils/placeholderImage";
import { toImageUrl } from "@/utils/imageUrl";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEventListener("scroll", () => {
    setScrolled(typeof window !== "undefined" ? window.scrollY > 20 : false);
  });

  useClickOutside(menuRef, () => setMenuOpen(false));
  useClickOutside(mobileMenuRef, () => setMobileMenuOpen(false));

  // Fetch cart count on mount and when visiting cart/checkout pages
  // Use event listener for real-time updates
  useEffect(() => {
    let controller: AbortController | null = null;

    const fetchCartCount = () => {
      if (controller) controller.abort();
      controller = new AbortController();

      cartApi
        .get()
        .then((res) => {
          if (!controller?.signal.aborted) {
            const d = res.data?.data;
            setCartCount(d?.itemCount ?? d?.items?.length ?? 0);
          }
        })
        .catch(() => {
          if (!controller?.signal.aborted) {
            setCartCount(0);
          }
        });
    };

    // Fetch on initial load
    fetchCartCount();

    // Listen for cart updates via events
    const onCartUpdate = () => {
      fetchCartCount();
    };
    window.addEventListener("cart:updated", onCartUpdate);

    return () => {
      if (controller) controller.abort();
      window.removeEventListener("cart:updated", onCartUpdate);
    };
  }, []);

  // Also fetch when visiting cart/checkout pages
  useEffect(() => {
    if (location.pathname === "/cart" || location.pathname === "/checkout") {
      cartApi
        .get()
        .then((res) => {
          const d = res.data?.data;
          setCartCount(d?.itemCount ?? d?.items?.length ?? 0);
        })
        .catch(() => setCartCount(0));
    }
  }, [location.pathname]);

  const refreshWishlist = useCallback(() => {
    if (!isAuthenticated) {
      setWishlistCount(0);
      return;
    }
    wishlistApi
      .get()
      .then((res) => {
        const ids = res.data?.data?.productIds ?? [];
        setWishlistCount(ids.length);
      })
      .catch(() => setWishlistCount(0));
  }, [isAuthenticated]);

  // Only refresh wishlist when auth state changes, not on every route
  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated, refreshWishlist]);

  useEffect(() => {
    window.addEventListener("wishlist:updated", refreshWishlist);
    return () =>
      window.removeEventListener("wishlist:updated", refreshWishlist);
  }, [refreshWishlist]);

  // Fetch store info only once on mount - use ref to ensure it only runs once
  const storeInfoFetchedRef = useRef(false);
  useEffect(() => {
    if (!storeInfoFetchedRef.current) {
      storeInfoFetchedRef.current = true;

      // Try to load from localStorage first for instant display
      if (typeof window !== "undefined") {
        try {
          const cachedStoreInfo = localStorage.getItem("storeInfo");
          if (cachedStoreInfo) {
            const parsed = JSON.parse(cachedStoreInfo);
            // Check if cache is not too old (e.g., less than 1 hour)
            const cacheTime = localStorage.getItem("storeInfoTime");
            if (cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
              setStoreInfo(parsed);
            }
          }
        } catch (e) {
          // Ignore cache errors
        }
      }

      // Fetch fresh data from API
      storeInfoApi
        .get()
        .then((data) => {
          setStoreInfo(data);
          // Cache the store info
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("storeInfo", JSON.stringify(data));
              localStorage.setItem("storeInfoTime", Date.now().toString());
            } catch (e) {
              // Ignore cache errors
            }
          }
        })
        .catch(() => {
          // Keep previous storeInfo if fetch fails, or set to null
          setStoreInfo((prev) => prev);
        });
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await authApi.signOut();
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
    dispatch(logout());
    navigate("/sign-in");
  };

  const pathname = location.pathname;
  const hideSignIn = pathname === "/sign-up" || pathname === "/sign-in";
  const isSuperAdmin = (user?.role ?? "").toUpperCase() === "SUPERADMIN";

  return (
    <header
      className={`sticky top-0 w-full z-50 transition-all duration-300 safe-area-inset-top py-2 sm:py-3 md:py-4 ${
        scrolled ? "shadow-md dark:shadow-gray-800/50" : "md:backdrop-blur-sm"
      }`}
      style={{
        background: scrolled
          ? "var(--app-surface-elevated)"
          : "var(--app-surface-overlay)",
      }}
    >
      <nav className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center h-12 sm:h-14 lg:h-16 gap-2 sm:gap-3 lg:gap-4 min-h-[var(--app-touch-min)]">
          {/* Left: Logo */}
          <div className="flex items-center shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/logo-display"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 sm:gap-3 group"
                title="View store logo"
              >
                {storeInfo?.logo && storeInfo.logo.trim() !== "" ? (
                  <div className="relative flex items-center">
                    <img
                      src={toImageUrl(storeInfo.logo)}
                      alt={storeInfo.storeName || "Store Logo"}
                      className="h-8 sm:h-10 lg:h-12 w-auto object-contain max-w-20 sm:max-w-25 lg:max-w-30 transition-all duration-300 group-hover:scale-105"
                      loading="eager"
                      decoding="async"
                      style={
                        {
                          imageRendering: "auto",
                          objectFit: "contain",
                          maxHeight: "48px",
                          filter: "none",
                          transform: "translateZ(0)",
                          backfaceVisibility: "hidden",
                          willChange: "auto",
                          fontSmoothing: "antialiased",
                          // Use lowercase for style properties
                        } as React.CSSProperties
                      }
                      onError={(e) => {
                        // Hide image on error - show placeholder instead
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (
                          parent &&
                          !parent.querySelector(".logo-placeholder")
                        ) {
                          const placeholder = document.createElement("div");
                          placeholder.className =
                            "logo-placeholder h-8 sm:h-10 lg:h-12 w-8 sm:w-10 lg:w-12 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-lg shadow-xl";
                          placeholder.innerHTML = `<span class="text-white font-bold text-lg sm:text-xl lg:text-2xl">${storeInfo?.storeName?.charAt(0).toUpperCase() || "S"}</span>`;
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
                  </div>
                ) : storeInfo?.storeName ? (
                  <div className="h-9 sm:h-16 lg:h-20 w-9 sm:w-16 lg:w-20 flex items-center justify-center bg-linear-to-br from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-lg shadow-xl">
                    <span className="text-white font-bold text-lg sm:text-2xl lg:text-3xl">
                      {storeInfo.storeName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="h-9 sm:h-16 lg:h-20 w-30 sm:w-45 lg:w-55" />
                )}
              </a>

              {/* Stylish Company Name with RGB Gradient */}
              {storeInfo?.storeName && storeInfo.storeName.trim() !== "" && (
                <Link
                  to="/"
                  className="flex flex-col justify-center max-w-35 sm:max-w-none"
                >
                  <h1 className="company-name-gradient font-bold text-sm sm:text-xl lg:text-2xl xl:text-3xl leading-tight tracking-tight truncate sm:truncate-none">
                    {storeInfo.storeName}
                  </h1>
                </Link>
              )}
            </div>
          </div>

          {/* Center: Desktop Search Bar — hidden for SUPERADMIN */}
          {!isSuperAdmin && (
            <div className="hidden md:flex flex-1 justify-center items-center">
              <div className="w-full max-w-2xl">
                <SearchBar />
              </div>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center justify-end space-x-2 sm:space-x-3 lg:space-x-4 shrink-0 ml-auto">
            <ThemeToggle />
            {/* Mobile Search Button — hidden for SUPERADMIN */}
            {!isSuperAdmin && (
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label={t("nav.search", "Search")}
              >
                <Search size={20} />
              </button>
            )}

            {/* Wishlist — hidden for SUPERADMIN */}
            {!isSuperAdmin && (
              <Link
                to="/wishlist"
                className="hidden md:inline-flex relative p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="text-[20px] sm:text-[22px]" />
                {isAuthenticated && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-medium rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart — hidden for SUPERADMIN */}
            {!isSuperAdmin && (
              <Link
                to="/cart"
                className="hidden md:inline-flex relative p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="text-[20px] sm:text-[22px]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-medium rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="User menu"
                >
                  {user.avatar ? (
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0">
                      <img
                        src={user.avatar}
                        alt="User Profile"
                        width={80}
                        height={80}
                        className="rounded-full object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = generateUserAvatar(
                            user.name ?? "User",
                            80,
                          );
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0">
                      <img
                        src={generateUserAvatar(user?.name ?? "User", 80)}
                        alt="User Profile"
                        width={80}
                        height={80}
                        className="rounded-full object-cover w-full h-full"
                      />
                    </div>
                  )}
                </button>

                {menuOpen && (
                  <UserMenu
                    user={user}
                    menuOpen={menuOpen}
                    closeMenu={() => setMenuOpen(false)}
                  />
                )}
              </div>
            ) : (
              !hideSignIn && (
                <Link
                  to="/sign-in"
                  className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t("auth.signIn", "Sign in")}
                </Link>
              )
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar — hidden for SUPERADMIN */}
        {!isSuperAdmin && mobileSearchOpen && (
          <div className="md:hidden py-3 border-t border-gray-200 dark:border-gray-700">
            <SearchBar />
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-2 space-y-2 max-h-[70vh] overflow-y-auto">
              {!isAuthenticated && (
                <>
                  <Link
                    to="/sign-in"
                    className="block px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("auth.signIn", "Sign in")}
                  </Link>
                  <Link
                    to="/sign-up"
                    className="block px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("auth.signUp", "Sign up")}
                  </Link>
                </>
              )}
              {!isSuperAdmin && (
                <>
                  <Link
                    to="/"
                    className="block px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav.home", "Home")}
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav.orders", "Orders")}
                  </Link>
                  <Link
                    to="/shop"
                    className="block px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav.shop", "Shop")}
                  </Link>
                  <Link
                    to="/wishlist"
                    className="block px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("nav.wishlist", "Wishlist")}
                  </Link>
                </>
              )}
              {(user?.role === "ADMIN" ||
                user?.role === "SUPERADMIN" ||
                user?.role === "VENDOR") && (
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-sm"
                >
                  <LogOut size={18} />
                  <span>{t("auth.signOut", "Sign out")}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
