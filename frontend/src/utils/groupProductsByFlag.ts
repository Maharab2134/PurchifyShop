import type { Product } from '@/api/products'

export default function groupProductsByFlag(products: Product[]) {
  return {
    featured: products.filter((p) => p.isFeatured),
    trending: products.filter((p) => p.isTrending),
    newArrivals: products.filter((p) => p.isNew),
    bestSellers: products.filter((p) => p.isBestSeller),
  }
}
