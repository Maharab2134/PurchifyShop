import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "floating-girl-position";
const DEFAULT_LEFT = 16;
const DEFAULT_TOP = 140;
const BOX_SIZE = 72;
const ROAM_INTERVAL_MS = 7000;
const ROAM_DURATION = 2.2;
const MOBILE_BOX_SIZE = 56;
const MOBILE_BOTTOM_SAFE_GAP = 108;
const MOBILE_EDGE_GAP = 8;

function loadPosition() {
  if (typeof window === "undefined") return { x: DEFAULT_LEFT, y: DEFAULT_TOP };
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const { x, y } = JSON.parse(s);
      if (typeof x === "number" && typeof y === "number") return { x, y };
    }
  } catch {}
  return { x: DEFAULT_LEFT, y: DEFAULT_TOP };
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {}
}

function getRandomPosition() {
  const w = typeof window !== "undefined" ? window.innerWidth : 400;
  const h = typeof window !== "undefined" ? window.innerHeight : 600;
  const isMobile = w < 640;
  const sizePx = isMobile ? MOBILE_BOX_SIZE : BOX_SIZE;
  const minX = isMobile ? MOBILE_EDGE_GAP : 0;
  const maxX = Math.max(minX, w - sizePx - (isMobile ? MOBILE_EDGE_GAP : 0));
  const maxY = Math.max(
    0,
    h - sizePx - (isMobile ? MOBILE_BOTTOM_SAFE_GAP : 0),
  );
  const x = Math.max(minX, Math.min(maxX, Math.random() * maxX));
  const y = Math.max(0, Math.min(maxY, Math.random() * maxY));
  return { x, y };
}

/**
 * Cartoon girl – full website, img1-style. Auto-roams (mon moto gurbe); can also drag.
 */
const DRAG_THRESHOLD = 8;

