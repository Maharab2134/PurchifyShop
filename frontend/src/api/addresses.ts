import axiosInstance from '@/utils/axiosInstance'

export interface Address {
  id: string
  label: string | null
  street: string
  city: string
  state: string
  country: string
  zip: string
  createdAt?: string
  updatedAt?: string
}

export interface AddressesRes {
  data: Address[]
}

export interface AddressRes {
  message: string
  data: Address
}

export const addressesApi = {
  getAll: () => axiosInstance.get<AddressesRes>('/addresses'),

  create: (body: {
    label?: string | null
    street: string
    city: string
    state: string
    country: string
    zip: string
  }) => axiosInstance.post<AddressRes>('/addresses', body),

  update: (id: string, body: {
    label?: string | null
    street?: string
    city?: string
    state?: string
    country?: string
    zip?: string
  }) => axiosInstance.put<AddressRes>(`/addresses/${id}`, body),

  delete: (id: string) => axiosInstance.delete<{ message: string }>(`/addresses/${id}`),
}
