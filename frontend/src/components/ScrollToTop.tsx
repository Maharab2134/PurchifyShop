import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * =====================
 * Scrolls window to the top when the route changes.
 * Ensures smooth page transitions without mid-page landing.
 *
 * How it works:
 * - Watches all URL segments (pathname, search, hash)
 * - Disables browser's auto scroll restoration (manual mode)
 * - Scrolls multiple DOM elements to ensure all scroll containers are reset
 * - Uses triple-call pattern to overcome browser optimizations
 * - Handles edge cases like Suspense loading and animations
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if (
      typeof window.history !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }

    const scrollToTop = () => {
      // Reset scroll on all possible scroll containers
      window.scrollTo(0, 0);

      // Reset document element and body
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;

      // Reset the browser's scrolling element (varies by browser)
      if (document.scrollingElement) {
        document.scrollingElement.scrollTop = 0;
        document.scrollingElement.scrollLeft = 0;
      }

      // Reset html element directly
      const htmlElement = document.querySelector("html");
      if (htmlElement) {
        htmlElement.scrollTop = 0;
        htmlElement.scrollLeft = 0;
      }
    };

    // Scroll immediately
    scrollToTop();

    // Scroll again on next animation frame with nested call for subsequent frames
    const raf = requestAnimationFrame(() => {
      scrollToTop();
      requestAnimationFrame(scrollToTop);
    });

    // Scroll again with setTimeout to handle edge cases
    const timer = setTimeout(scrollToTop, 0);

    // Double-check scroll after short delay (helps with async content loading)
    const delayedToken = setTimeout(scrollToTop, 50);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearTimeout(delayedToken);
    };
  }, [pathname, search, hash]);

  return null;
}
