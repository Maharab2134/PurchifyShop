import axiosInstance from '@/utils/axiosInstance'

export interface Subcategory {
  id: string
  categoryId: string
  category?: { id: string; name: string } | null
  slug: string
  name: string
  description: string | null
  shortDescription?: string | null
  images: string[]
  productsCount?: number
}

interface SubcategoriesRes {
  message: string
  data: { subcategories: Subcategory[] }
}

interface SubcategoryRes {
  message: string
  data: Subcategory
}

export const subcategoriesApi = {
  getAll: (params?: { categoryId?: string }) => axiosInstance.get<SubcategoriesRes>('/subcategories', { params }),
  getById: (id: string) => axiosInstance.get<SubcategoryRes>(`/subcategories/${id}`),
}
