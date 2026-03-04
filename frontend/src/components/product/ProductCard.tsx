import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Zap, Star, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import Rating from "@/components/feedback/Rating";
import { generateProductPlaceholder } from "@/utils/placeholderImage";
import { toImageUrl } from "@/utils/imageUrl";
import { buildProductImageAlt } from "@/utils/seo";
import { wishlistApi } from "@/api/wishlist";
import { cartApi } from "@/api/cart";
import { useAuth } from "@/hooks/useAuth";
import useToast from "@/hooks/useToast";
import { storeInfoApi } from "@/api/storeInfo";
import type { Product } from "@/api/products";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  showOnlyBuyNow?: boolean;
  imageAspectClass?: string;
  showQuickView?: boolean;
  onQuickView?: () => void;
}

export default function ProductCard({
  product,
  compact = false,
  showOnlyBuyNow = false,
  imageAspectClass,
  showQuickView = false,
  onQuickView,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fetch logo from store info
  useEffect(() => {
    storeInfoApi
      .get()
      .then((info) => {
        if (info.logo) {
          setLogoUrl(toImageUrl(info.logo));
        }
      })
      .catch(() => setLogoUrl(null));
  }, []);

  const inStockVariants = (product.variants || []).filter((v) => v.stock > 0);
  const totalStock =
    product.totalStock ??
    (inStockVariants.length > 0
      ? inStockVariants.reduce((s, v) => s + v.stock, 0)
      : 0);
  const isOutOfStock =
    product.isOutOfStock ?? (inStockVariants.length === 0 && totalStock === 0);

  const firstVariant = product.variants?.[0];
  const originalPrice =
    product.originalPrice ?? firstVariant?.originalPrice ?? 0;
  const discountedPrice = product.discountedPrice ?? firstVariant?.price ?? 0;
  const hasDiscount =
    product.isDiscountActive && originalPrice > discountedPrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
    : 0;

  useEffect(() => {
    if (!product.id) return;

    if (!isAuthenticated) {
      const guestWishlist = localStorage.getItem("guestWishlist");
      if (guestWishlist) {
        try {
          const ids = JSON.parse(guestWishlist) as string[];
          setInWishlist(ids.includes(product.id));
        } catch {
          setInWishlist(false);
        }
      } else {
        setInWishlist(false);
      }
      return;
    }

    wishlistApi
      .get()
      .then((res) => {
        const ids = res.data?.data?.productIds ?? [];
        setInWishlist(ids.includes(product.id));
      })
      .catch(() => setInWishlist(false));
  }, [isAuthenticated, product.id]);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlistLoading(true);

    try {
      if (!isAuthenticated) {
        const guestWishlist = localStorage.getItem("guestWishlist");
        let ids: string[] = [];
        if (guestWishlist) {
          try {
            ids = JSON.parse(guestWishlist) as string[];
          } catch {
            ids = [];
          }
        }

        if (inWishlist) {
          ids = ids.filter((id) => id !== product.id);
          setInWishlist(false);
          showToast("Removed from wishlist", "success");
        } else {
          ids.push(product.id);
          setInWishlist(true);
          showToast("Added to wishlist!", "success");
        }

        localStorage.setItem("guestWishlist", JSON.stringify(ids));
        if (typeof window !== "undefined")
          window.dispatchEvent(new CustomEvent("wishlist:updated"));
      } else {
        if (inWishlist) {
          await wishlistApi.remove(product.id);
          setInWishlist(false);
          showToast("Removed from wishlist", "success");
        } else {
          await wishlistApi.add(product.id);
          setInWishlist(true);
          showToast("Added to wishlist!", "success");
        }
        if (typeof window !== "undefined")
          window.dispatchEvent(new CustomEvent("wishlist:updated"));
      }
    } catch {
      showToast("Could not update wishlist", "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firstVariant) {
      navigate(`/product/${product.slug}`);
      return;
    }
    if (addingToCart) return;
    setAddingToCart(true);
    try {
      await cartApi.addItem({
        variantId: firstVariant.id,
        quantity: 1,
        sizeId: firstVariant.sizes?.[0]?.id,
        selectedImage: selectedImageForCart,
      });
      showToast("Added to cart!", "success", {
        label: "View Cart",
        href: "/cart",
      });
      navigate("/cart");
    } catch {
      showToast("Could not add to cart", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firstVariant) {
      navigate(`/product/${product.slug}`);
      return;
    }
    if (addingToCart) return;
    setAddingToCart(true);
    try {
      await cartApi.addItem({
        variantId: firstVariant.id,
        quantity: 1,
        sizeId: firstVariant.sizes?.[0]?.id,
        selectedImage: selectedImageForCart,
      });
      showToast("Added to cart!", "success", {
        label: "View Cart",
        href: "/cart",
      });
      navigate("/cart");
    } catch {
      showToast("Could not add to cart", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  const productImages =
    product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.variants &&
          product.variants.length > 0 &&
          product.variants[0]?.images &&
          Array.isArray(product.variants[0].images) &&
          product.variants[0].images.length > 0
        ? product.variants[0].images
        : [];

  const placeholderSize = compact ? 240 : 320;
  const firstImage =
    productImages.length > 0 && productImages[0]
      ? toImageUrl(productImages[0])
      : generateProductPlaceholder(product.name, placeholderSize);
  const selectedImageForCart =
    firstImage && !firstImage.startsWith("data:") ? firstImage : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden relative h-full flex flex-col
        border border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-900
        hover:shadow-2xl hover:shadow-pink-500/10 dark:hover:shadow-pink-500/5
        transition-all duration-500 ease-out ${compact ? "rounded-xl" : ""}`}
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start">
        {/* Discount Badge */}
        {hasDiscount && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 blur-md opacity-50" />
              <div className="relative bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold px-3 py-1 rounded-full text-xs shadow-lg">
                {discountPercentage}% OFF
              </div>
            </div>
          </motion.div>
        )}

        {/* Stock Status */}
        {isOutOfStock && (
          <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            Out of Stock
          </div>
        )}
      </div>

      {/* Image Area */}
      <div
        className={`relative w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 
          flex items-center justify-center overflow-hidden ${imageAspectClass || "aspect-square"} p-4`}
      >
        {/* Image Container */}
        <Link
          to={`/product/${product.slug}`}
          className="block w-full h-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full h-full">
            {/* Loading Skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 animate-pulse rounded-xl" />
            )}

            {/* Product Image */}
            <motion.img
              src={firstImage}
              alt={buildProductImageAlt({
                productName: product.name,
                categoryName: product.category?.name,
                context: "card",
              })}
              width={placeholderSize}
              height={placeholderSize}
              className={`object-contain mx-auto w-full h-full transition-all duration-700 ${
                isHovered ? "scale-110 rotate-1" : "scale-100"
              } ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.currentTarget;
                const placeholder = generateProductPlaceholder(
                  product.name,
                  placeholderSize,
                );
                if (target.src !== placeholder) {
                  target.src = placeholder;
                  setImageLoaded(true);
                }
              }}
            />
          </div>
        </Link>

        {/* Overlay Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 20,
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-center p-4"
        >
          <div className="flex gap-2">
            {showQuickView && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView?.();
                }}
                className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 rounded-full p-3 shadow-lg transition-colors"
                aria-label="Quick view"
              >
                <Eye size={20} />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart || !firstVariant}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-full p-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label="Add to cart"
            >
              {addingToCart ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShoppingCart size={20} />
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Wishlist Button */}
        <motion.button
          type="button"
          onClick={handleWishlist}
          disabled={wishlistLoading}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`absolute top-3 right-3 z-20 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-300
            ${compact ? "w-10 h-10" : "w-12 h-12"} 
            ${
              inWishlist
                ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg"
                : "bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md"
            }`}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={compact ? 18 : 20}
            className={inWishlist ? "fill-white" : ""}
          />
        </motion.button>

        {/* Logo */}
        {logoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg"
          >
            <img
              src={logoUrl}
              alt="Store Logo"
              className={compact ? "h-6 w-6" : "h-8 w-8"}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Product Info — min-w-0 so text stays inside card and truncates */}
      <div
        className={`flex flex-col flex-grow min-w-0 overflow-hidden ${compact ? "p-3" : "p-5"}`}
      >
        <div className="block flex-grow space-y-2 min-w-0">
          {/* Category and Brand */}
          <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
            {product.category && (
              <Link
                to={`/shop?categoryId=${product.category.id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center text-[11px] font-semibold text-gray-600 dark:text-gray-300 
                bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md truncate max-w-full
                hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="truncate block">{product.category.name}</span>
              </Link>
            )}

            {product.brand && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate shrink-0">
                {product.brand.name}
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link
            to={`/product/${product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="block group/title min-w-0"
          >
            <h3
              className={`font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight break-words overflow-hidden
                group-hover/title:text-pink-600 dark:group-hover/title:text-pink-400 transition-colors
                ${compact ? "text-base mb-2" : "text-lg mb-3"}`}
            >
              {product.name}
            </h3>
          </Link>

          {/* Rating with Stars */}
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full shrink-0">
              <Star size={12} fill="currentColor" />
              <span className="text-xs font-bold">
                {product.averageRating?.toFixed(1) || "0.0"}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              ({product.reviewCount || 0}
              <span className="hidden sm:inline"> reviews</span>)
            </span>
            <div className="flex-1 min-w-0" />
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
              <Zap size={12} className="text-green-500" />
              <span>{product.salesCount || 0} sold</span>
            </div>
          </div>

          {/* Pricing — price and saving stay in one line, no overflow */}
          <div className="mt-3 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
              <span
                className={`font-bold text-gray-900 dark:text-gray-100 shrink-0 ${
                  compact ? "text-xl" : "text-2xl"
                }`}
              >
                ৳{discountedPrice.toFixed(0)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400 line-through shrink-0">
                    ৳{originalPrice.toFixed(0)}
                  </span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-block shrink-0 whitespace-nowrap text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full"
                  >
                    Save ৳{(originalPrice - discountedPrice).toFixed(0)}
                  </motion.span>
                </>
              )}
            </div>

            {/* Stock Indicator */}
            {!isOutOfStock && totalStock > 0 && (
              <div className="mt-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Only {totalStock} left in stock
                </div>
                <div className="w-full min-w-0 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((totalStock / 100) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <motion.button
            onClick={handleBuyNow}
            disabled={isOutOfStock || addingToCart || !firstVariant}
            className="flex-1 whitespace-nowrap bg-gradient-to-r from-pink-500 to-rose-500
      text-white rounded-xl font-semibold py-2.5 sm:py-3 text-sm sm:text-base
      flex items-center justify-center gap-2 shadow-lg"
          >
            Buy Now
          </motion.button>

          {!showOnlyBuyNow && (
            <motion.button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart || !firstVariant}
              className="flex-1 whitespace-nowrap bg-gradient-to-r from-teal-500 to-emerald-500
        text-white rounded-xl font-semibold py-2.5 sm:py-3 text-sm sm:text-base
        flex items-center justify-center gap-2 shadow-lg"
            >
              Add to Cart
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
