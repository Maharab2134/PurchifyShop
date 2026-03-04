import axiosInstance from '@/utils/axiosInstance'

export interface CartItem {
  id: string
  cartId: string
  variantId: string
  sizeId?: string | null
  selectedSize?: { id: string; name: string } | null
  selectedImage?: string | null
  quantity: number
  price: number
  originalPrice?: number
  discountBadge?: string | null
  variant: {
    id: string
    sku: string
    price: number
    originalPrice?: number
    stock: number
    images: string[]
    attributes?: Array<{
      attribute: {
        id: string
        name: string
      }
      value: {
        id: string
        value: string
      }
    }>
    sizes?: Array<{ id: string; name: string }>
    product: {
      id: string
      name: string
      slug: string
      shortDescription?: string | null
      images?: string[]
      discountedPrice?: number
      originalPrice?: number
      discountBadge?: string | null
      isOutOfStock?: boolean
    } | null
  }
}

export interface Cart {
  id: string
  userId: string | null
  sessionId: string | null
  status: string
  items: CartItem[]
  total: number
  itemCount: number
}

interface CartRes {
  data: Cart
}

export const cartApi = {
  get: () => axiosInstance.get<CartRes>('/cart'),

  addItem: (body: { variantId: string; quantity: number; sizeId?: string | null; selectedImage?: string | null }) =>
    axiosInstance.post<CartRes>('/cart/items', body),

  updateItem: (id: string, body: { quantity: number }) =>
    axiosInstance.patch<CartRes>(`/cart/items/${id}`, body),

  removeItem: (id: string) => axiosInstance.delete<CartRes>(`/cart/items/${id}`),

  /** Track cart/checkout visit for incomplete-orders (admin). No auth required; uses X-Cart-Session-ID for guests. */
  trackVisit: () =>
    axiosInstance.post<{ message: string }>('/incomplete-orders/track'),
}
