import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Share2, AlertCircle } from "lucide-react";
import MainLayout from "@/components/templates/MainLayout";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductReviews from "@/components/product/ProductReviews";
import { productsApi, type Product, type ProductVariant } from "@/api/products";
import { reviewsApi, type Review } from "@/api/reviews";
import { categoriesApi } from "@/api/categories";
import { generateProductPlaceholder } from "@/utils/placeholderImage";
import { toImageUrl, mapImageUrls } from "@/utils/imageUrl";
import ProductSection from "@/components/product/ProductSection";
import { chatApi } from "@/api/chat";
import { useAuth } from "@/hooks/useAuth";
import useToast from "@/hooks/useToast";
import { buildProductHeadings } from "@/utils/seo";

/** Ascending order for letter sizes: XS, S, M, L, XL, XXL, etc. */
const SIZE_ORDER = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
];

function sortSizesAsc<T extends { name: string }>(sizes: T[]): T[] {
  const key = (s: T) => {
    const name = String(s.name).trim();
    const letterIndex = SIZE_ORDER.findIndex(
      (x) => x.toUpperCase() === name.toUpperCase(),
    );
    if (letterIndex >= 0) return [0, letterIndex, name] as const;
    if (/^\d+(\.\d+)?$/.test(name)) return [1, parseFloat(name), name] as const;
    return [2, 0, name] as const;
  };
  return [...sizes].sort((a, b) => {
    const [ta, va, na] = key(a);
    const [tb, vb, nb] = key(b);
    if (ta !== tb) return ta - tb;
    if (va !== vb) return va < vb ? -1 : 1;
    return na.localeCompare(nb);
  });
}

