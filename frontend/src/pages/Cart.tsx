import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, ShoppingCart } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import MainLayout from "@/components/templates/MainLayout";
import QuantitySelector from "@/components/molecules/QuantitySelector";
import CartSummary from "@/components/cart/CartSummary";
import PriceDisplay from "@/components/product/PriceDisplay";
import { cartApi } from "@/api/cart";
import { shippingOptionsApi, type ShippingOption } from "@/api/shippingOptions";
import { generateProductPlaceholder } from "@/utils/placeholderImage";
import { toImageUrl, mapImageUrls, getProductImage } from "@/utils/imageUrl";
import useToast from "@/hooks/useToast";
import useFormatPrice from "@/hooks/useFormatPrice";

export default function Cart() {
  const { control } = useForm();
  const { showToast } = useToast();
  const formatPrice = useFormatPrice();
  const [cartData, setCartData] = useState<any>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [freeDeliveryMinAmount, setFreeDeliveryMinAmount] = useState<number>(0);
  const [freeDeliveryProgressBarEnabled, setFreeDeliveryProgressBarEnabled] =
    useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const trackedRef = useRef(false);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    shippingOptionsApi
      .getAll()
      .then((r) => {
        setShippingOptions(r.data.data ?? []);
        setFreeDeliveryMinAmount(Number(r.data.freeDeliveryMinAmount) || 0);
        setFreeDeliveryProgressBarEnabled(
          r.data.freeDeliveryProgressBarEnabled !== false,
        );
      })
      .catch(() => setShippingOptions([]));
  }, []);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const res = await cartApi.get();
      setCartData(res.data.data);
    } catch (error: any) {
      console.error("Error loading cart:", error);
      showToast(
        error?.response?.data?.message || "Failed to load cart",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const items = cartData?.items ?? [];
    if (isLoading || items.length === 0 || trackedRef.current) return;
    trackedRef.current = true;
    cartApi.trackVisit().catch(() => {});
  }, [isLoading, cartData?.items]);

  const cartItems = cartData?.items || [];

  const subtotal = useMemo(() => {
    if (!cartItems.length) return 0;
    return cartItems.reduce(
      (sum: number, item: any) =>
        sum + (item.variant?.price ?? item.price ?? 0) * item.quantity,
      0,
    );
  }, [cartItems]);

  const handleRemoveFromCart = async (id: string) => {
    try {
      setUpdatingItems((prev) => new Set(prev).add(id));
      await cartApi.removeItem(id);
      await loadCart();
      showToast("Item removed from cart", "success");
    } catch (error: any) {
      console.error("Error removing item:", error);
      showToast(
        error?.response?.data?.message || "Failed to remove item",
        "error",
      );
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      setUpdatingItems((prev) => new Set(prev).add(id));
      await cartApi.updateItem(id, { quantity });
      await loadCart();
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      showToast(
        error?.response?.data?.message || "Failed to update quantity",
        "error",
      );
      throw error;
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Cart Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Your Cart
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}{" "}
                  in your cart
                </p>
              </div>
            </div>
          </motion.div>

          {/* Cart Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart
                  size={40}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Your cart is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Start adding products to your cart to see them here.
              </p>
              <Link
                to="/shop"
                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {cartItems.map((item: any) => {
                  // Get all images from variant and product (exact same logic as ProductDetail page)
                  const variantImages = Array.isArray(item?.variant?.images)
                    ? item.variant.images
                    : [];
                  const productImages = Array.isArray(
                    item?.variant?.product?.images,
                  )
                    ? item.variant.product.images
                    : [];

                  // Use the same image logic as ProductDetail page
                  const selectedImage = item?.selectedImage
                    ? item.selectedImage.startsWith("http") ||
                      item.selectedImage.startsWith("data:")
                      ? item.selectedImage
                      : toImageUrl(item.selectedImage)
                    : null;
                  const itemImage =
                    selectedImage ||
                    getProductImage(
                      variantImages,
                      productImages,
                      item?.variant?.product?.name || "Product",
                      120,
                    );

                  // Get image URLs for fallback
                  const allImages = [
                    ...(productImages || []),
                    ...variantImages,
                  ].filter((img, index, arr) => {
                    const imgStr = String(img || "").trim();
                    return imgStr !== "" && arr.indexOf(img) === index;
                  });
                  const imageUrls = mapImageUrls(allImages);

                  // Get variant attributes (color, etc.) - show all including color
                  const variantAttributes = Array.isArray(
                    item?.variant?.attributes,
                  )
                    ? item.variant.attributes
                    : [];

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
                        {/* Product Image - Larger and better styled */}
                        <Link
                          to={`/product/${item?.variant?.product?.slug || item?.variant?.product?.id || ""}`}
                          className="w-full sm:w-28 lg:w-32 h-28 sm:h-28 lg:h-32 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 group"
                        >
                          <img
                            src={itemImage}
                            alt={item?.variant?.product?.name || "Product"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const currentSrc = target.src;

                              // Try next image in the array if available (same as ProductDetail fallback logic)
                              if (imageUrls.length > 1) {
                                const currentIndex = imageUrls.findIndex(
                                  (url) => {
                                    const urlPath = url.split("/").pop() || "";
                                    return (
                                      url === currentSrc ||
                                      currentSrc.includes(urlPath) ||
                                      currentSrc.endsWith(urlPath)
                                    );
                                  },
                                );
                                if (
                                  currentIndex >= 0 &&
                                  currentIndex < imageUrls.length - 1
                                ) {
                                  target.src = imageUrls[currentIndex + 1];
                                  return;
                                }
                              }

                              // Fallback to placeholder if no more images
                              const placeholder = generateProductPlaceholder(
                                item?.variant?.product?.name || "Product",
                                120,
                              );
                              if (target.src !== placeholder) {
                                target.src = placeholder;
                              }
                            }}
                            onLoad={() => {
                              // Image loaded successfully
                            }}
                          />
                        </Link>

                        {/* Product Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <Link
                              to={`/product/${item?.variant?.product?.slug || item?.variant?.product?.id || ""}`}
                              className="block group"
                            >
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base lg:text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                {item?.variant?.product?.name || "Product"}
                              </h3>
                            </Link>
                            {item?.variant?.product?.brand && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Brand: {item.variant.product.brand.name}
                              </p>
                            )}
                            {item.variant?.product?.shortDescription && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1.5 line-clamp-2">
                                {item.variant.product.shortDescription}
                              </p>
                            )}
                            {/* Display Size */}
                            {(item.selectedSize ??
                              (item.variant?.sizes &&
                                item.variant.sizes.length > 0)) && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {item.selectedSize ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                                    Size: {item.selectedSize.name}
                                  </span>
                                ) : (
                                  (item.variant?.sizes ?? []).map(
                                    (size: { id: string; name: string }) => (
                                      <span
                                        key={size.id}
                                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                                      >
                                        {size.name}
                                      </span>
                                    ),
                                  )
                                )}
                              </div>
                            )}

                            {/* Display Attributes - Only show Color (the attribute selected on product page) */}
                            {variantAttributes.length > 0 &&
                              (() => {
                                // Filter to show only Color attribute (the one selected on product page)
                                const colorAttribute = variantAttributes.find(
                                  (attr: any) =>
                                    attr?.attribute?.name?.toLowerCase() ===
                                    "color",
                                );

                                // If no Color, show the first attribute as fallback
                                const displayAttribute =
                                  colorAttribute || variantAttributes[0];

                                if (!displayAttribute) return null;

                                const attrName =
                                  displayAttribute?.attribute?.name || "";
                                const attrValue =
                                  displayAttribute?.value?.value || "";
                                const isColor =
                                  attrName.toLowerCase() === "color";

                                if (!attrName || !attrValue) return null;

                                return (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <span
                                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${
                                        isColor
                                          ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                                          : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700"
                                      }`}
                                    >
                                      {attrName}: {attrValue}
                                    </span>
                                  </div>
                                );
                              })()}
                            <div className="mt-3">
                              <PriceDisplay
                                discountBadge={
                                  item.discountBadge ??
                                  item.variant?.product?.discountBadge
                                }
                                originalPrice={
                                  item.originalPrice ??
                                  item.variant?.originalPrice ??
                                  item.variant?.price ??
                                  0
                                }
                                discountedPrice={
                                  item.variant?.price ?? item.price ?? 0
                                }
                                isDiscountActive={
                                  (item.originalPrice ??
                                    item.variant?.originalPrice ??
                                    0) >
                                  (item.variant?.price ?? item.price ?? 0)
                                }
                                size="sm"
                              />
                            </div>
                          </div>

                          {/* Quantity and Actions */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Controller
                              name={`quantity-${item.variant?.id || item.id}`}
                              defaultValue={item.quantity}
                              control={control}
                              render={({ field }) => (
                                <QuantitySelector
                                  itemId={item.id}
                                  value={field.value}
                                  onChange={field.onChange}
                                  onUpdate={handleUpdateQuantity}
                                  isLoading={updatingItems.has(item.id)}
                                />
                              )}
                            />
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Subtotal
                                </p>
                                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                  {formatPrice(
                                    (item.variant?.price ?? item.price ?? 0) *
                                      item.quantity,
                                  )}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                disabled={updatingItems.has(item.id)}
                                className="p-2 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                aria-label="Remove item"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1">
                <CartSummary
                  subtotal={subtotal}
                  totalItems={cartItems.length}
                  cartId={cartData?.id}
                  shippingOptions={shippingOptions}
                  freeDeliveryMinAmount={freeDeliveryMinAmount}
                  freeDeliveryProgressBarEnabled={
                    freeDeliveryProgressBarEnabled
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
