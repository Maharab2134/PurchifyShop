import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { Package, Filter } from "lucide-react";
import MainLayout from "@/components/templates/MainLayout";
import ProductCard from "@/components/product/ProductCard";
import ProductFilters from "@/components/shop/ProductFilters";
import { productsApi, type Product } from "@/api/products";
import { categoriesApi, type Category } from "@/api/categories";
import { subcategoriesApi, type Subcategory } from "@/api/subcategories";
import { buildCategoryHeadings } from "@/utils/seo";

export interface FilterValues {
  search: string;
  categoryId?: string;
  subcategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export default function Shop() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialFilters = useMemo<FilterValues>(
    () => ({
      search: searchParams.get("search") || "",
      minPrice: searchParams.get("minPrice")
        ? parseFloat(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseFloat(searchParams.get("maxPrice")!)
        : undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      subcategoryId: searchParams.get("subcategoryId") || undefined,
      minRating: searchParams.get("minRating")
        ? parseFloat(searchParams.get("minRating")!)
        : undefined,
    }),
    [searchParams],
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const handleMobileSheetDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const draggedDownEnough = info.offset.y > 120;
    const flungDownFast = info.velocity.y > 700;
    if (draggedDownEnough || flungDownFast) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    Promise.all([
      categoriesApi
        .getAll()
        .then(({ data }) => data.data || [])
        .catch(() => []),
      subcategoriesApi
        .getAll()
        .then(({ data }) => data.data?.subcategories || [])
        .catch(() => []),
    ]).then(([cats, subcats]) => {
      setCategories(cats);
      setSubcategories(subcats);
    });
  }, []);

  // Scroll to top when navigating to shop page or when route/search params change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.search]);

  useEffect(() => {
    setFilters(initialFilters);
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [initialFilters]);

  useEffect(() => {
    setLoading(true);
    const params: any = { limit: 12, page };
    if (filters.search) params.search = filters.search;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.subcategoryId) params.subcategoryId = filters.subcategoryId;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.minRating != null && filters.minRating > 0)
      params.minRating = filters.minRating;

    productsApi
      .getAll(params)
      .then(({ data }) => {
        const newProducts = data.data?.products || [];
        if (page === 1) {
          setProducts(newProducts);
        } else {
          setProducts((prev) => [...prev, ...newProducts]);
        }
        setHasMore(data.data?.currentPage < data.data?.totalPages);
      })
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
  }, [filters, page]);

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== "" && value !== false,
  ).length;

  const updateFilters = (newFilters: FilterValues) => {
    const query = new URLSearchParams();
    if (newFilters.search) query.set("search", newFilters.search);
    if (newFilters.minPrice)
      query.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice)
      query.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.categoryId) query.set("categoryId", newFilters.categoryId);
    if (newFilters.subcategoryId)
      query.set("subcategoryId", newFilters.subcategoryId);
    if (newFilters.minRating != null && newFilters.minRating > 0)
      query.set("minRating", newFilters.minRating.toString());

    navigate(`/shop?${query.toString()}`);
  };

  const handleReset = () => {
    navigate("/shop");
  };

  const handleShowMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const noProductsFound = products.length === 0 && !loading && !error;
  const activeCategory = categories.find((c) => c.id === filters.categoryId);
  const activeSubcategory = subcategories.find(
    (sc) => sc.id === filters.subcategoryId,
  );
  const headings = buildCategoryHeadings(
    activeCategory?.name,
    activeSubcategory?.name,
  );

  return (
    <MainLayout>
      <div className="sr-only">
        <h1>{headings.h1}</h1>
        <h2>{headings.h2}</h2>
        <h3>{headings.h3}</h3>
      </div>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Content area with max-width like home */}
        <div className="w-full py-3 sm:py-4 lg:py-6 xl:py-8 px-2.5 sm:px-3 lg:px-6 xl:px-8 pb-24 sm:pb-28">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
              {/* Filter toggle button - above bottom nav (safe area) */}
              <div
                className="lg:hidden fixed right-2.5 sm:right-4 z-40"
                style={{
                  bottom:
                    "max(6.5rem, calc(4.5rem + env(safe-area-inset-bottom, 0px) + 1.5rem))",
                }}
              >
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg sm:rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 shadow-lg shadow-indigo-500/50"
                >
                  <Filter size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="font-semibold text-xs sm:text-sm">
                    Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="bg-white text-indigo-600 text-[10px] sm:text-xs font-bold rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 min-w-[18px] sm:min-w-[24px] text-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
              <AnimatePresence>
                {filtersVisible && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      damping: 25,
                      stiffness: 300,
                      duration: 0.3,
                    }}
                    className="hidden lg:block"
                  >
                    <div className="w-[280px] xl:w-[320px] flex-shrink-0">
                      <ProductFilters
                        initialFilters={initialFilters}
                        onFilterChange={updateFilters}
                        categories={categories}
                        subcategories={subcategories}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filter toggle for desktop - show when filters are hidden */}
              {!filtersVisible && (
                <div className="hidden lg:block flex-shrink-0">
                  <button
                    onClick={() => setFiltersVisible(true)}
                    className="sticky top-24 flex items-center gap-2 px-5 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 shadow-lg h-fit whitespace-nowrap"
                  >
                    <Filter size={18} />
                    <span className="font-semibold">Show Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="bg-white text-indigo-600 text-xs font-bold rounded-full px-2.5 py-1 min-w-[24px] text-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              )}

              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/50"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{
                        type: "spring",
                        damping: 28,
                        stiffness: 320,
                      }}
                      drag="y"
                      dragDirectionLock
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={{ top: 0, bottom: 0.22 }}
                      onDragEnd={handleMobileSheetDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full"
                    >
                      <ProductFilters
                        initialFilters={initialFilters}
                        onFilterChange={updateFilters}
                        categories={categories}
                        subcategories={subcategories}
                        isMobile={true}
                        onCloseMobile={() => setSidebarOpen(false)}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="flex-1 min-w-0 w-full"
                layout
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 300,
                  duration: 0.3,
                }}
              >
                {loading && !products.length && (
                  <div
                    className={`grid gap-2.5 sm:gap-3 lg:gap-4 xl:gap-6 ${
                      filtersVisible
                        ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                        : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    }`}
                  >
                    {[...Array(8)].map((_, index) => (
                      <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse"
                      >
                        <div className="h-40 sm:h-48 lg:h-56 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="p-3 sm:p-4 lg:p-5 space-y-2 sm:space-y-3">
                          <div className="h-3 sm:h-4 lg:h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-3 sm:h-4 lg:h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                          <div className="h-5 sm:h-6 lg:h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="text-center py-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-red-200 dark:border-red-800 shadow-xl">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package
                        size={40}
                        className="text-red-500 dark:text-red-400"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      Error loading products
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      Please try again or adjust your filters.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3.5 rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {noProductsFound && (
                  <div className="text-center py-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package
                        size={40}
                        className="text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      No products found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      We couldn't find any products matching your criteria. Try
                      adjusting your filters or search terms.
                    </p>
                    <button
                      onClick={handleReset}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                {!noProductsFound && !loading && (
                  <>
                    <div
                      className={`grid gap-2.5 sm:gap-3 lg:gap-4 xl:gap-6 ${
                        filtersVisible
                          ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                          : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                      }`}
                    >
                      {products.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      ))}
                    </div>

                    {hasMore && (
                      <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
                        {loading ? (
                          <div className="flex items-center justify-center gap-2 sm:gap-3">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                              Loading more...
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={handleShowMore}
                            disabled={loading}
                            className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Load More Products
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
