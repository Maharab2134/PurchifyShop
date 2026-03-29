import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  icons,
  type LucideIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { HomeSection } from "@/api/homeSections";

interface FeaturesGridSectionProps {
  section: HomeSection;
}

interface FeatureItem {
  icon?: string;
  title?: string;
  description?: string;
}

const normalizeIconName = (name: string): string =>
  name.toLowerCase().replace(/[-_\s]/g, "");

const normalizedIconMap = Object.entries(icons).reduce<
  Record<string, LucideIcon>
>((acc, [name, component]) => {
  acc[normalizeIconName(name)] = component as LucideIcon;
  return acc;
}, {});

const resolveIcon = (iconName?: string): LucideIcon => {
  if (!iconName?.trim()) return ShieldCheck;

  const requested = iconName.trim();
  const exact = requested as keyof typeof LucideIcons;
  if (exact in LucideIcons) {
    return LucideIcons[exact] as LucideIcon;
  }

  const normalizedRequest = normalizeIconName(requested);
  const normalizedMatch = normalizedIconMap[normalizedRequest];
  if (normalizedMatch) {
    return normalizedMatch;
  }

  return ShieldCheck;
};

export default function FeaturesGridSection({
  section,
}: FeaturesGridSectionProps) {
  const rawItems: unknown[] = Array.isArray(section.themeData?.items)
    ? section.themeData.items
    : [];

  const items: FeatureItem[] = rawItems
    .map((item) => {
      const obj =
        typeof item === "object" && item !== null
          ? (item as Record<string, unknown>)
          : {};

      return {
        icon: typeof obj.icon === "string" ? obj.icon : "",
        title: typeof obj.title === "string" ? obj.title : "",
        description: typeof obj.description === "string" ? obj.description : "",
      };
    })
    .filter((item) => item.title || item.description || item.icon);

  const [cardsPerView, setCardsPerView] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const updateCardsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        setCardsPerView(4);
      } else if (width >= 640) {
        setCardsPerView(2);
      } else {
        setCardsPerView(1);
      }
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const maxIndex = useMemo(
    () => Math.max(0, items.length - cardsPerView),
    [items.length, cardsPerView],
  );

  const activeIndex = Math.min(currentIndex, maxIndex);

  useEffect(() => {
    if (maxIndex <= 0) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const safePrev = Math.min(prev, maxIndex);
        return safePrev >= maxIndex ? 0 : safePrev + 1;
      });
    }, 4500);

    return () => window.clearInterval(timer);
  }, [maxIndex]);

  if (!items.length) return null;

  return (
    <section
      className="py-9 sm:py-12 lg:py-14"
      style={{
        backgroundColor: section.backgroundColor || undefined,
        color: section.textColor || undefined,
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-800 dark:text-slate-100 mb-3">
            {section.title}
          </h2>
        )}

        {section.description && (
          <p className="text-center text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-7 sm:mb-8">
            {section.description}
          </p>
        )}

        <div className="relative">
          {maxIndex > 0 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((prev) => {
                    const safePrev = Math.min(prev, maxIndex);
                    return safePrev <= 0 ? maxIndex : safePrev - 1;
                  })
                }
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg"
                aria-label="Previous features"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((prev) => {
                    const safePrev = Math.min(prev, maxIndex);
                    return safePrev >= maxIndex ? 0 : safePrev + 1;
                  })
                }
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg"
                aria-label="Next features"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="overflow-x-hidden overflow-y-visible pt-3 -mt-3">
            <motion.div
              className="flex"
              animate={{ x: `-${activeIndex * (100 / cardsPerView)}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
            >
              {items.map((item, index) => {
                const Icon = resolveIcon(item.icon);
                return (
                  <div
                    key={`${item.title || "item"}-${index}`}
                    className="w-full sm:w-1/2 xl:w-1/4 flex-shrink-0 px-1.5 sm:px-2.5"
                  >
                    <motion.article
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -6, scale: 1.012 }}
                      whileTap={{ scale: 0.995 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 24,
                        duration: 0.35,
                        delay: index * 0.06,
                      }}
                      className="group h-full rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/90 dark:bg-slate-900/70 px-5 sm:px-6 py-6 sm:py-8 text-center shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-500"
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 mb-4 sm:mb-5 group-hover:bg-slate-800 group-hover:text-white dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900 transition-colors duration-300">
                        <Icon className="w-7 h-7" />
                      </div>
                      {item.title && (
                        <h3 className="text-lg sm:text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2.5 sm:mb-3 leading-tight">
                          {item.title}
                        </h3>
                      )}
                      {item.description && (
                        <p className="text-sm sm:text-base leading-6 sm:leading-7 text-slate-600 dark:text-slate-300">
                          {item.description}
                        </p>
                      )}
                    </motion.article>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {maxIndex > 0 && (
            <div className="flex items-center justify-center gap-2 mt-5 rounded-full bg-slate-100/80 dark:bg-slate-800/70 backdrop-blur-sm px-2 py-1.5 w-fit mx-auto">
              {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                <button
                  key={`feature-dot-${idx}`}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative overflow-hidden rounded-full transition-all duration-500 ease-out ${
                    activeIndex === idx
                      ? "w-9 h-2.5 bg-slate-300 dark:bg-slate-600 shadow-[0_0_0_1px_rgba(100,116,139,0.35)]"
                      : "w-2.5 h-2.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                  }`}
                  aria-current={activeIndex === idx}
                  aria-label={`Go to feature slide ${idx + 1}`}
                >
                  <span
                    className={`absolute inset-y-0.5 left-0.5 rounded-full bg-slate-700 dark:bg-slate-100 transition-all duration-500 ease-out ${
                      activeIndex === idx
                        ? "w-[calc(100%-4px)] opacity-100"
                        : "w-0 opacity-0"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
