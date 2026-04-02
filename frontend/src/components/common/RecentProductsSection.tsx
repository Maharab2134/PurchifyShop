import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/product/ProductCard";
import { productsApi, type Product } from "@/api/products";
import { getRecentProducts } from "@/utils/recentProducts";

export default function RecentProductsSection() {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentProducts = async () => {
      try {
        const recent = getRecentProducts();

        if (recent.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch product details for recent product IDs
        const productPromises = recent.map((p) =>
          productsApi.getById(p.id).catch(() => null),
        );

        const results = await Promise.all(productPromises);
        const products = results
          .filter((r) => r !== null)
          .map((r) => r!.data.data)
          .filter((p) => p); // Products API only returns active products

        setRecentProducts(products);
      } catch (error) {
        console.error("Failed to load recent products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentProducts();
  }, []);

  if (loading || recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 sm:mt-16 lg:mt-20 pt-8 sm:pt-12 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8 text-center"
        >
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Recent Products
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Products you recently viewed
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {recentProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <ProductCard product={product} compact />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