// Description & Reviews Tabs Component
function ProductDescriptionTabs({
  description,
  reviews,
  productId,
  onReviewAdded,
}: {
  description: string;
  reviews: Review[];
  productId: string;
  onReviewAdded: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description",
  );

  return (
    <div className="w-full">
      {/* Tabs Header - Improved styling */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2 px-4 sm:px-6 pt-4">
          <button
            onClick={() => setActiveTab("description")}
            className={`px-4 sm:px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === "description"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 sm:px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === "reviews"
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-4 sm:p-6 lg:p-8">
        {activeTab === "description" && (
          <div className="product-description prose prose-sm sm:prose-base max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
            {description.trim() ? (
              <div
                dangerouslySetInnerHTML={{ __html: description }}
                className="[&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-2
                  dark:[&_*]:text-gray-300! dark:[&_h1]:text-gray-100! dark:[&_h2]:text-gray-100! dark:[&_h3]:text-gray-100! dark:[&_h4]:text-gray-100! dark:[&_h5]:text-gray-100! dark:[&_h6]:text-gray-100!
                  dark:[&_strong]:text-gray-200! dark:[&_b]:text-gray-200!"
              />
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No description available.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <ProductReviews
            reviews={reviews}
            productId={productId}
            onReviewAdded={onReviewAdded}
          />
        )}
      </div>
    </div>
  );
}

// Loading Skeleton Component
function ProductDetailSkeleton() {
  return (
    <div className="py-8 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image gallery skeleton */}
          <div className="space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-[400px] lg:h-[500px]"></div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20"
                ></div>
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-6">
            <div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>

            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>

            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>

            <div className="space-y-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [sharingToChat, setSharingToChat] = useState(false);
  const [category, setCategory] = useState<{
    id: string;
    name: string;
    slug: string;
  } | null>(null);

  useEffect(() => {
    if (!slug) {
      setError(new Error("Product slug is required"));
      setLoading(false);
      return;
    }

    Promise.all([productsApi.getBySlug(slug)])
      .then(([{ data: productData }]) => {
        const product = productData.data;
        if (!product || !product.name) {
          throw new Error("Product data is invalid or missing name");
        }

        setProduct(product);

        // Track recently viewed product
        if (product.id && product.slug && product.name) {
          import("@/utils/recentProducts")
            .then((module) => {
              module.addRecentProduct({
                id: product.id,
                slug: product.slug,
                name: product.name,
              });
            })
            .catch(() => {
              // Silently fail if tracking fails
            });
        }

        // Fetch category if needed
        if (!product.category && product.categoryId) {
          categoriesApi
            .getById(product.categoryId)
            .then(({ data }) => {
              setCategory({
                id: data.data.id,
                name: data.data.name,
                slug: data.data.slug,
              });
            })
            .catch(() => {
              // Category not found - ignore
            });
        } else if (product.category) {
          setCategory(product.category);
        } else {
          setCategory(null);
        }

        // Reset selections
        setSelectedAttributes({});
        setSelectedSizeId(null);

        // Set initial variant
        const variants = product.variants || [];
        if (variants.length > 0) {
          const sizes = variants.flatMap((v) => v.sizes || []);
          const uniqueSizes = Array.from(
            new Map(sizes.map((s) => [s.id, s])).values(),
          );

          if (uniqueSizes.length === 0) {
            setSelectedVariant(variants[0]);
          } else if (uniqueSizes.length === 1) {
            const sizeId = uniqueSizes[0].id;
            setSelectedSizeId(sizeId);
            const variantsWithSize = variants.filter((v) =>
              (v.sizes || []).some((s) => s.id === sizeId),
            );
            const inStockVariant = variantsWithSize.find(
              (v) => (v.stock ?? 0) > 0,
            );
            setSelectedVariant(
              inStockVariant || variantsWithSize[0] || variants[0],
            );
          }
        }

        // Fetch reviews
        return reviewsApi.getByProductId(product.id);
      })
      .then(({ data: reviewsData }) => {
        setReviews(reviewsData.data || []);
      })
      .catch((e) => {
        setError(e as Error);
        if ((e as any).response?.status === 404) {
          navigate("/404");
        }
      })
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  useEffect(() => {
    if (!product?.id) return;
    setRelatedLoading(true);
    productsApi
      .getRelated(product.id)
      .then(({ data }) => {
        const products = Array.isArray(data.data) ? data.data : [];
        setRelatedProducts(products);
      })
      .catch(() => setRelatedProducts([]))
      .finally(() => setRelatedLoading(false));
  }, [product?.id]);

  if (loading) {
    return (
      <MainLayout>
        <ProductDetailSkeleton />
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {error ? "Error Loading Product" : "Product Not Found"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error?.message ||
                "The product you are looking for does not exist."}
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Browse Products
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const attributeGroups = (product.variants || []).reduce(
    (acc, variant) => {
      const hasSelections = Object.values(selectedAttributes).some(
        (value) => value !== "",
      );
      const matchesSelections = hasSelections
        ? Object.entries(selectedAttributes).every(
            ([attrName, attrValue]) =>
              attrName === "" ||
              variant.attributes?.some(
                (attr) =>
                  attr.attribute.name === attrName &&
                  attr.value.value === attrValue,
              ),
          )
        : true;

      if (matchesSelections) {
        variant.attributes?.forEach(({ attribute, value }) => {
          if (!acc[attribute.name]) {
            acc[attribute.name] = { values: new Set<string>() };
          }
          acc[attribute.name].values.add(value.value);
        });
      }
      return acc;
    },
    {} as Record<string, { values: Set<string> }>,
  );

  const variants = product.variants || [];
  const sizeList = variants.flatMap((v) => v.sizes || []);
  const availableSizes = sortSizesAsc(
    Array.from(new Map(sizeList.map((s) => [s.id, s])).values()),
  );

  const resetSelections = () => {
    setSelectedAttributes({});
    setSelectedSizeId(null);
    setSelectedVariant(variants[0] || null);
  };

  const handleSizeSelect = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    const withSize = variants.filter((v) =>
      (v.sizes || []).some((s) => s.id === sizeId),
    );
    const sorted = [...withSize].sort((a, b) => a.id.localeCompare(b.id));
    const inStock = sorted.find((v) => v.stock > 0);
    setSelectedVariant(inStock || sorted[0] || null);
  };

  const handleVariantChange = (attributeName: string, value: string) => {
    const newSelections = { ...selectedAttributes, [attributeName]: value };
    setSelectedAttributes(newSelections);

    const variant = variants.find((v) =>
      Object.entries(newSelections).every(
        ([attrName, attrValue]) =>
          attrName === "" ||
          v.attributes?.some(
            (attr) =>
              attr.attribute.name === attrName &&
              attr.value.value === attrValue,
          ),
      ),
    );
    setSelectedVariant(variant || null);
  };

  const handleReviewAdded = () => {
    if (product) {
      // Refresh product to get updated rating/count
      productsApi.getBySlug(slug!).then(({ data }) => {
        setProduct(data.data);
      });
      // Refresh reviews list
      reviewsApi.getByProductId(product.id).then(({ data }) => {
        setReviews(data.data || []);
      });
    }
  };

  const handleShareToChat = async () => {
    if (!isAuthenticated) {
      showToast("Please sign in to share product", "error");
      navigate("/sign-in");
      return;
    }

    if (!product) return;

    setSharingToChat(true);
    try {
      const chats = await chatApi.list();
      let chat = chats.length > 0 ? chats[0] : await chatApi.create();

      await chatApi.sendMessage(chat.id, {
        type: "PRODUCT",
        productId: product.id,
        content: `Check out this product: ${product.name}`,
      });

      showToast("Product shared to support chat", "success");
      navigate("/contact-support");
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Failed to share product",
        "error",
      );
    } finally {
      setSharingToChat(false);
    }
  };

  const headings = buildProductHeadings(
    product.name || "Product",
    category?.name || product.category?.name,
  );
  const defaultProductImage = selectedVariant?.images?.[0]
    ? toImageUrl(selectedVariant.images[0])
    : product.images?.[0]
      ? toImageUrl(product.images[0])
      : product.variants?.[0]?.images?.[0]
        ? toImageUrl(product.variants[0].images[0])
        : generateProductPlaceholder(product.name || "Product");
  const productImage = selectedImage || defaultProductImage;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sr-only">
          <h2>{headings.h2}</h2>
          <h3>{headings.h3}</h3>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Product Main Section */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Product Image Gallery */}
            <div className="lg:w-1/2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <ProductImageGallery
                  images={mapImageUrls(
                    [
                      ...(product.images || []),
                      ...(product.variants || []).flatMap(
                        (v) => v.images || [],
                      ),
                    ].filter((img, index, arr) => arr.indexOf(img) === index),
                  )}
                  defaultImage={defaultProductImage}
                  name={product.name || "Product"}
                  categoryName={category?.name || product.category?.name}
                  onImageSelect={setSelectedImage}
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:w-1/2 relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
                {/* Share Button */}
                <button
                  onClick={handleShareToChat}
                  disabled={sharingToChat}
                  className="
  absolute 
  top-22 right-7 
  sm:top-25 sm:right-12 
  z-20 
  p-2.5 
  bg-indigo-600 hover:bg-indigo-700 
  text-white 
  rounded-lg 
  shadow-lg
"
                  title="Share product to support chat"
                  aria-label="Share product to support chat"
                >
                  <Share2
                    size={22}
                    className={`${sharingToChat ? "animate-spin" : ""}`}
                  />
                </button>

                <ProductInfo
                  id={product.id}
                  name={product.name || "Product"}
                  averageRating={product.averageRating}
                  reviewCount={product.reviewCount}
                  shortDescription={product.shortDescription ?? ""}
                  brand={product.brand}
                  variants={variants}
                  selectedVariant={selectedVariant}
                  onVariantChange={handleVariantChange}
                  attributeGroups={attributeGroups}
                  selectedAttributes={selectedAttributes}
                  resetSelections={resetSelections}
                  availableSizes={availableSizes}
                  selectedSizeId={selectedSizeId}
                  onSizeSelect={handleSizeSelect}
                  productImage={productImage}
                />
              </div>
            </div>
          </div>

          {/* Description & Reviews Tabs */}
          <div className="mt-6 lg:mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <ProductDescriptionTabs
                description={product.description ?? ""}
                reviews={reviews}
                productId={product.id}
                onReviewAdded={handleReviewAdded}
              />
            </div>
          </div>

          {/* Related Products */}
          <section className="mt-8 lg:mt-12">
            <div className="mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100">
                Related Products
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Explore similar products you might like
              </p>
            </div>

            {relatedLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : relatedProducts.length > 0 ? (
              <ProductSection
                title="Related Products"
                products={relatedProducts}
                loading={false}
                error={null}
                showTitle={false}
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No related products found.
                </p>
                <Link
                  to="/shop"
                  className="mt-4 inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                >
                  Browse all products
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
