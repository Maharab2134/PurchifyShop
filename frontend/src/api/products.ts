import axiosInstance from '@/utils/axiosInstance'

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription?: string | null
  salesCount: number
  isNew: boolean
  isFeatured: boolean
  isTrending: boolean
  isBestSeller: boolean
  averageRating: number
  reviewCount: number
  discountPercent?: number
  categoryId: string | null
  category?: { id: string; name: string; slug: string } | null
  subcategoryId?: string | null
  subcategory?: { id: string; name: string; slug: string } | null
  brandId?: string | null
  brand?: { id: string; name: string; logo: string | null } | null
  images?: string[]
  variants?: ProductVariant[]
  reviews?: Review[]
  createdAt?: string
  updatedAt?: string
  originalPrice?: number
  discountedPrice?: number
  discountBadge?: string | null
  isDiscountActive?: boolean
  isOutOfStock?: boolean
  totalStock?: number
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string
  images: string[]
  /** Display price (discounted when active) */
  price: number
  stock: number
  lowStockThreshold: number
  barcode?: string | null
  warehouseLocation?: string | null
  attributes?: VariantAttribute[]
  product?: { id: string; name: string; slug: string } | null
  originalPrice?: number
  discountBadge?: string | null
  isDiscountActive?: boolean
  sizes?: Array<{ id: string; name: string }>
}

export interface VariantAttribute {
  attribute: { id: string; name: string; slug: string }
  value: { id: string; value: string; slug: string }
}

export interface Review {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string | null
  user?: { id: string; name: string; avatar: string | null }
  createdAt: string
}

interface ProductsRes {
  message: string
  data: {
    products: Product[]
    totalResults: number
    totalPages: number
    currentPage: number
    resultsPerPage: number
  }
}

interface ProductRes {
  message: string
  data: Product
}

interface RelatedRes {
  message: string
  data: Product[]
}

export const productsApi = {
  getAll: (params?: {
    page?: number
    limit?: number
    categoryId?: string
    search?: string
    sort?: string
    dir?: string
    minPrice?: number
    maxPrice?: number
    minRating?: number
    is_featured?: boolean
    is_new?: boolean
    is_trending?: boolean
    is_best_seller?: boolean
  }) => axiosInstance.get<ProductsRes>('/products', { params }),

  getBySlug: (slug: string) => axiosInstance.get<ProductRes>(`/products/slug/${slug}`),

  getById: (id: string) => axiosInstance.get<ProductRes>(`/products/${id}`),

  getRelated: (id: string) => axiosInstance.get<RelatedRes>(`/products/${id}/related`),
}
