import axiosInstance from '@/utils/axiosInstance'

export interface Coupon {
  id: string
  code: string
  name: string
  description: string | null
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minPurchase: number
  maxDiscount: number | null
  validFrom: string
  validUntil: string
  userCouponId?: string
}

interface CouponsRes {
  message: string
  data: Coupon[]
}

interface ValidateCouponRes {
  message: string
  data: Coupon
}

export const couponsApi = {
  getMyCoupons: () => axiosInstance.get<CouponsRes>('/coupons'),
  validateCoupon: (code: string) => axiosInstance.get<ValidateCouponRes>(`/coupons/validate/${code}`),
}
