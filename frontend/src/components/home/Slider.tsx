import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Slider } from "@/api/sliders";
import { toImageUrl } from "@/utils/imageUrl";

interface SliderProps {
  sliders: Slider[];
  autoPlayInterval?: number;
  showProgress?: boolean;
}

/**
 * Professional e-commerce slider component with touch support,
 * loading states, and clickable slides.
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

  const current = sliders[index];
  const ctaLink = current.buttonLink || current.link;

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
            {/* Clickable Slide Link */}
            {ctaLink ? (
              <a
                href={ctaLink}
                className="block cursor-pointer hover:opacity-95 transition-opacity"
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
              </a>
            ) : (
              <div className="aspect-21/9 w-full overflow-hidden bg-gray-900">
                <img
                  src={toImageUrl(current.image)}
                  alt={current.title || "Product showcase"}
                  className="w-full h-full object-cover object-center"
                  onLoad={handleImageLoad}
                  loading="lazy"
                />
              </div>
            )}
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

        {/* Progress Indicators (Desktop only) */}
        {showProgress && sliders.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 z-10">
            {sliders.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === index ? "w-6 h-1.5 bg-white" : "w-2 h-2 bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
