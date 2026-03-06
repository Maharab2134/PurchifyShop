import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * ScrollToTop Component with Smart Scroll Restoration
 * ====================================================
 * Provides professional scroll behavior for e-commerce websites:
 * - Forward navigation (clicking links) → Scroll to top
 * - Back/Forward button navigation → Restore previous scroll position
 * - Creates seamless UX similar to Amazon, Daraz, etc.
 *
 * How it works:
 * - Stores scroll positions in sessionStorage for each route
 * - Detects navigation type (PUSH, POP, REPLACE) via React Router
 * - Automatically manages scroll restoration on browser back/forward
 * - Handles edge cases like Suspense loading and animations
 */

// Store scroll positions for each route
const scrollPositions = new Map<string, number>();

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();
  const locationKey = pathname + search;
  const isFirstRender = useRef(true);
  const lastLocationKey = useRef(locationKey);

  useEffect(() => {
    // Enable manual scroll restoration to take full control
    if (
      typeof window.history !== "undefined" &&
      "scrollRestoration" in window.history
    ) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // Skip scroll management on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Store initial scroll position
      scrollPositions.set(locationKey, window.scrollY || 0);
      return;
    }

    // Save current scroll position before navigating away
    if (lastLocationKey.current !== locationKey) {
      scrollPositions.set(lastLocationKey.current, window.scrollY || 0);
    }

    const performScroll = () => {
      // If navigating back/forward (POP), restore previous scroll position
      if (navigationType === "POP") {
        const savedPosition = scrollPositions.get(locationKey) || 0;

        // Restore scroll position with multiple attempts to handle async content
        const restoreScroll = () => {
          window.scrollTo({
            top: savedPosition,
            left: 0,
            behavior: "instant" as ScrollBehavior,
          });
          document.documentElement.scrollTop = savedPosition;
          document.body.scrollTop = savedPosition;
        };

        // Immediate restore
        restoreScroll();

        // Restore again after animation frame (handles React lazy loading)
        requestAnimationFrame(() => {
          restoreScroll();
          // One more time after another frame for stubborn cases
          requestAnimationFrame(restoreScroll);
        });

        // Final restore after content loads
        setTimeout(restoreScroll, 50);
        setTimeout(restoreScroll, 150);
      } else {
        // For PUSH/REPLACE navigation (clicking links), scroll to top

        // Handle hash navigation (anchor links)
        if (hash) {
          setTimeout(() => {
            const element = document.querySelector(hash);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
          return;
        }

        // Scroll to top for regular navigation
        const scrollToTop = () => {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant" as ScrollBehavior,
          });
          document.documentElement.scrollTop = 0;
          document.documentElement.scrollLeft = 0;
          document.body.scrollTop = 0;
          document.body.scrollLeft = 0;

          if (document.scrollingElement) {
            document.scrollingElement.scrollTop = 0;
            document.scrollingElement.scrollLeft = 0;
          }
        };

        // Immediate scroll
        scrollToTop();

        // Multiple attempts to ensure scroll happens
        requestAnimationFrame(() => {
          scrollToTop();
          requestAnimationFrame(scrollToTop);
        });

        setTimeout(scrollToTop, 0);
        setTimeout(scrollToTop, 50);
      }
    };

    // Perform scroll operation
    performScroll();

    // Update last location
    lastLocationKey.current = locationKey;

    // Cleanup old scroll positions to prevent memory leaks
    // Keep only last 50 positions
    if (scrollPositions.size > 50) {
      const keys = Array.from(scrollPositions.keys());
      keys.slice(0, scrollPositions.size - 50).forEach((key) => {
        scrollPositions.delete(key);
      });
    }
  }, [pathname, search, hash, navigationType, locationKey]);

  return null;
}
