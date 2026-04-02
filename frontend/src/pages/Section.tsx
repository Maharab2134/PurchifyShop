import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Package } from "lucide-react";
import MainLayout from "@/components/templates/MainLayout";
import ProductCard from "@/components/product/ProductCard";
import { homeSectionsApi, type HomeSection } from "@/api/homeSections";
import type { Product } from "@/api/products";

/**
 * Section page: View More for admin-created Home Sections only.
 * No built-in Featured / Trending / New Arrivals / Best Sellers.
 * Resolves section by slug from Home Sections API. No dummy data or text.
 */
export default function Section() {
  const { slug } = useParams<{ slug: string }>();
  const [section, setSection] = useState<HomeSection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Section not found");
      return;
    }

    setLoading(true);
    setError(null);
    homeSectionsApi
      .getBySlug(slug)
      .then((s) => {
        if (s) {
          setSection(s);
          setProducts(s.products ?? []);
        } else {
          setSection(null);
          setProducts([]);
          setError("Section not found");
        }
      })
      .catch((e) => {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Failed to load section";
        setError(msg);
        setSection(null);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const title = section?.name ?? slug ?? "";

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {title && (
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 capitalize mb-8 text-center">
            {title}
          </h1>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg aspect-[4/5] animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
            <Link
              to="/"
              className="inline-block mt-4 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Back to Home
            </Link>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {products.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} compact />
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
