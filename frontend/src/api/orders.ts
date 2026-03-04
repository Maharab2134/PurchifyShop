import axiosInstance from '@/utils/axiosInstance'

export interface OrderItem {
  id: string
  orderId: string
  variantId: string
  quantity: number
  price: number
  selectedImage?: string | null
  size?: {
    id: string
    name: string
  } | null
  variant?: {
    id: string
    sku: string
    images?: string[]
    product?: {
      id: string
      name: string
      slug: string
      shortDescription?: string | null
      description?: string | null
    } | null
  }
}

export interface Order {
  id: string
  trackingNumber?: string | null
  userId: string
  amount: number
  orderDate: string
  status: string
  orderItems?: OrderItem[]
  address?: {
    street: string
    city: string
    state: string
    country: string
    zip: string
  } | null
  shipment?: {
    carrier?: string | null
    courierCompany?: string | null
    courierTrackingId?: string | null
    dispatchDate?: string | null
    expectedDeliveryDate?: string | null
    trackingNumber?: string | null
    shippedDate?: string | null
    deliveryDate?: string | null
  } | null
  transaction?: {
    id: string
    status: string
  } | null
  payment?: {
    id: string
    method: string
    amount: number
    status: string
    senderNumber?: string | null
    transactionId?: string | null
  } | null
  shippingAmount?: number
  createdAt?: string
  updatedAt?: string
}

interface OrdersRes {
  message: string
  data: {
    orders: Order[]
    totalResults: number
    totalPages: number
    currentPage: number
    resultsPerPage: number
  }
}

interface OrderRes {
  message: string
  data: Order
}

export const ordersApi = {
  getAll: (params?: { limit?: number }) =>
    axiosInstance.get<OrdersRes>('/orders', { params }),

  getById: (id: string) => axiosInstance.get<OrderRes>(`/orders/${id}`),

  cancel: (id: string) =>
    axiosInstance.post<OrderRes>(`/orders/${id}/cancel`),

  track: (trackingNumber: string, phone: string) =>
    axiosInstance.post<OrderRes>('/track-order', {
      trackingNumber,
      phone,
    }),
}
