import axiosInstance from '@/utils/axiosInstance'

export interface PaymentMethod {
  id: number
  slug: string
  name: string
  isActive: boolean
  requiresSenderAndTxn: boolean
  /** Bank/Jolhon: show sending account number, user only enters transaction ID */
  requiresTransactionIdOnly: boolean
  charge: number
  config: {
    number: string | null
    instruction: string | null
    accountNumber: string | null
    bankName: string | null
    branch: string | null
    accountHolder: string | null
  }
}

interface PaymentMethodsRes {
  message: string
  data: PaymentMethod[]
}

export const paymentMethodsApi = {
  getAll: () =>
    axiosInstance.get<PaymentMethodsRes>('/payment-methods'),
}
