import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { HomeSection } from "@/api/homeSections";
import type { Product } from "@/api/products";

interface ProductCarouselProps {
  section: HomeSection;
}

export default function ProductCarousel({ section }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const products = section.products || [];
  const itemsPerView = 3;
  const maxIndex = Math.max(0, products.length - itemsPerView);

  const next = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  if (!products.length) return null;

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            {section.title && (
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {section.description}
              </p>
            )}
          </div>
          {section.slug && (
            <Link
              to={`/section/${section.slug}`}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium shrink-0 ml-auto"
            >
              View all
            </Link>
          )}
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-4 sm:gap-6"
              animate={{ x: `-${currentIndex * (100 / itemsPerView)}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {products.map((product: Product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <ProductCard product={product} singleLineTitle />
                </div>
              ))}
            </motion.div>
          </div>

          {products.length > itemsPerView && (
            <>
              <button
                onClick={prev}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={next}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
