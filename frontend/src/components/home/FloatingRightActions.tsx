import FloatingContactWidget from "./FloatingContactWidget";
import ScrollToTopButton from "./ScrollToTopButton";

/**
 * Right-side floating actions: chat icon (img 1) on top, scroll-to-top button below.
 * Chat shows when store has contact options; scroll button shows when user has scrolled down.
 */
export default function FloatingRightActions() {
  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-3 floating-contact-above-nav">
      <FloatingContactWidget embedded />
      <ScrollToTopButton />
    </div>
  );
}
