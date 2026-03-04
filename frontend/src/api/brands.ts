import axiosInstance from '@/utils/axiosInstance'

const BASE = '/admin'

export interface Brand {
  id: string
  name: string
  logo: string | null
  createdAt?: string
  updatedAt?: string
}

export interface BrandsResponse {
  data: {
    brands: Brand[]
    totalResults: number
    totalPages: number
    currentPage: number
    resultsPerPage: number
  }
}

export interface BrandResponse {
  data: Brand
}

export const brandsApi = {
  getAll: (params?: { limit?: number; page?: number; search?: string }) =>
    axiosInstance.get<BrandsResponse>(`${BASE}/brands`, { params }),
  get: (id: string) => axiosInstance.get<BrandResponse>(`${BASE}/brands/${id}`),
  create: (body: { name: string; logo?: string | null }) =>
    axiosInstance.post<{ message: string; data: Brand }>(`${BASE}/brands`, body),
  update: (id: string, body: { name?: string; logo?: string | null }) =>
    axiosInstance.put<{ message: string; data: Brand }>(`${BASE}/brands/${id}`, body),
  delete: (id: string) => axiosInstance.delete<{ message: string }>(`${BASE}/brands/${id}`),
}
