import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Rating from "@/components/feedback/Rating";
import type { HomeSection } from "@/api/homeSections";
import type { Product } from "@/api/products";
import { API_BASE_URL } from "@/lib/config";
import { getProductImage } from "@/utils/imageUrl";

interface CountdownGridSectionProps {
  section: HomeSection;
}

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

function CompactRowCard({ product }: { product: Product }) {
  const firstVariant = product.variants?.[0];
  const originalPrice =
    product.originalPrice ?? firstVariant?.originalPrice ?? 0;
  const discountedPrice = product.discountedPrice ?? firstVariant?.price ?? 0;
  const hasDiscount =
    product.isDiscountActive && originalPrice > discountedPrice;

  const productImages = product.images ?? [];
  const variantImages = firstVariant?.images ?? [];
  const imageUrl = getProductImage(
    variantImages,
    productImages,
    product.name,
    160,
  );

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="flex items-stretch gap-3 sm:gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-3 shadow-sm hover:shadow-md transition">
        {/* Image — img1 style: square, rounded, left */}
        <div className="w-20 h-20 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-2"
            loading="lazy"
          />
        </div>
        {/* Details — title, rating, price (img1 style) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 leading-snug">
            {product.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <Rating rating={product.averageRating ?? 0} size="sm" />
            <span>({product.reviewCount ?? 0})</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-500 shrink-0">
              ৳{discountedPrice.toFixed(0)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through shrink-0">
                  ৳{originalPrice.toFixed(0)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CountdownGridSection({
  section,
}: CountdownGridSectionProps) {
  const products = section.products || [];
  const mobileLimit = 3;
  const desktopLimit = 5;
  const mobileProducts = products.slice(0, mobileLimit);
  const desktopProducts = products.slice(0, desktopLimit);
  const hasMoreMobile = products.length > mobileLimit;
  const hasMoreDesktop = products.length > desktopLimit;
  const viewMoreHref = section.slug ? `/section/${section.slug}` : "/shop";
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base =
      API_BASE_URL.replace(/\/api\/v1$/, "") || "http://localhost:8000";
    return `${base}/storage/${path.replace(/^\//, "")}`;
  };

  useEffect(() => {
    if (!section.countdownEnd || !section.countdownEnd.trim()) {
      setTimeLeft(null);
      return;
    }

    const calculate = (): TimeLeft => {
      const now = new Date().getTime();
      const end = new Date(section.countdownEnd as string).getTime();
      const diff = end - now;
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      return { days, hours, minutes, seconds, expired: false };
    };

    setTimeLeft(calculate());
    const interval = setInterval(() => {
      const next = calculate();
      setTimeLeft(next);
      if (next.expired) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [section.countdownEnd]);

  if (
    !section.image &&
    products.length === 0 &&
    !section.title &&
    !section.description
  ) {
    return null;
  }

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-2xl bg-white dark:bg-gray-900 p-6 sm:p-8"
          style={{
            backgroundColor: section.backgroundColor || undefined,
            color: section.textColor || undefined,
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 items-center">
            {section.image && (
              <div className="flex items-center justify-center">
                <img
                  src={getImageUrl(section.image)}
                  alt={section.title || section.name || "Section image"}
                  className="w-full max-w-[520px] h-[240px] sm:h-[300px] object-contain"
                />
              </div>
            )}

            <div>
              {section.subtitle && (
                <p className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-300 mb-2">
                  {section.subtitle}
                </p>
              )}
              {section.title && (
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {section.title}
                </h2>
              )}
              {section.description && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                  {section.description}
                </p>
              )}

              {timeLeft && !timeLeft.expired && (
                <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5 max-w-md">
                  {[
                    { label: "Days", value: pad2(timeLeft.days) },
                    { label: "Hr", value: pad2(timeLeft.hours) },
                    { label: "Min", value: pad2(timeLeft.minutes) },
                    { label: "Sec", value: pad2(timeLeft.seconds) },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 sm:px-3 py-2.5 text-center shadow-sm"
                    >
                      <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                        {item.value}
                      </div>
                      <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {section.ctaText && (
                <Link
                  to={section.ctaLink || "#"}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                >
                  {section.ctaText}
                </Link>
              )}
            </div>
          </div>
        </div>

        {products.length > 0 && (
          <>
            <div className="mt-6 sm:mt-8 grid grid-cols-1 gap-3 sm:hidden">
              {mobileProducts.map((product: Product) => (
                <CompactRowCard key={product.id} product={product} />
              ))}
            </div>

            {hasMoreMobile && (
              <div className="mt-4 sm:hidden text-center">
                <Link
                  to={viewMoreHref}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  View More
                </Link>
              </div>
            )}

            <div className="hidden sm:grid mt-6 sm:mt-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {desktopProducts.map((product: Product) => (
                <CompactRowCard key={product.id} product={product} />
              ))}
            </div>

            {hasMoreDesktop && (
              <div className="hidden sm:block mt-5 text-center">
                <Link
                  to={viewMoreHref}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  View More
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
