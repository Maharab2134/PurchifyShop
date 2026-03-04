import axiosInstance from '@/utils/axiosInstance'

export interface ShippingOption {
  id: string
  name: string
  amount: number
  sortOrder: number
}

export interface ShippingOptionsRes {
  data: ShippingOption[]
  freeDeliveryMinAmount?: number
  freeDeliveryProgressBarEnabled?: boolean
}

export const shippingOptionsApi = {
  getAll: () =>
    axiosInstance.get<ShippingOptionsRes>('/shipping-options'),
}
