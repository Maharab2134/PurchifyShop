import axiosInstance from '@/utils/axiosInstance'

export interface Review {
  id: string
  userId: string
  productId: string
  rating: number
  comment: string | null
  user?: { id: string; name: string; avatar: string | null }
  createdAt: string
}

interface ReviewRes {
  message: string
  data: Review
}

interface ReviewsListRes {
  message: string
  data: Review[]
}

export const reviewsApi = {
  getByProductId: (productId: string) =>
    axiosInstance.get<ReviewsListRes>(`/products/${productId}/reviews`),
  create: (body: { productId: string; rating: number; comment?: string }) =>
    axiosInstance.post<ReviewRes>('/reviews', body),
}
