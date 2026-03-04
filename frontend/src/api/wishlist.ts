import axiosInstance from '@/utils/axiosInstance'

export interface WishlistProduct {
  id: string
  name: string
  slug: string
  images: string[]
  category: { id: string; name: string; slug: string } | null
  price: number
  wishlistId: string
}

export interface WishlistData {
  products: WishlistProduct[]
  productIds: string[]
}

interface WishlistRes {
  message: string
  data: WishlistData
}

export const wishlistApi = {
  get: () => axiosInstance.get<WishlistRes>('/wishlist'),
  add: (productId: string) =>
    axiosInstance.post<{ message: string }>('/wishlist', { productId }),
  remove: (productId: string) =>
    axiosInstance.delete<{ message: string }>(`/wishlist/${productId}`),
}
