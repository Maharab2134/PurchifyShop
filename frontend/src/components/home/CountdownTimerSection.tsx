import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import CountdownTimer from "@/components/common/CountdownTimer";
import type { HomeSection } from "@/api/homeSections";
import { API_BASE_URL } from "@/lib/config";

interface CountdownTimerSectionProps {
  section: HomeSection;
}

export default function CountdownTimerSection({
  section,
}: CountdownTimerSectionProps) {
  const timerData = section.themeData || {};

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const base =
      API_BASE_URL.replace(/\/api\/v1$/, "") || "http://localhost:8000";
    return `${base}/storage/${path.replace(/^\//, "")}`;
  };

  return (
    <section
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden"
      style={{
        backgroundColor: section.backgroundColor || "#10b981",
        color: section.textColor || "#ffffff",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {section.subtitle && (
              <p className="text-lg font-medium mb-2 opacity-90">
                {section.subtitle}
              </p>
            )}
            {section.title && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-lg mb-6 opacity-90">{section.description}</p>
            )}

            {section.countdownEnd && section.countdownEnd.trim() && (
              <div className="mb-6">
                <CountdownTimer endDate={section.countdownEnd} />
              </div>
            )}

            {section.ctaText && (
              <Link
                to={section.ctaLink || "#"}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                {section.ctaText}
              </Link>
            )}
          </motion.div>

          {/* Right side - Image */}
          {section.image && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <img
                src={getImageUrl(section.image)}
                alt={section.title || ""}
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
