import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";

const SWIPE_THRESHOLD = 50;
import { generateProductPlaceholder } from "@/utils/placeholderImage";
import { toImageUrl } from "@/utils/imageUrl";
import { buildProductImageAlt } from "@/utils/seo";

interface ProductImageGalleryProps {
  images: string[];
  name: string;
  defaultImage: string;
  categoryName?: string;
  onImageSelect?: (imageUrl: string) => void;
}

// Lightbox Modal Component — swipe on image to change; arrows hidden on mobile
function ImageLightbox({
  image,
  onClose,
  onPrev,
  onNext,
  imageIndex,
  totalImages,
  name,
  categoryName,
}: {
  image: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  imageIndex: number;
  totalImages: number;
  name: string;
  categoryName?: string;
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const lightboxRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || totalImages <= 1) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) onNext();
      else onPrev();
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
      if (e.key === " " || e.key === "z") setIsZoomed(!isZoomed);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onPrev, onNext, isZoomed]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div
      ref={lightboxRef}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-medium">
            {imageIndex + 1} / {totalImages}
          </div>
          <div className="text-white/80 text-sm">{name}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-105 backdrop-blur-sm"
            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            title="Toggle zoom (Z)"
          >
            <ZoomIn size={22} />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-105 backdrop-blur-sm"
            aria-label="Close"
            title="Close (ESC)"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Navigation Buttons — hidden on mobile/tablet; swipe or mouse on image instead */}
      {totalImages > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:scale-110 backdrop-blur-sm group hidden lg:flex items-center justify-center"
            aria-label="Previous image"
          >
            <ChevronLeft
              size={28}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          </button>

          <button
            onClick={onNext}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all transform hover:scale-110 backdrop-blur-sm group hidden lg:flex items-center justify-center"
            aria-label="Next image"
          >
            <ChevronRight
              size={28}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </>
      )}

      {/* Image Container — touch swipe to change image on mobile */}
      <div
        className="w-full h-full flex items-center justify-center p-8 md:p-12 touch-pan-y"
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => totalImages === 1 && setIsZoomed(!isZoomed)}
        style={{
          cursor:
            totalImages === 1 ? (isZoomed ? "zoom-out" : "zoom-in") : "default",
        }}
      >
        <div className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center">
          <img
            src={image}
            alt={buildProductImageAlt({
              productName: name,
              categoryName,
              context: "main",
              index: imageIndex,
            })}
            className={`transition-all duration-300 ${isZoomed ? "scale-150" : "scale-100"}`}
            style={
              isZoomed
                ? {
                    transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                  }
                : {}
            }
            onError={(e) => {
              e.currentTarget.src = generateProductPlaceholder(name, 1200);
            }}
          />

          {/* Zoom Indicator */}
          {isZoomed && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm animate-pulse">
              Click to zoom out • Scroll to pan
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 text-white/60 text-sm">
        <div className="flex items-center gap-1">
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd>
          <span>Close</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">←</kbd>
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">→</kbd>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Z</kbd>
          <span>Zoom</span>
        </div>
      </div>
    </div>
  );
}

