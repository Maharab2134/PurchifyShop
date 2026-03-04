import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { type Notice } from "@/api/notices";

interface NoticeSliderProps {
  notices: Notice[];
}

/**
 * Modern announcement bar with marquee-style scrolling text.
 * Long text slides continuously from right to left (app-style pill container).
 */
export default function NoticeSlider({ notices }: NoticeSliderProps) {
  const [combinedText, setCombinedText] = useState("");
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  // Combine all active notices and calculate average scroll speed
  useEffect(() => {
    if (notices.length === 0) return;
    const combined = notices
      .map((n) => n.text)
      .join(" • ")
      .trim();
    setCombinedText(combined);

    // Use average scroll speed or first notice's speed
    const avgSpeed = Math.round(
      notices.reduce((sum, n) => sum + (n.scrollSpeed || 50), 0) /
        notices.length,
    );
    setScrollSpeed(avgSpeed);
  }, [notices]);

  // Measure content width for animation calculation
  useEffect(() => {
    if (contentRef.current) {
      const width = contentRef.current.scrollWidth;
      setContentWidth(width);
    }
  }, [combinedText]);

  if (!combinedText) return null;

  // Calculate animation duration based on content width and speed
  const duration = contentWidth > 0 ? contentWidth / scrollSpeed : 20;

  return (
    <div className="w-full py-2 sm:py-3">
      <div className="max-w-370 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern pill-style container */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg dark:shadow-2xl px-6 py-3 sm:px-8 sm:py-4"
        >
          {/* Gradient masks for smooth fade effect at edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-white/95 via-white/50 to-transparent dark:from-gray-800/95 dark:via-gray-800/50 dark:to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-white/95 via-white/50 to-transparent dark:from-gray-800/95 dark:via-gray-800/50 dark:to-transparent z-10 pointer-events-none" />

          {/* Scrolling text container */}
          <div className="overflow-hidden">
            <motion.div
              ref={contentRef}
              className="flex gap-8 whitespace-nowrap"
              animate={{
                x: [containerRef.current?.offsetWidth || 0, -contentWidth],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: "linear",
                repeatType: "loop",
              }}
            >
              {/* Original text */}
              <span className="text-sm sm:text-base font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-300 inline-block flex-shrink-0">
                {combinedText}
              </span>

              {/* Duplicate for seamless loop */}
              <span className="text-sm sm:text-base font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-300 inline-block flex-shrink-0">
                {combinedText}
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CSS for smooth scrolling animation */}
      <style>{`
        @supports (animation: marquee) {
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        }
      `}</style>
    </div>
  );
}
