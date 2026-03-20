import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { HomeSection } from "@/api/homeSections";
import type { Product } from "@/api/products";

interface CategoryShowcaseProps {
  section: HomeSection;
}

interface CategoryItem {
  slug: string;
  name?: string;
  title?: string;
  viewAllLink?: string;
}

export default function CategoryShowcase({ section }: CategoryShowcaseProps) {
  const categories = (section.themeData?.categories || []) as CategoryItem[];
  const products = section.products || [];

  // Group products by category if categories are defined
  const getProductsForCategory = (categorySlug: string) => {
    return products
      .filter((p: Product) => p.category?.slug === categorySlug)
      .slice(0, 6);
  };

  if (categories.length > 0) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {section.title && (
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">
              {section.title}
            </h2>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {categories.map((category: CategoryItem, index: number) => {
              const categoryProducts = getProductsForCategory(category.slug);
              if (!categoryProducts.length) return null;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">
                      {category.name || category.title}
                    </h3>
                    {category.viewAllLink && (
                      <Link
                        to={category.viewAllLink}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        View all
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {categoryProducts.map((product: Product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        singleLineTitle
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Fallback to regular product grid if no categories
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            {section.title}
          </h2>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 8).map((product: Product) => (
            <ProductCard key={product.id} product={product} singleLineTitle />
          ))}
        </div>
      </div>
    </section>
  );
}
