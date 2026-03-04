import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

const SCROLL_THRESHOLD = 300;

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-700/90 dark:bg-gray-600/90 hover:bg-gray-800 dark:hover:bg-gray-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 touch-manipulation"
      aria-label="Scroll to top"
    >
      <ChevronUp size={22} strokeWidth={2.5} />
    </button>
  );
}
