import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Rating from "@/components/feedback/Rating";
import PriceDisplay from "@/components/product/PriceDisplay";
import { Palette, Ruler, Info, Package, Check, X, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cartApi } from "@/api/cart";
import { wishlistApi } from "@/api/wishlist";
import { useAuth } from "@/hooks/useAuth";
import useToast from "@/hooks/useToast";
import AddToCartPopup from "@/components/cart/AddToCartPopup";
import type { ProductVariant } from "@/api/products";
import { getColorDisplayName, getColorSwatchValue } from "@/utils/colorSwatch";

interface ProductInfoProps {
  id: string;
  name: string;
  averageRating: number;
  reviewCount: number;
  shortDescription: string;
  brand?: { id: string; name: string; logo: string | null } | null;
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantChange: (attributeName: string, value: string) => void;
  attributeGroups: Record<string, { values: Set<string> }>;
  selectedAttributes: Record<string, string>;
  resetSelections: () => void;
  availableSizes?: Array<{ id: string; name: string }>;
  selectedSizeId?: string | null;
  onSizeSelect?: (sizeId: string) => void;
  productImage?: string | null;
}

export default function ProductInfo({
  id: productId,
  name,
  averageRating,
  reviewCount,
  shortDescription: _shortDescription,
  brand,
  variants,
  selectedVariant,
  onVariantChange,
  attributeGroups,
  selectedAttributes,
  resetSelections,
  availableSizes = [],
  selectedSizeId = null,
  onSizeSelect,
  productImage,
}: ProductInfoProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [addToCartPopupOpen, setAddToCartPopupOpen] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !productId) {
      setInWishlist(false);
      return;
    }
    wishlistApi
      .get()
      .then((res) => {
        const ids = res.data?.data?.productIds ?? [];
        setInWishlist(ids.includes(productId));
      })
      .catch(() => setInWishlist(false));
  }, [isAuthenticated, productId]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (sizeRequired) {
      showToast("Please select a size", "error");
      return;
    }
    if (!selectedVariant) {
      showToast("Please select a valid variant", "error");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      await cartApi.addItem({
        variantId: selectedVariant.id,
        quantity: 1,
        sizeId: selectedSizeId ?? undefined,
        selectedImage: selectedImageForCart,
      });
      setAddToCartPopupOpen(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to add to cart";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (sizeRequired) {
      showToast("Please select a size", "error");
      return;
    }
    if (!selectedVariant || !stock) return;
    if (buyNowLoading) return;
    setBuyNowLoading(true);
    try {
      await cartApi.addItem({
        variantId: selectedVariant.id,
        quantity: 1,
        sizeId: selectedSizeId ?? undefined,
        selectedImage: selectedImageForCart,
      });
      showToast("Added to cart!", "success", {
        label: "View Cart",
        href: "/cart",
      });
      navigate("/cart");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to add to cart";
      showToast(msg, "error");
    } finally {
      setBuyNowLoading(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/sign-in");
      return;
    }
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistApi.remove(productId);
        setInWishlist(false);
        showToast("Removed from wishlist", "success");
      } else {
        await wishlistApi.add(productId);
        setInWishlist(true);
        showToast("Added to wishlist!", "success");
      }
      window.dispatchEvent(new Event("wishlist:updated"));
    } catch {
      showToast("Could not update wishlist", "error");
    } finally {
      setWishlistLoading(false);
    }
  };

  const activeVariant = selectedVariant ?? variants[0] ?? null;
  const price = activeVariant?.price ?? 0;
  const originalPrice = activeVariant?.originalPrice ?? price;
  const stock = activeVariant ? activeVariant.stock : 0;
  const selectedImageForCart =
    productImage && !productImage.startsWith("data:")
      ? productImage
      : undefined;

  const hasSizes = availableSizes.length > 0;
  const sizeRequired = hasSizes && !selectedSizeId;

  const colorValues = new Set<string>();
  const sizeValues = new Set<string>();
  variants.forEach((variant) => {
    variant.attributes?.forEach(({ attribute, value }) => {
      if (attribute.name.toLowerCase() === "color") {
        colorValues.add(value.value);
      } else if (attribute.name.toLowerCase() === "size") {
        sizeValues.add(value.value);
      }
    });
  });

  const attributeSummary = Object.entries(attributeGroups)
    .map(([attrName, { values }]) => {
      const isColorAttr = attrName.toLowerCase() === "color";
      const valueList = Array.from(values)
        .map((value) => (isColorAttr ? getColorDisplayName(value) : value))
        .join(", ");
      return `${attrName.charAt(0).toUpperCase() + attrName.slice(1)}: ${valueList}`;
    })
    .join("; ");

  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6 relative">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {name && (
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-100 flex-1 pr-16 sm:pr-20">
            {name}
          </h1>
        )}
      </div>

      {/* Wishlist Button - positioned absolutely in top-right */}
      <button
        type="button"
        onClick={handleWishlist}
        disabled={wishlistLoading}
        className={`absolute top-3 sm:top-4 right-3 sm:right-4 z-10 p-2 sm:p-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          inWishlist
            ? "bg-red-500 hover:bg-red-600 text-white border-2 border-red-500"
            : "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-400 dark:hover:border-red-400 hover:text-red-500 dark:hover:text-red-400"
        }`}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          size={16}
          className={`sm:w-[18px] sm:h-[18px] ${inWishlist ? "fill-current" : ""}`}
        />
      </button>

      {brand && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Brand:{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {brand.name}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <Rating rating={averageRating} />
        <span>({reviewCount || 0})</span>
        <span
          className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
            stock > 0
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
              : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
          }`}
        >
          {stock > 0 ? `${stock} in stock` : "Out of stock"}
        </span>
      </div>

      <div>
        <PriceDisplay
          discountBadge={activeVariant?.discountBadge}
          originalPrice={originalPrice}
          discountedPrice={price}
          isDiscountActive={activeVariant?.isDiscountActive}
          size="xl"
        />
      </div>

      <div className="space-y-3">
        {colorValues.size > 0 && (
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              Available in {colorValues.size}{" "}
              {colorValues.size === 1 ? "color" : "colors"}
            </span>
          </div>
        )}

        {sizeValues.size > 0 && (
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              Available in {sizeValues.size}{" "}
              {sizeValues.size === 1 ? "size" : "sizes"}
            </span>
          </div>
        )}

        {attributeSummary && (
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">
              {attributeSummary}
            </span>
          </div>
        )}

        {!hasSizes &&
          colorValues.size === 0 &&
          sizeValues.size === 0 &&
          !attributeSummary && (
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                No options available
              </span>
            </div>
          )}
      </div>

      {hasSizes && onSizeSelect && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
            Size
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((s) => {
              const withSize = variants.filter((v) =>
                (v.sizes || []).some((x) => x.id === s.id),
              );
              const inStock = withSize.some((v) => v.stock > 0);
              const isSelected = selectedSizeId === s.id;
              return (
                <motion.button
                  key={s.id}
                  type="button"
                  onClick={() => inStock && onSizeSelect(s.id)}
                  disabled={!inStock}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-lg"
                      : inStock
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed line-through"
                  }`}
                  whileHover={inStock ? { scale: 1.02 } : {}}
                  whileTap={inStock ? { scale: 0.98 } : {}}
                >
                  {s.name}
                </motion.button>
              );
            })}
          </div>
          {sizeRequired && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Please select a size to add to cart.
            </p>
          )}
        </div>
      )}

      {/* Attribute options (Color, etc.) - no "Attributes" heading */}
      {Object.keys(attributeGroups).length > 0 && (
        <div className="space-y-6">
          {Object.entries(attributeGroups).map(
            ([attributeName, { values }]) => {
              const isColor = attributeName.toLowerCase() === "color";
              const isSize = attributeName.toLowerCase() === "size";
              const valuesArray = Array.from(values);

              return (
                <div key={attributeName} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                      {attributeName}
                    </label>
                    {selectedAttributes[attributeName] && (
                      <button
                        onClick={() => onVariantChange(attributeName, "")}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
                      >
                        <X size={12} />
                        Clear
                      </button>
                    )}
                  </div>

                  {isColor ? (
                    <div className="flex flex-wrap gap-3">
                      {valuesArray.map((value) => {
                        const isSelected =
                          selectedAttributes[attributeName] === value;
                        const colorValue = getColorSwatchValue(value);
                        const displayValue = getColorDisplayName(value);
                        const isWhite =
                          colorValue.toLowerCase() === "#ffffff" ||
                          colorValue.toLowerCase() === "#fff";

                        return (
                          <motion.button
                            key={value}
                            onClick={() =>
                              onVariantChange(attributeName, value)
                            }
                            className={`relative group ${
                              isSelected
                                ? "ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-2 dark:ring-offset-gray-800"
                                : "ring-1 ring-gray-200 dark:ring-gray-600 hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-500"
                            } rounded-full transition-all duration-200`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: colorValue }}
                            >
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="text-white"
                                >
                                  <Check size={16} />
                                </motion.div>
                              )}
                            </div>
                            {isWhite && (
                              <div className="absolute inset-0 rounded-full border border-gray-300 dark:border-gray-600" />
                            )}
                            <span className="sr-only">{displayValue}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : isSize ? (
                    <div className="flex flex-wrap gap-2">
                      {valuesArray.map((value) => {
                        const isSelected =
                          selectedAttributes[attributeName] === value;
                        const isOutOfStock = !variants.some(
                          (variant) =>
                            variant.attributes?.some(
                              (attr) =>
                                attr.attribute.name === attributeName &&
                                attr.value.value === value,
                            ) && variant.stock > 0,
                        );

                        return (
                          <motion.button
                            key={value}
                            onClick={() =>
                              !isOutOfStock &&
                              onVariantChange(attributeName, value)
                            }
                            disabled={isOutOfStock}
                            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-lg"
                                : isOutOfStock
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed line-through"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
                            }`}
                            whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
                            whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                          >
                            {value}
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {valuesArray.map((value) => {
                        const isSelected =
                          selectedAttributes[attributeName] === value;
                        return (
                          <motion.button
                            key={value}
                            onClick={() =>
                              onVariantChange(attributeName, value)
                            }
                            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                              isSelected
                                ? "bg-indigo-600 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {value}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {selectedAttributes[attributeName] && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span className="font-medium">Selected:</span>
                      <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md">
                        {selectedAttributes[attributeName]}
                      </span>
                    </motion.div>
                  )}
                </div>
              );
            },
          )}

          {Object.keys(selectedAttributes).length > 0 && (
            <motion.button
              onClick={resetSelections}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-500 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X size={16} />
              Reset All Selections
            </motion.button>
          )}
        </div>
      )}

      <div className="space-y-3">
        <button
          disabled={!stock || loading || !selectedVariant || sizeRequired}
          onClick={handleAddToCart}
          className={`w-full py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base font-semibold text-white rounded-lg sm:rounded-xl transition-all duration-300 ${
            loading || !stock || !selectedVariant || sizeRequired
              ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adding to Cart...
            </div>
          ) : stock > 0 && selectedVariant && !sizeRequired ? (
            "Add to Cart"
          ) : sizeRequired ? (
            "Select a size"
          ) : (
            "Select a Variant"
          )}
        </button>
        <button
          type="button"
          disabled={!stock || !selectedVariant || sizeRequired || buyNowLoading}
          onClick={handleBuyNow}
          className={`w-full py-2.5 sm:py-3 lg:py-4 text-sm sm:text-base font-semibold border-2 rounded-lg sm:rounded-xl transition-all duration-300 ${
            stock && selectedVariant && !sizeRequired && !buyNowLoading
              ? "border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:shadow-lg transform hover:scale-[1.02]"
              : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          {buyNowLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Adding...
            </span>
          ) : (
            "Buy Now"
          )}
        </button>
      </div>
      <AddToCartPopup
        open={addToCartPopupOpen}
        onClose={() => setAddToCartPopupOpen(false)}
        productName={name}
        productImage={productImage}
      />
    </div>
  );
}
