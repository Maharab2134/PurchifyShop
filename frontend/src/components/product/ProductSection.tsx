import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  ChevronRight,
  Bath,
  Flame,
  TrendingUp,
  Star,
  Zap,
  Target,
  Crosshair,
  type LucideIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import ProductCard from "./ProductCard";
import CountdownTimer from "@/components/common/CountdownTimer";
import type { Product } from "@/api/products";
import { API_BASE_URL } from "@/lib/config";

const HOME_SECTION_LIMIT = 8;

interface ProductSectionProps {
  title: string;
  products: Product[];
  loading: boolean;
  error: Error | null;
  showTitle?: boolean;
  /** Slug for View More link (e.g. section slug or featured/trending/new-arrivals/best-sellers) */
  viewMoreSlug?: string;
  /** Countdown end date (ISO 8601 string) - shows timer next to title */
  countdownEnd?: string | null;
  /** Icon name (lucide-react icon name) - shows next to countdown timer */
  icon?: string | null;
  /** Section image URL - shows above products */
  image?: string | null;
  /** Force product title to a single line */
  singleLineTitle?: boolean;
  /** Use fewer columns so cards appear wider */
  widerCards?: boolean;
}

export default function ProductSection({
  title,
  products,
  error,
  showTitle = false,
  viewMoreSlug,
  countdownEnd,
  icon,
  image,
  singleLineTitle = false,
  widerCards = false,
}: ProductSectionProps) {
  if (error) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">
                Error loading {title.toLowerCase()}
              </h3>
              <p className="text-red-600 dark:text-red-400 text-sm">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  const displayProducts = products.slice(0, HOME_SECTION_LIMIT);

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base =
      API_BASE_URL.replace(/\/api\/v1$/, "") || "http://localhost:8000";
    return `${base}/storage/${path.replace(/^\//, "")}`;
  };

  // Icon name mappings for common variations (direct component references)
  const iconComponentMap: Record<string, LucideIcon> = {
    hottub: Bath,
    "hot-tub": Bath,
    hot_tub: Bath,
    bathtub: Bath,
    "bath-tub": Bath,
    bath_tub: Bath,
    bath: Bath,
    flame: Flame,
    trendingup: TrendingUp,
    "trending-up": TrendingUp,
    star: Star,
    zap: Zap,
    aim: Target,
    target: Target,
    crosshair: Crosshair,
    "cross-hair": Crosshair,
    crosshair2: Crosshair,
    focus: Target,
    bullseye: Target,
  };

  // Helper function to normalize icon name (remove dashes, underscores, spaces)
  const normalizeIconName = (name: string): string => {
    return name.toLowerCase().replace(/[-_\s]/g, "");
  };

  // Get icon component from lucide-react - comprehensive lookup
  let IconComponent: LucideIcon | null = null;
  if (icon && typeof icon === "string" && icon.trim()) {
    const iconName = icon.trim();
    const normalizedName = normalizeIconName(iconName);

    // Debug: log icon value for troubleshooting
    if (import.meta.env.DEV) {
      console.log(
        `[ProductSection] Looking for icon: "${iconName}" (normalized: "${normalizedName}") for section: "${title}"`,
      );
    }

    // Step 1: Check direct component map (for common variations)
    if (iconComponentMap[normalizedName]) {
      IconComponent = iconComponentMap[normalizedName];
      if (import.meta.env.DEV) {
        console.log(
          `[ProductSection] ✅ Icon found in component map: ${normalizedName}`,
        );
      }
    } else {
      // Step 2: Try exact match in LucideIcons (case-sensitive)
      let IconName = iconName as keyof typeof LucideIcons;
      if (
        IconName in LucideIcons &&
        typeof LucideIcons[IconName] === "function"
      ) {
        IconComponent = LucideIcons[IconName] as LucideIcon;
        if (import.meta.env.DEV) {
          console.log(
            `[ProductSection] ✅ Icon found (exact match): ${IconName}`,
          );
        }
      } else {
        // Step 3: Try case-insensitive lookup
        const allIconNames = Object.keys(LucideIcons) as Array<
          keyof typeof LucideIcons
        >;
        const matchedIcon = allIconNames.find(
          (name) => normalizeIconName(name as string) === normalizedName,
        );
        if (matchedIcon && typeof LucideIcons[matchedIcon] === "function") {
          IconComponent = LucideIcons[matchedIcon] as LucideIcon;
          if (import.meta.env.DEV) {
            console.log(
              `[ProductSection] ✅ Icon found (case-insensitive): ${matchedIcon}`,
            );
          }
        } else {
          // Step 4: Try partial match (if icon name contains the search term)
          const partialMatch = allIconNames.find((name) => {
            const normalized = normalizeIconName(name as string);
            return (
              normalized.includes(normalizedName) ||
              normalizedName.includes(normalized)
            );
          });
          if (partialMatch && typeof LucideIcons[partialMatch] === "function") {
            IconComponent = LucideIcons[partialMatch] as LucideIcon;
            if (import.meta.env.DEV) {
              console.log(
                `[ProductSection] ✅ Icon found (partial match): ${partialMatch}`,
              );
            }
          } else {
            // Step 5: Try fuzzy match (similar names)
            const fuzzyMatch = allIconNames.find((name) => {
              const normalized = normalizeIconName(name as string);
              // Check if they share significant characters
              const searchChars = normalizedName.split("");
              const nameChars = normalized.split("");
              const commonChars = searchChars.filter((char) =>
                nameChars.includes(char),
              );
              return (
                commonChars.length >=
                Math.min(normalizedName.length, normalized.length) * 0.6
              );
            });
            if (fuzzyMatch && typeof LucideIcons[fuzzyMatch] === "function") {
              IconComponent = LucideIcons[fuzzyMatch] as LucideIcon;
              if (import.meta.env.DEV) {
                console.log(
                  `[ProductSection] ✅ Icon found (fuzzy match): ${fuzzyMatch}`,
                );
              }
            } else {
              // Icon not found - show helpful message
              if (import.meta.env.DEV) {
                console.warn(
                  `[ProductSection] ❌ Icon "${icon}" not found in lucide-react for section "${title}"`,
                );
                console.log(
                  `[ProductSection] 💡 Search for icons at: https://lucide.dev/icons?search=${encodeURIComponent(iconName)}`,
                );
                console.log(
                  `[ProductSection] Available icons (sample):`,
                  allIconNames.slice(0, 30).join(", "),
                );
              }
            }
          }
        }
      }
    }
  } else if (icon) {
    // Debug: log if icon is not a valid string
    if (import.meta.env.DEV) {
      console.warn(
        `[ProductSection] Invalid icon value for section "${title}":`,
        icon,
        typeof icon,
      );
    }
  }

  // Final validation
  if (icon && !IconComponent && import.meta.env.DEV) {
    console.error(
      `[ProductSection] ⚠️ Icon lookup failed for "${icon}" in section "${title}"`,
    );
  }

  return (
    <section className="py-6 sm:py-10 lg:py-14 w-full bg-gray-50 dark:bg-gray-900/40">
      {/* Full width image if provided */}
      {image && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 sm:mb-6 w-full px-3 sm:px-4 lg:px-8"
        >
          <div className="aspect-[16/5] sm:aspect-[16/5] overflow-hidden rounded-xl sm:rounded-2xl shadow-sm">
            <img
              src={getImageUrl(image)}
              alt={title}
              className="w-full h-full object-cover object-center"
            />
          </div>
        </motion.div>
      )}

      {/* Content with max-width for readability - Walmart style */}
      <div className="w-full px-3 sm:px-4 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          {showTitle && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 sm:mb-6"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-2 sm:gap-3">
                  {IconComponent ? (
                    <IconComponent
                      size={24}
                      className="text-indigo-600 dark:text-indigo-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                  ) : icon ? (
                    // Fallback: show a placeholder if icon name provided but not found
                    <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400">
                        ?
                      </span>
                    </div>
                  ) : null}
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    {title}
                  </h2>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {countdownEnd && countdownEnd.trim() && (
                    <CountdownTimer endDate={countdownEnd} iconName={icon} />
                  )}
                  {viewMoreSlug && !countdownEnd && (
                    <Link
                      to={`/section/${viewMoreSlug}`}
                      className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs sm:text-sm hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      View More
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div
            className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${
              widerCards
                ? "lg:grid-cols-3 xl:grid-cols-4"
                : "lg:grid-cols-4 xl:grid-cols-5"
            } gap-3 sm:gap-4 lg:gap-5`}
          >
            {displayProducts.map((product) => (
              <div key={product.id}>
                <ProductCard
                  product={product}
                  compact
                  showOnlyBuyNow
                  singleLineTitle={singleLineTitle}
                />
              </div>
            ))}
          </div>

          {viewMoreSlug && countdownEnd && (
            <div className="mt-6 text-center">
              <Link
                to={`/section/${viewMoreSlug}`}
                className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                View More
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
