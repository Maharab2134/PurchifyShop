import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import { categoriesApi, type Category } from "@/api/categories";
import { subcategoriesApi, type Subcategory } from "@/api/subcategories";
import { configApi } from "@/api/config";

export default function TopCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<
    Record<string, Subcategory[]>
  >({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [headerColor, setHeaderColor] = useState("#16a34a"); // Default green-600
  const containerRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);
  const [subcategoryPosition, setSubcategoryPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Load settings for header color
    configApi
      .getTopbar()
      .then((topbar) => {
        if (topbar.linkColor) {
          setHeaderColor(topbar.linkColor);
        }
      })
      .catch(() => {
        // Keep default color
      });

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
      // Group subcategories by categoryId
      const grouped: Record<string, Subcategory[]> = {};
      subcats.forEach((sc) => {
        if (!grouped[sc.categoryId]) {
          grouped[sc.categoryId] = [];
        }
        grouped[sc.categoryId].push(sc);
      });
      setSubcategoriesByCategory(grouped);
      setLoading(false);
    });
  }, []);

  // Responsive: switch behavior on mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)"); // tailwind sm breakpoint
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleCategoryClick = (
    categoryId: string,
    e: React.MouseEvent,
    categoryElement: HTMLElement,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
      setSubcategoryPosition(null);
    } else {
      setExpandedCategory(categoryId);
      // On desktop: calculate position for subcategories dropdown (outside the layout)
      // On mobile: subcategories are rendered inline under the category, so no absolute positioning needed.
      if (!isMobile && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const categoryRect = categoryElement.getBoundingClientRect();
        setSubcategoryPosition({
          top: categoryRect.top - containerRect.top,
          left: containerRect.width + 8, // 8px gap from the container
        });
      } else {
        setSubcategoryPosition(null);
      }
    }
  };

  // Close subcategories when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = subcategoryDropdownRef.current?.contains(target);

      if (!isInsideContainer && !isInsideDropdown) {
        setExpandedCategory(null);
        setSubcategoryPosition(null);
      }
    };

    if (expandedCategory) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [expandedCategory]);

  const handleCategoryLink = (categoryId: string) => {
    return `/shop?categoryId=${categoryId}`;
  };

  const handleSubcategoryLink = (categoryId: string, subcategoryId: string) => {
    return `/shop?categoryId=${categoryId}&subcategoryId=${subcategoryId}`;
  };

  if (loading) {
    return (
      <div className="w-full sm:w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div
          className="rounded-t-lg px-4 py-3 flex items-center gap-2"
          style={{ backgroundColor: headerColor }}
        >
          <div className="w-5 h-5 bg-white/20 rounded animate-pulse" />
          <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full sm:w-80 flex-shrink-0">
      <div
        ref={containerRef}
        className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header */}
        <div
          className="rounded-t-lg px-4 py-3 flex items-center gap-2"
          style={{ backgroundColor: headerColor }}
        >
          <Menu className="text-white" size={20} />
          <h2 className="text-white font-bold text-base sm:text-lg uppercase flex-1">
            TOP CATEGORIES
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen((v) => !v);
              setExpandedCategory(null);
              setSubcategoryPosition(null);
            }}
            className="p-2 -mr-2 rounded-md hover:bg-white/10 transition-colors"
            aria-label={
              isMenuOpen ? "Collapse categories menu" : "Expand categories menu"
            }
          >
            <ChevronDown
              size={18}
              className={`text-white transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Categories List — scrollable when many categories */}
        {isMenuOpen && (
          <div className="max-h-[320px] overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth [scrollbar-gutter:stable]">
            {categories.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No categories found
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category) => {
                  const hasSubcategories =
                    (subcategoriesByCategory[category.id]?.length || 0) > 0;
                  const isExpanded = expandedCategory === category.id;

                  return (
                    <div
                      key={category.id}
                      className="relative"
                      id={`category-${category.id}`}
                    >
                      {/* Category Item */}
                      <div className="flex items-center justify-between min-h-[48px]">
                        <Link
                          to={handleCategoryLink(category.id)}
                          className="flex-1 px-4 py-3 text-sm sm:text-base text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center"
                          style={{ minHeight: "48px" }}
                        >
                          {category.name}
                        </Link>
                        {hasSubcategories && (
                          <button
                            onClick={(e) => {
                              const categoryElement = document.getElementById(
                                `category-${category.id}`,
                              );
                              if (categoryElement) {
                                handleCategoryClick(
                                  category.id,
                                  e,
                                  categoryElement,
                                );
                              }
                            }}
                            className="px-3 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            aria-label={
                              isExpanded
                                ? "Collapse subcategories"
                                : "Expand subcategories"
                            }
                          >
                            {isMobile ? (
                              <ChevronDown
                                size={18}
                                className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            ) : (
                              <ChevronRight
                                size={18}
                                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                              />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Mobile inline subcategories (expand under category) */}
                      {isMobile && isExpanded && hasSubcategories && (
                        <div className="px-4 pb-2">
                          <div className="mt-1 space-y-1 rounded-md bg-gray-50 dark:bg-gray-700/40 border border-gray-200/70 dark:border-gray-700 p-1.5">
                            {subcategoriesByCategory[category.id].map(
                              (subcategory) => (
                                <Link
                                  key={subcategory.id}
                                  to={handleSubcategoryLink(
                                    category.id,
                                    subcategory.id,
                                  )}
                                  onClick={() => {
                                    setExpandedCategory(null);
                                    setSubcategoryPosition(null);
                                  }}
                                  className="flex items-center justify-between px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors rounded-md"
                                >
                                  <span className="truncate">
                                    {subcategory.name}
                                  </span>
                                  {subcategory.productsCount !== undefined &&
                                    subcategory.productsCount > 0 && (
                                      <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                                        ({subcategory.productsCount})
                                      </span>
                                    )}
                                </Link>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All Categories Link */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/categories"
              className="block px-4 py-3 text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center"
            >
              All Categories
            </Link>
          </div>
        )}
      </div>

      {/* Desktop Subcategories Dropdown - Outside Layout */}
      {!isMobile &&
        isMenuOpen &&
        expandedCategory &&
        subcategoryPosition &&
        subcategoriesByCategory[expandedCategory] && (
          <div
            ref={subcategoryDropdownRef}
            className="absolute z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px] max-w-[300px] max-h-[500px] overflow-y-auto"
            style={{
              top: `${subcategoryPosition.top}px`,
              left: `${subcategoryPosition.left}px`,
            }}
          >
            <div className="p-2">
              {subcategoriesByCategory[expandedCategory].map((subcategory) => (
                <Link
                  key={subcategory.id}
                  to={handleSubcategoryLink(expandedCategory, subcategory.id)}
                  onClick={() => {
                    setExpandedCategory(null);
                    setSubcategoryPosition(null);
                  }}
                  className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md"
                >
                  {subcategory.name}
                  {subcategory.productsCount !== undefined &&
                    subcategory.productsCount > 0 && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-500">
                        ({subcategory.productsCount})
                      </span>
                    )}
                </Link>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
