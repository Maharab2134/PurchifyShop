import axiosInstance from '@/utils/axiosInstance'
import type { Brand } from '@/api/brands'

export interface PublicBrandsResponse {
  data: {
    brands: Brand[]
    totalResults: number
    totalPages: number
    currentPage: number
    resultsPerPage: number
  }
}

export const publicBrandsApi = {
  list: (params?: { limit?: number; page?: number; search?: string }) =>
    axiosInstance.get<PublicBrandsResponse>('/brands', { params }),
}
