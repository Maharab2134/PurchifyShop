import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Clock,
  Tag,
} from "lucide-react";
import { type Slider } from "@/api/sliders";
import { toImageUrl } from "@/utils/imageUrl";

interface SliderProps {
  sliders: Slider[];
  autoPlayInterval?: number;
  showProgress?: boolean;
}

type EnhancedSlider = Slider & {
  badge?: "sale" | "new" | "limited" | string;
  badgeLabel?: string;
  price?: number;
  oldPrice?: number;
};

/**
 * Professional e-commerce slider component with touch support,
 * loading states, and rich product-focused features.
 */
export default function HomeSlider({
  sliders,
  autoPlayInterval = 6000,
  showProgress = true,
}: SliderProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      go(index + 1);
    } else if (isRightSwipe) {
      go(index - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  useEffect(() => {
    if (sliders.length === 0 || isPaused) return;
    const timer = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % sliders.length);
    }, autoPlayInterval);
    return () => window.clearTimeout(timer);
  }, [sliders.length, index, isPaused, autoPlayInterval]);

  const go = useCallback(
    (next: number) => {
      if (sliders.length === 0) return;
      setIsLoading(true);
      setIndex((next + sliders.length) % sliders.length);
    },
    [sliders.length],
  );

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (sliders.length === 0) return null;

  const current = sliders[index] as EnhancedSlider;
  const ctaLink = current.buttonLink || current.link;
  const ctaLabel = current.buttonTitle?.trim() || "Add to Cart";

  // Format price if available
  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="relative w-full h-full group">
      <div
        ref={sliderRef}
        className="relative overflow-hidden rounded-2xl shadow-2xl bg-linear-to-br from-gray-900 to-gray-800"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 animate-pulse">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent shimmer" />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full"
          >
            {/* Image Container */}
            <div className="aspect-21/9 w-full overflow-hidden bg-gray-900">
              <img
                src={toImageUrl(current.image)}
                alt={current.title || "Product showcase"}
                className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-7000"
                onLoad={handleImageLoad}
                loading="lazy"
              />
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent">
              <div className="w-full h-full flex items-center">
                <div className="w-full max-w-3xl px-8 md:px-16 text-white">
                  {/* Badge */}
                  {current.badge && (
                    <motion.span
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center px-4 py-2 bg-linear-to-r from-blue-500 to-purple-500 rounded-full text-sm font-semibold mb-4 shadow-lg"
                    >
                      {current.badge === "sale" && (
                        <Tag className="w-4 h-4 mr-2" />
                      )}
                      {current.badge === "new" && (
                        <ShoppingBag className="w-4 h-4 mr-2" />
                      )}
                      {current.badge === "limited" && (
                        <Clock className="w-4 h-4 mr-2" />
                      )}
                      {current.badgeLabel || "Special Offer"}
                    </motion.span>
                  )}

                  {/* Title */}
                  {current.title && (
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight"
                    >
                      {current.title}
                    </motion.h2>
                  )}

                  {/* Description */}
                  {current.description && (
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-base sm:text-lg md:text-xl opacity-90 mb-6 max-w-2xl"
                    >
                      {current.description}
                    </motion.p>
                  )}

                  {/* Price and CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-6 flex-wrap"
                  >
                    {current.price && (
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl md:text-4xl font-bold text-blue-400">
                          {formatPrice(current.price)}
                        </span>
                        {current.oldPrice && (
                          <span className="text-lg md:text-xl text-gray-400 line-through">
                            {formatPrice(current.oldPrice)}
                          </span>
                        )}
                      </div>
                    )}

                    {ctaLink ? (
                      <a
                        href={ctaLink}
                        className="group inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-xl"
                      >
                        {ctaLabel}
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          /* Add to cart logic */
                        }}
                        className="group inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-xl"
                      >
                        {ctaLabel}
                        <ShoppingBag className="w-5 h-5 ml-2" />
                      </button>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        {sliders.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full shadow-xl hover:bg-white/20 transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 transform hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} className="text-white" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-md rounded-full shadow-xl hover:bg-white/20 transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 transform hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight size={24} className="text-white" />
            </button>
          </>
        )}

        {/* Progress Indicators */}
        {showProgress && sliders.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {sliders.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Slide Counter */}
        {sliders.length > 1 && (
          <div className="absolute top-6 right-6 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-sm z-10">
            {index + 1} / {sliders.length}
          </div>
        )}
      </div>
    </div>
  );
}