export default function FloatingGirlCartoon() {
  const [pos, setPos] = useState(loadPosition);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showBuyNow, setShowBuyNow] = useState(false);
  const didDragRef = useRef(false);
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  const clamp = useCallback((x: number, y: number) => {
    const w = typeof window !== "undefined" ? window.innerWidth : 400;
    const h = typeof window !== "undefined" ? window.innerHeight : 600;
    const isMobile = w < 640;
    const sizePx = isMobile ? MOBILE_BOX_SIZE : BOX_SIZE;
    const minX = isMobile ? MOBILE_EDGE_GAP : 0;
    const maxX = Math.max(minX, w - sizePx - (isMobile ? MOBILE_EDGE_GAP : 0));
    const maxY = Math.max(
      0,
      h - sizePx - (isMobile ? MOBILE_BOTTOM_SAFE_GAP : 0),
    );
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(0, Math.min(maxY, y)),
    };
  }, []);

  // Auto-roam: periodically move to a new place (mon moto gurbe)
  useEffect(() => {
    if (dragging) return;
    const t = setInterval(
      () => {
        setPos((prev) => {
          const next = getRandomPosition();
          return next;
        });
      },
      ROAM_INTERVAL_MS + Math.random() * 2000,
    );
    return () => clearInterval(t);
  }, [dragging]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      didDragRef.current = false;
      setDragging(true);
      setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [pos.x, pos.y],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - (pos.x + dragStart.x);
      const dy = e.clientY - (pos.y + dragStart.y);
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
        didDragRef.current = true;
      const { x, y } = clamp(e.clientX - dragStart.x, e.clientY - dragStart.y);
      setPos({ x, y });
    },
    [dragging, dragStart, pos.x, pos.y, clamp],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (dragging) {
        setDragging(false);
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        savePosition(pos.x, pos.y);
        if (!didDragRef.current) setShowBuyNow(true);
      }
    },
    [dragging, pos.x, pos.y],
  );

  useEffect(() => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const { x, y } = clamp(rect.left, rect.top);
    setPos((p) => (p.x !== x || p.y !== y ? { x, y } : p));
  }, [el, clamp]);

  useEffect(() => {
    if (!showBuyNow) return;
    const t = setTimeout(() => setShowBuyNow(false), 4000);
    return () => clearTimeout(t);
  }, [showBuyNow]);

  return (
    <motion.div
      ref={setEl}
      className="hidden sm:block fixed z-[55] cursor-grab active:cursor-grabbing select-none touch-none w-14 h-14 sm:w-[72px] sm:h-[72px]"
      initial={false}
      animate={{ left: pos.x, top: pos.y }}
      transition={{
        type: "tween",
        duration: dragging ? 0 : ROAM_DURATION,
        ease: "easeInOut",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={(e) => {
        if (dragging) {
          setDragging(false);
          (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
          savePosition(pos.x, pos.y);
        }
      }}
      aria-label="Floating character - click for Buy Now"
    >
      <AnimatePresence>
        {showBuyNow && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -4, scale: 0.95 }}
            className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:right-auto sm:left-full sm:top-1/2 sm:-translate-y-1/2 sm:ml-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-xs sm:text-sm shadow-lg border-2 border-white/30 whitespace-nowrap z-10"
          >
            Buy Now!!
            <Link
              to="/shop"
              className="block mt-1.5 text-center text-xs font-semibold underline opacity-95 hover:opacity-100"
              onClick={() => setShowBuyNow(false)}
            >
              Go to Shop →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      {/* img1-style container: rounded, purple gradient */}
      <div
        className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden
          bg-gradient-to-br from-purple-600 to-purple-700 shadow-lg
          border-2 border-white/20 flex items-center justify-center
          hover:from-purple-700 hover:to-purple-800 transition-colors"
      >
        <motion.div
          className="w-full h-full flex items-center justify-center p-0.5 sm:p-1"
          animate={
            dragging
              ? {}
              : {
                  y: [0, -4, 0],
                  rotate: [-1.5, 1.5, -1.5],
                }
          }
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Anime-style: long dark hair, headband, sailor uniform, red bow */}
          <svg
            viewBox="0 0 72 96"
            className="w-full h-full object-contain object-top pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Stylized pinkish-red shadow (behind) */}
            <path
              d="M18 22 L22 90 L38 94 L54 90 L58 22 Q38 14 18 22 Z"
              fill="#E8A0A8"
              opacity="0.45"
            />
            {/* Long dark hair – down to waist */}
            <path
              d="M8 26 Q36 12 64 26 L62 52 L60 78 Q36 88 12 78 L10 52 Z"
              fill="#2C1810"
            />
            <path
              d="M14 28 Q36 18 58 28 L56 48 Q36 56 16 48 Z"
              fill="#1a0f0a"
            />
            {/* Headband – navy/black */}
            <path
              d="M18 24 L36 20 L54 24 L52 28 L36 26 L20 28 Z"
              fill="#1e3a5f"
            />
            {/* Face – fair skin, anime style */}
            <ellipse cx="36" cy="36" rx="18" ry="20" fill="#FFE8DC" />
            {/* Anime eyes – large, dark red/purple irises */}
            <ellipse cx="26" cy="34" rx="5" ry="6" fill="#4a1942" />
            <ellipse cx="46" cy="34" rx="5" ry="6" fill="#4a1942" />
            <circle cx="27" cy="33" r="2" fill="white" opacity="0.95" />
            <circle cx="47" cy="33" r="2" fill="white" opacity="0.95" />
            {/* Small smile */}
            <path
              d="M30 44 Q36 48 42 44"
              stroke="#D4A5A0"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Blush */}
            <ellipse
              cx="20"
              cy="40"
              rx="3"
              ry="2"
              fill="#F4B4C0"
              opacity="0.6"
            />
            <ellipse
              cx="52"
              cy="40"
              rx="3"
              ry="2"
              fill="#F4B4C0"
              opacity="0.6"
            />
            {/* Neck */}
            <path d="M30 54 L36 60 L42 54" fill="#FFE8DC" />
            {/* Sailor collar – white with navy stripes */}
            <path
              d="M24 54 L20 58 L24 62 L36 56 L48 62 L52 58 L48 54 L36 58 Z"
              fill="white"
              stroke="#1e3a5f"
              strokeWidth="1"
            />
            <path
              d="M24 56 L36 52 L48 56"
              stroke="#1e3a5f"
              strokeWidth="1.2"
              fill="none"
            />
            {/* Red bow */}
            <path
              d="M32 52 Q36 48 40 52 Q36 56 32 52 Z"
              fill="#C41E3A"
              stroke="#9a1830"
              strokeWidth="0.8"
            />
            <path
              d="M34 50 L38 54 M38 50 L34 54"
              stroke="#9a1830"
              strokeWidth="0.6"
              fill="none"
            />
            {/* Navy sailor top */}
            <path
              d="M22 58 L20 76 L36 80 L52 76 L50 58 Q36 62 22 58 Z"
              fill="#1e3a5f"
              stroke="#152a45"
              strokeWidth="0.8"
            />
            {/* White cuffs / sleeve stripes */}
            <path d="M20 62 L18 66 L22 66 Z" fill="white" />
            <path d="M52 62 L54 66 L50 66 Z" fill="white" />
            {/* Pleated navy skirt */}
            <path
              d="M24 76 L22 88 L36 92 L50 88 L48 76 Q36 80 24 76 Z"
              fill="#1e3a5f"
              stroke="#152a45"
              strokeWidth="0.6"
            />
            <path
              d="M26 78 L28 86 M32 78 L34 86 M36 78 L36 86 M40 78 L38 86 M44 78 L42 86"
              stroke="#2a4a6f"
              strokeWidth="0.5"
              fill="none"
              opacity="0.8"
            />
            {/* Dark tights / legs */}
            <path d="M28 88 L26 94 L30 94 L32 88" fill="#2C1810" />
            <path d="M40 88 L38 94 L42 94 L44 88" fill="#2C1810" />
            {/* Mary Jane shoes */}
            <path
              d="M25 94 L29 94 L30 95 L26 95 Z"
              fill="#1a0f0a"
              stroke="#0d0805"
              strokeWidth="0.6"
            />
            <path
              d="M42 94 L46 94 L47 95 L43 95 Z"
              fill="#1a0f0a"
              stroke="#0d0805"
              strokeWidth="0.6"
            />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