export default function ProductImageGallery({
  images,
  name,
  defaultImage,
  categoryName,
  onImageSelect,
}: ProductImageGalleryProps) {
  // Convert all images to full URLs
  const imageUrls = images
    .map((img) => {
      if (!img) return null;
      if (img.startsWith("http://") || img.startsWith("https://")) return img;
      return toImageUrl(img);
    })
    .filter(Boolean) as string[];

  const defaultImageUrl = defaultImage
    ? defaultImage.startsWith("http://") || defaultImage.startsWith("https://")
      ? defaultImage
      : toImageUrl(defaultImage)
    : generateProductPlaceholder(name, 600);

  const [selectedImage, setSelectedImage] = useState(() => {
    if (imageUrls.length > 0) return imageUrls[0];
    if (defaultImageUrl) return defaultImageUrl;
    return generateProductPlaceholder(name, 600);
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showLightbox, setShowLightbox] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const mouseStartX = useRef<number | null>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    if (imageUrls.length > 0) {
      const currentIndex = imageUrls.findIndex((img) => img === selectedImage);
      if (currentIndex === -1) {
        setSelectedImage(imageUrls[0]);
        setSelectedIndex(0);
      } else {
        setSelectedIndex(currentIndex);
      }
    } else if (defaultImageUrl) {
      setSelectedImage(defaultImageUrl);
      setSelectedIndex(0);
    }
  }, [imageUrls, defaultImageUrl, selectedImage]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  useEffect(() => {
    if (onImageSelect) {
      onImageSelect(selectedImage);
    }
  }, [onImageSelect, selectedImage]);

  const handleImageSelect = (img: string, index: number) => {
    setSelectedImage(img);
    setSelectedIndex(index);
    setIsZoomed(false);
  };

  const handlePrevImage = () => {
    const newIndex =
      selectedIndex === 0 ? imageUrls.length - 1 : selectedIndex - 1;
    setSelectedImage(imageUrls[newIndex] || defaultImageUrl);
    setSelectedIndex(newIndex);
    setIsZoomed(false);
  };

  const handleNextImage = () => {
    const newIndex =
      selectedIndex === imageUrls.length - 1 ? 0 : selectedIndex + 1;
    setSelectedImage(imageUrls[newIndex] || defaultImageUrl);
    setSelectedIndex(newIndex);
    setIsZoomed(false);
  };

  const handleSwipeStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || imageUrls.length <= 1) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      didDragRef.current = true;
      if (diff > 0) handleNextImage();
      else handlePrevImage();
    }
    touchStartX.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageUrls.length <= 1) return;
    mouseStartX.current = e.clientX;
    didDragRef.current = false;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current == null || imageUrls.length <= 1) return;
    const diff = mouseStartX.current - e.clientX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      didDragRef.current = true;
      if (diff > 0) handleNextImage();
      else handlePrevImage();
    }
    mouseStartX.current = null;
  };
  const handleImageAreaClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setShowLightbox(true);
  };

  const handleZoomToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  const handleFullScreenToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!galleryRef.current) return;
    if (!isFullScreen) {
      try {
        await galleryRef.current.requestFullscreen();
        setIsFullScreen(true);
      } catch (err) {
        console.error("Failed to enter fullscreen:", err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullScreen(false);
      } catch (err) {
        console.error("Failed to exit fullscreen:", err);
      }
    }
    setIsZoomed(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  if (imageUrls.length === 0) {
    return (
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <img
            src={generateProductPlaceholder(name, 400)}
            alt={buildProductImageAlt({
              productName: name,
              categoryName,
              context: "main",
            })}
            width={400}
            height={400}
            className="object-contain rounded-xl max-w-full max-h-[400px] mx-auto"
          />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
            No images available
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={galleryRef}
        className={`relative ${isFullScreen ? "bg-black h-screen w-screen p-6" : ""}`}
      >
        {/* Main Gallery Container */}
        <div
          className={`${isFullScreen ? "h-full" : ""} flex flex-col lg:flex-row gap-6 lg:gap-8`}
        >
          {/* Thumbnails - Vertical on desktop, horizontal on mobile */}
          {imageUrls.length > 1 && (
            <div className="lg:w-24 order-2 lg:order-1">
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto pb-4 lg:pb-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {imageUrls.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageSelect(img, index)}
                    className={`relative flex-shrink-0 transition-all duration-300 group ${
                      selectedIndex === index
                        ? "ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={img}
                        alt={buildProductImageAlt({
                          productName: name,
                          categoryName,
                          context: "thumbnail",
                          index,
                        })}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = generateProductPlaceholder(
                            name,
                            80,
                          );
                        }}
                      />
                      {selectedIndex === index && (
                        <div className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/30 rounded-lg" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Image Container */}
          <div
            className={`relative flex-1 ${isFullScreen ? "h-full" : ""} order-1 lg:order-2`}
          >
            <div
              className={`${isFullScreen ? "h-full" : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"} rounded-2xl p-4 md:p-6 lg:p-8`}
            >
              <div className="relative">
                {/* Image Counter */}
                {imageUrls.length > 1 && (
                  <div className="absolute top-4 left-4 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm">
                    {selectedIndex + 1} / {imageUrls.length}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  <button
                    onClick={handleZoomToggle}
                    className={`p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm transition-all hover:scale-105 ${
                      isZoomed
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50"
                        : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                    aria-label={isZoomed ? "Exit zoom" : "Zoom image"}
                    title={isZoomed ? "Zoom out" : "Zoom in"}
                  >
                    <ZoomIn size={20} />
                  </button>

                  <button
                    onClick={handleFullScreenToggle}
                    className="p-2.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm transition-all hover:scale-105 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                    aria-label={
                      isFullScreen ? "Exit fullscreen" : "View fullscreen"
                    }
                    title={
                      isFullScreen ? "Exit fullscreen" : "Enter fullscreen"
                    }
                  >
                    {isFullScreen ? (
                      <Minimize2 size={20} />
                    ) : (
                      <Maximize2 size={20} />
                    )}
                  </button>
                </div>

                {/* Navigation Arrows — hidden on mobile/tablet; swipe or mouse on image instead */}
                {imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 lg:p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm transition-all hover:scale-105 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 group hidden lg:flex items-center justify-center"
                      aria-label="Previous image"
                    >
                      <ChevronLeft
                        size={20}
                        className="group-hover:-translate-x-0.5 transition-transform"
                      />
                    </button>

                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 lg:p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm transition-all hover:scale-105 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 group hidden lg:flex items-center justify-center"
                      aria-label="Next image"
                    >
                      <ChevronRight
                        size={20}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </button>
                  </>
                )}

                {/* Main Image — swipe (touch) or drag (mouse) to change image; no arrow icons on mobile/tablet */}
                <div
                  className={`relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 touch-pan-y select-none ${
                    isFullScreen
                      ? "h-[calc(100vh-12rem)]"
                      : "min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]"
                  } flex items-center justify-center group cursor-zoom-in`}
                  onMouseMove={handleMouseMove}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    mouseStartX.current = null;
                  }}
                  onTouchStart={handleSwipeStart}
                  onTouchEnd={handleSwipeEnd}
                  onClick={handleImageAreaClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setShowLightbox(true);
                    }
                  }}
                >
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Mobile: swipe hint (only when multiple images) */}
                  {imageUrls.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs">
                      Swipe to see more
                    </div>
                  )}
                  {/* Desktop: click hint */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block">
                    Click to view fullscreen
                  </div>

                  <img
                    src={selectedImage}
                    alt={buildProductImageAlt({
                      productName: name,
                      categoryName,
                      context: "main",
                      index: selectedIndex,
                    })}
                    className={`w-full h-full object-contain transition-all duration-300 ${
                      isZoomed ? "scale-150" : "scale-100"
                    }`}
                    style={
                      isZoomed
                        ? {
                            transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                            objectPosition: "center",
                          }
                        : {}
                    }
                    onError={(e) => {
                      e.currentTarget.src = generateProductPlaceholder(
                        name,
                        600,
                      );
                    }}
                  />
                </div>

                {/* Zoom Indicator */}
                {isZoomed && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full text-sm shadow-sm">
                    Scroll to pan • Click to exit zoom
                  </div>
                )}
              </div>

              {/* Product Name (Fullscreen Only) */}
              {isFullScreen && (
                <div className="mt-6 text-center">
                  <h2 className="text-xl font-semibold text-white">{name}</h2>
                  {categoryName && (
                    <p className="text-white/70 mt-1">
                      Category: {categoryName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <ImageLightbox
          image={selectedImage}
          onClose={() => setShowLightbox(false)}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          imageIndex={selectedIndex}
          totalImages={imageUrls.length || 1}
          name={name}
          categoryName={categoryName}
        />
      )}
    </>
  );
}
