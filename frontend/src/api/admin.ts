import axiosInstance from "@/utils/axiosInstance";

const BASE = "/admin";

export interface AdminAnalytics {
  ordersTotal: number;
  ordersCount: number;
  refundedOrdersTotal?: number;
  refundedOrdersCount?: number;
  usersCount: number;
  productsCount: number;
  vendorsCount?: number;
  recentOrders: Array<{
    id: string;
    userId: string;
    amount: number;
    orderDate: string;
    status: string;
    user: { id: string; name: string; email: string } | null;
  }>;
  salesPerDay?: Array<{ date: string; sales: number }>;
  mostSoldProducts?: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
  }>;
  popularCustomers?: Array<{
    userId: string | null;
    name: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }>;
  lowStockItems?: Array<{
    variantId: string;
    productId: string;
    productName: string;
    sku: string;
    stock: number;
    lowStockThreshold: number;
  }>;
  visitors?: {
    dailyVisitors: Array<{ date: string; visitors: number }>;
    dailyPageViews: Array<{ date: string; views: number }>;
    topPages: Array<{ path: string; views: number }>;
    days: number;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string | null;
  roleModel?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
  isActive?: boolean;
  avatar?: string | null;
  createdAt?: string;
}

export interface AdminAttribute {
  id: string;
  name: string;
  slug: string;
  values: Array<{ id: string; value: string; slug: string }>;
}

export interface AdminTransaction {
  id: string;
  orderId: string;
  status: string;
  transactionDate: string | null;
  order?: {
    id: string;
    amount: number;
    user: { id: string; name: string; email: string } | null;
  } | null;
  payment?: {
    id: string;
    method: string;
    amount: number;
    status: string;
    senderNumber?: string | null;
    transactionId?: string | null;
  } | null;
}

export interface AdminOrder {
  id: string;
  trackingNumber: string | null;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  contactPhone?: string | null;
  amount: number;
  shipment?: {
    carrier?: string | null;
    courierCompany?: string | null;
    courierTrackingId?: string | null;
    steadfastConsignmentId?: number | null;
    weight?: number | null;
  } | null;
  parcelWeight?: number | null;
  shippingAmount: number;
  status: string;
  orderDate: string;
  createdAt?: string;
  transactionStatus: string | null;
  payment?: {
    id: string;
    method: string;
    amount: number;
    status: string;
    senderNumber?: string | null;
    transactionId?: string | null;
  } | null;
}

export interface AdminOrderDetail extends AdminOrder {
  updatedAt?: string;
  shippingOption?: { id: string; name: string; amount: number } | null;
  contactPhone?: string | null;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    label?: string | null;
  } | null;
  payment?: {
    id: string;
    method: string;
    amount: number;
    status: string;
    senderNumber?: string | null;
    transactionId?: string | null;
  } | null;
  transaction?: {
    id: string;
    status: string;
    transactionDate?: string | null;
  } | null;
  shipment?: {
    id: string;
    carrier?: string | null;
    courierCompany?: string | null;
    courierTrackingId?: string | null;
    steadfastConsignmentId?: number | null;
    dispatchDate?: string | null;
    expectedDeliveryDate?: string | null;
    trackingNumber?: string | null;
    shippedDate?: string | null;
    deliveryDate?: string | null;
  } | null;
  orderItems: Array<{
    id: string;
    variantId: string;
    sizeId?: string | null;
    quantity: number;
    price: number;
    selectedImage?: string | null;
    variant?: {
      id: string;
      sku: string;
      images?: string[];
      product?: {
        id: string;
        name: string;
        slug: string;
        images?: string[];
        shortDescription?: string | null;
        description?: string | null;
        brand?: { id: string; name: string; slug?: string } | null;
      } | null;
      attributes?: Array<{
        attribute?: { name: string };
        value?: string | { value?: string };
      }> | null;
    } | null;
    size?: { id: string; name: string } | null;
  }>;
}

export interface AdminLog {
  id: number;
  level: string;
  message: string;
  context: unknown;
  createdAt: string;
}

export interface AdminRecentActivity {
  id: number;
  level: string;
  message: string;
  context: unknown;
  createdAt: string;
}

export interface AdminRecentVisitor {
  sessionId: string;
  ipAddress: string | null;
  location: string | null;
  device: string;
  browser: string;
  time: string;
  pages: number;
  actions: number;
  lastPath: string | null;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription?: string | null;
  categoryId: string | null;
  category?: { id: string; name: string; slug: string } | null;
  subcategoryId?: string | null;
  subcategory?: { id: string; name: string; slug: string } | null;
  vendorId?: string | null;
  images: string[];
  suggestedSizeIds?: string[];
  suggestedAttributeValueIds?: string[];
  isNew: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  basePrice: number;
  discountType: "percentage" | "flat" | null;
  discountValue: number;
  discountStartAt: string | null;
  discountEndAt: string | null;
  status: "active" | "inactive";
  originalPrice: number;
  discountedPrice: number;
  discountBadge: string | null;
  isDiscountActive: boolean;
  isOutOfStock: boolean;
  totalStock: number;
  variantCount?: number;
  lowStockCount?: number;
  variants?: Array<{
    id: string;
    productId: string;
    sku: string;
    stock: number;
    lowStockAlert: number;
    sizeIds: string[];
    sizes: Array<{ id: string; name: string }>;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminVariant {
  id: string;
  productId: string | null;
  sizeIds?: string[];
  sku: string;
  stock: number;
  lowStockAlert: number;
  lastUpdated?: string | null;
  isLowStock?: boolean;
  price: number;
  discountType: "percentage" | "flat" | null;
  discountValue: number;
  discountStartAt: string | null;
  discountEndAt: string | null;
  originalPrice: number;
  discountedPrice: number;
  discountBadge: string | null;
  isDiscountActive: boolean;
  product?: { id: string; name: string } | null;
  sizes?: Array<{ id: string; name: string }>;
  attributes?: Array<{
    name: string;
    values: Array<{ id: string; value: string; attributeId: string }>;
  }>;
  attributeValueIds?: string[];
}

export interface AdminVendor {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  whatsappNumber: string | null;
  contactName: string | null;
  status?: "pending" | "approved";
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminIncompleteOrder {
  id: string;
  userId: string | null;
  user: { id: string; name: string; email: string } | null;
  sessionId: string | null;
  subtotal: number;
  visitedAt: string;
  createdAt?: string;
  items?: Array<{
    variantId: string;
    sku: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export interface AdminPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  images?: string[] | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSection {
  id: string;
  type: string;
  title: string;
  description: string | null;
  images: string[];
  isVisible: boolean;
  link?: string | null;
  ctaText?: string | null;
}

export interface AdminPaymentMethod {
  id: number;
  slug: string;
  name: string;
  isActive: boolean;
  requiresSenderAndTxn: boolean;
  charge: number;
  config: {
    number: string | null;
    instruction: string | null;
    accountNumber: string | null;
    bankName: string | null;
    branch: string | null;
    accountHolder: string | null;
  };
  sortOrder: number;
}

export interface AdminReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string | null;
  user: { id: string; name: string } | null;
  product: { id: string; name: string; slug: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSize {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminShippingOption {
  id: string;
  name: string;
  amount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minPurchase: number;
  maxDiscount: number | null;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  scope: "ALL" | "USER";
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  analytics: () =>
    axiosInstance.get<{ data: AdminAnalytics }>(`${BASE}/analytics`),

  products: {
    list: (params?: {
      limit?: number;
      page?: number;
      categoryId?: string;
      search?: string;
    }) =>
      axiosInstance.get<{
        data: {
          products: AdminProduct[];
          totalResults: number;
          totalPages: number;
          currentPage: number;
          resultsPerPage: number;
        };
      }>(`${BASE}/products`, { params }),
    get: (id: string) =>
      axiosInstance.get<{ data: AdminProduct }>(`${BASE}/products/${id}`),
    create: (body: {
      name: string;
      shortDescription?: string;
      description?: string;
      categoryId?: string;
      subcategoryId?: string;
      vendorId?: string;
      brandId?: string;
      isNew?: boolean;
      isFeatured?: boolean;
      isTrending?: boolean;
      isBestSeller?: boolean;
      status?: "active" | "inactive";
      images?: string[];
      suggestedSizeIds?: string[];
      suggestedAttributeValueIds?: string[];
      variants?: Array<{
        id?: string;
        sku: string;
        stock: number;
        lowStockAlert?: number;
        price: number;
        discountType?: "percentage" | "flat" | null;
        discountValue?: number;
        discountStartAt?: string | null;
        discountEndAt?: string | null;
        sizeIds?: string[];
        attributeValueIds?: string[];
      }>;
    }) =>
      axiosInstance.post<{ message: string; data: AdminProduct }>(
        `${BASE}/products`,
        body,
      ),
    update: (
      id: string,
      body: {
        name?: string;
        shortDescription?: string;
        description?: string;
        categoryId?: string;
        subcategoryId?: string;
        vendorId?: string;
        brandId?: string;
        isNew?: boolean;
        isFeatured?: boolean;
        isTrending?: boolean;
        isBestSeller?: boolean;
        status?: "active" | "inactive";
        images?: string[];
        suggestedSizeIds?: string[];
        suggestedAttributeValueIds?: string[];
        variants?: Array<{
          id?: string;
          sku: string;
          stock: number;
          lowStockAlert?: number;
          price: number;
          discountType?: "percentage" | "flat" | null;
          discountValue?: number;
          discountStartAt?: string | null;
          discountEndAt?: string | null;
          sizeIds?: string[];
          attributeValueIds?: string[];
        }>;
      },
    ) =>
      axiosInstance.put<{ message: string; data: AdminProduct }>(
        `${BASE}/products/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/products/${id}`),
  },

  categories: {
    create: (body: {
      name: string;
      shortDescription?: string;
      description?: string;
      images?: string[];
    }) =>
      axiosInstance.post<{
        message: string;
        data: { id: string; name: string; slug: string };
      }>(`${BASE}/categories`, body),
    update: (
      id: string,
      body: {
        name?: string;
        shortDescription?: string;
        description?: string;
        images?: string[];
      },
    ) =>
      axiosInstance.put<{ message: string; data: { id: string } }>(
        `${BASE}/categories/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/categories/${id}`),
    reorder: (ids: string[]) =>
      axiosInstance.post<{ message: string }>(`${BASE}/categories/reorder`, {
        ids,
      }),
  },

  users: {
    list: (params?: { limit?: number; page?: number }) =>
      axiosInstance.get<{
        data: {
          users: AdminUser[];
          totalResults: number;
          totalPages: number;
          currentPage: number;
        };
      }>(`${BASE}/users`, { params }),
    get: (id: string) =>
      axiosInstance.get<{ data: AdminUser }>(`${BASE}/users/${id}`),
    create: (body: {
      name: string;
      email: string;
      password: string;
      role: string;
      roleId?: string | null;
    }) =>
      axiosInstance.post<{
        message: string;
        data: { id: string; name: string; email: string; role: string };
      }>(`${BASE}/users`, body),
    update: (
      id: string,
      body: {
        name?: string;
        email?: string;
        password?: string;
        role?: string;
        roleId?: string | null;
        isActive?: boolean;
      },
    ) =>
      axiosInstance.put<{ message: string; data: { id: string } }>(
        `${BASE}/users/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/users/${id}`),
  },

  attributes: {
    list: () =>
      axiosInstance.get<{ data: AdminAttribute[] }>(`${BASE}/attributes`),
    create: (body: { name: string; values?: string[] }) =>
      axiosInstance.post<{
        message: string;
        data: { id: string; name: string };
      }>(`${BASE}/attributes`, body),
    update: (id: string, body: { name?: string; values?: string[] }) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: string;
          name: string;
          slug: string;
          values: Array<{ id: string; value: string; slug: string }>;
        };
      }>(`${BASE}/attributes/${id}`, body),
  },

  variants: {
    list: (params?: {
      productId?: string;
      unassignedOnly?: boolean;
      limit?: number;
    }) =>
      axiosInstance.get<{
        data: { variants: AdminVariant[]; totalResults: number };
      }>(`${BASE}/variants`, { params }),
    get: (id: string) =>
      axiosInstance.get<{ data: AdminVariant }>(`${BASE}/variants/${id}`),
    create: (body: {
      productId?: string | null;
      sku: string;
      stock: number;
      lowStockAlert?: number;
      price: number;
      discountType?: "percentage" | "flat" | null;
      discountValue?: number;
      discountStartAt?: string | null;
      discountEndAt?: string | null;
      sizeIds?: string[];
      attributeValueIds?: string[];
    }) =>
      axiosInstance.post<{ message: string; data: AdminVariant }>(
        `${BASE}/variants`,
        body,
      ),
    update: (
      id: string,
      body: {
        sku?: string;
        stock?: number;
        lowStockAlert?: number;
        price?: number;
        discountType?: "percentage" | "flat" | null;
        discountValue?: number;
        discountStartAt?: string | null;
        discountEndAt?: string | null;
        sizeIds?: string[];
        attributeValueIds?: string[];
      },
    ) =>
      axiosInstance.put<{ message: string; data: AdminVariant }>(
        `${BASE}/variants/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/variants/${id}`),
    addStock: (id: string, body: { quantity: number }) =>
      axiosInstance.post<{ message: string; data: AdminVariant }>(
        `${BASE}/variants/${id}/add-stock`,
        body,
      ),
    reduceStock: (id: string, body: { quantity: number; reason?: string }) =>
      axiosInstance.post<{ message: string; data: AdminVariant }>(
        `${BASE}/variants/${id}/reduce-stock`,
        body,
      ),
  },

  sections: {
    list: () => axiosInstance.get<{ data: AdminSection[] }>(`${BASE}/sections`),
    update: (id: string, body: Partial<AdminSection>) =>
      axiosInstance.put<{ message: string; data: { id: string } }>(
        `${BASE}/sections/${id}`,
        body,
      ),
  },

  reviews: {
    list: (params?: {
      productId?: string;
      userId?: string;
      rating?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      limit?: number;
      page?: number;
    }) =>
      axiosInstance.get<{
        data: {
          reviews: AdminReview[];
          totalResults: number;
          totalPages: number;
          currentPage: number;
        };
      }>(`${BASE}/reviews`, { params }),
    get: (id: string) =>
      axiosInstance.get<{ data: AdminReview }>(`${BASE}/reviews/${id}`),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/reviews/${id}`),
  },

  sizes: {
    list: (params?: { all?: boolean }) =>
      axiosInstance.get<{ data: AdminSize[] }>(`${BASE}/sizes`, {
        params: params?.all ? { all: 1 } : undefined,
      }),
    create: (body: { name: string; sortOrder?: number }) =>
      axiosInstance.post<{ message: string; data: AdminSize }>(
        `${BASE}/sizes`,
        body,
      ),
    update: (
      id: string,
      body: { name?: string; sortOrder?: number; isActive?: boolean },
    ) =>
      axiosInstance.put<{ message: string; data: AdminSize }>(
        `${BASE}/sizes/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/sizes/${id}`),
  },

  paymentMethods: {
    list: () =>
      axiosInstance.get<{ data: AdminPaymentMethod[] }>(
        `${BASE}/payment-methods`,
      ),
    get: (id: number) =>
      axiosInstance.get<{ data: AdminPaymentMethod }>(
        `${BASE}/payment-methods/${id}`,
      ),
    create: (body: {
      slug: string;
      name: string;
      isActive?: boolean;
      requiresSenderAndTxn?: boolean;
      charge?: number;
      config?: {
        number?: string;
        instruction?: string;
        accountNumber?: string;
        bankName?: string;
        branch?: string;
        accountHolder?: string;
      };
      sortOrder?: number;
    }) =>
      axiosInstance.post<{ message: string; data: AdminPaymentMethod }>(
        `${BASE}/payment-methods`,
        body,
      ),
    update: (
      id: number,
      body: {
        name?: string;
        isActive?: boolean;
        charge?: number;
        config?: {
          number?: string;
          instruction?: string;
          accountNumber?: string;
          bankName?: string;
          branch?: string;
          accountHolder?: string;
        };
        sortOrder?: number;
      },
    ) =>
      axiosInstance.put<{ message: string; data: AdminPaymentMethod }>(
        `${BASE}/payment-methods/${id}`,
        body,
      ),
    delete: (id: number) =>
      axiosInstance.delete<{ message: string }>(
        `${BASE}/payment-methods/${id}`,
      ),
  },

  orders: {
    list: (params?: {
      limit?: number;
      page?: number;
      status?: string;
      paymentStatus?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      courierPage?: "steadfast" | "pathao";
    }) =>
      axiosInstance.get<{
        data: {
          orders: AdminOrder[];
          totalResults: number;
          totalPages: number;
          currentPage: number;
          resultsPerPage: number;
        };
      }>(`${BASE}/orders`, { params }),
    get: (id: string) =>
      axiosInstance.get<{ data: AdminOrderDetail }>(`${BASE}/orders/${id}`),
    updateParcelWeight: (id: string, weight: number | null) =>
      axiosInstance.put<{
        message: string;
        data: { parcelWeight: number | null };
      }>(`${BASE}/orders/${id}/parcel-weight`, { weight: weight ?? undefined }),
    updateStatus: (
      id: string,
      status: string,
      courierInfo?: {
        courierCompany?: string;
        courierTrackingId?: string;
        dispatchDate?: string;
        expectedDeliveryDate?: string;
      },
    ) =>
      axiosInstance.put<{ message: string; data: AdminOrderDetail }>(
        `${BASE}/orders/${id}`,
        {
          status,
          ...(courierInfo || {}),
        },
      ),
    vendorWhatsApp: (id: string) =>
      axiosInstance.get<{
        data: {
          orderId: string;
          trackingNumber: string;
          vendors: Array<{
            vendorId: string;
            vendorName: string;
            whatsappNumber: string;
            whatsappUrl: string;
            items: Array<{
              productName: string;
              size: string;
              quantity: number;
            }>;
          }>;
        };
      }>(`${BASE}/orders/${id}/vendor-whatsapp`),
    steadfastCreate: (id: string) =>
      axiosInstance.post<{
        message: string;
        data: {
          order: AdminOrderDetail;
          steadfast: { consignment_id: number; tracking_code: string };
        };
      }>(`${BASE}/orders/${id}/steadfast-create`),
    steadfastStatus: (id: string) =>
      axiosInstance.get<{
        data: {
          delivery_status: string;
          response?: Record<string, unknown>;
        };
      }>(`${BASE}/orders/${id}/steadfast-status`),
    steadfastCancel: (id: string) =>
      axiosInstance.post<{
        message: string;
        data: { order: AdminOrderDetail };
      }>(`${BASE}/orders/${id}/steadfast-cancel`),
    pathaoCreate: (
      id: string,
      body?: {
        pathao_city_id?: number;
        pathao_zone_id?: number;
        pathao_area_id?: number;
      },
    ) =>
      axiosInstance.post<{
        message: string;
        data: { order: AdminOrderDetail; pathao?: Record<string, unknown> };
      }>(`${BASE}/orders/${id}/pathao-create`, body ?? {}),
    pathaoStatus: (id: string) =>
      axiosInstance.get<{
        data: { delivery_status?: string; response?: Record<string, unknown> };
      }>(`${BASE}/orders/${id}/pathao-status`),
    pathaoCancel: (id: string) =>
      axiosInstance.post<{
        message: string;
        data: { order: AdminOrderDetail };
      }>(`${BASE}/orders/${id}/pathao-cancel`),
    notifications: () =>
      axiosInstance.get<{
        data: {
          count: number;
          recentOrders: Array<{
            id: string;
            userId: string;
            user: { id: string; name: string; email: string } | null;
            amount: number;
            status: string;
            orderDate?: string | null;
            createdAt?: string;
          }>;
        };
      }>(`${BASE}/orders/notifications`),
    markNotificationsAsRead: () =>
      axiosInstance.post<{ message: string }>(
        `${BASE}/orders/notifications/mark-read`,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/orders/${id}`),
    clear: () =>
      axiosInstance.post<{ message: string }>(`${BASE}/orders/clear`),
  },

  payments: {
    updateStatus: (id: string, status: string) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: string;
          orderId: string;
          method: string;
          amount: number;
          status: string;
          senderNumber?: string | null;
          transactionId?: string | null;
        };
      }>(`${BASE}/payments/${id}`, { status }),
  },

  transactions: {
    list: (params?: { status?: string; limit?: number; search?: string }) =>
      axiosInstance.get<{
        data: {
          transactions: AdminTransaction[];
          totalResults: number;
          totalPages: number;
          currentPage: number;
        };
      }>(`${BASE}/transactions`, { params }),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/transactions/${id}`),
  },

  logs: (params?: { limit?: number; offset?: number }) =>
    axiosInstance.get<{ data: { logs: AdminLog[]; totalResults: number } }>(
      `${BASE}/logs`,
      { params },
    ),

  activities: {
    recent: (params?: { limit?: number }) =>
      axiosInstance.get<{ data: { activities: AdminRecentActivity[] } }>(
        `${BASE}/recent-activities`,
        { params },
      ),
    clear: () =>
      axiosInstance.post<{ message: string }>(
        `${BASE}/recent-activities/clear`,
      ),
  },

  visitors: {
    recent: (params?: { limit?: number }) =>
      axiosInstance.get<{ data: { visitors: AdminRecentVisitor[] } }>(
        `${BASE}/recent-visitors`,
        { params },
      ),
    clear: () =>
      axiosInstance.post<{ message: string }>(`${BASE}/recent-visitors/clear`),
  },

  analyticsAdmin: {
    clearTopPages: () =>
      axiosInstance.post<{ message: string }>(
        `${BASE}/analytics/top-pages/clear`,
      ),
  },

  /** @param folder - Save under this folder: logo | categories | products | brands | utility. Default: products */
  uploads: (formData: FormData, options?: { folder?: string }) => {
    if (options?.folder) {
      formData.append("folder", options.folder);
    }
    return axiosInstance.post<{
      message: string;
      data: Array<{ path: string; url: string }>;
    }>(`${BASE}/uploads`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  images: {
    delete: (body: {
      path: string;
      ownerType:
        | "product"
        | "category"
        | "subcategory"
        | "brand"
        | "homeSection"
        | "slider"
        | "section"
        | "settings"
        | "variant";
      ownerId?: string | number;
      field?: string;
    }) =>
      axiosInstance.post<{
        message: string;
        data: { path: string; deletedFromStorage: boolean };
      }>(`${BASE}/images/delete`, body),
  },

  shippingSettings: {
    get: () =>
      axiosInstance.get<{
        data: {
          freeDeliveryMinAmount: number;
          freeDeliveryProgressBarEnabled: boolean;
        };
      }>(`${BASE}/shipping-settings`),
    update: (body: {
      freeDeliveryMinAmount: number;
      freeDeliveryProgressBarEnabled?: boolean;
    }) =>
      axiosInstance.put<{
        message: string;
        data: {
          freeDeliveryMinAmount: number;
          freeDeliveryProgressBarEnabled: boolean;
        };
      }>(`${BASE}/shipping-settings`, body),
  },

  steadfast: {
    status: () =>
      axiosInstance.get<{
        data: {
          configured: boolean;
          active?: boolean;
          balance?: number | null;
          message?: string;
        };
      }>(`${BASE}/steadfast/status`),
  },

  pathao: {
    status: () =>
      axiosInstance.get<{
        data: { configured: boolean; active?: boolean; message?: string };
      }>(`${BASE}/pathao/status`),
    cities: () =>
      axiosInstance.get<{
        data: Array<{ city_id: number; city_name: string }>;
      }>(`${BASE}/pathao/cities`),
    zones: (cityId: number) =>
      axiosInstance.get<{
        data: Array<{ zone_id: number; zone_name: string }>;
      }>(`${BASE}/pathao/zones`, { params: { city_id: cityId } }),
    areas: (zoneId: number) =>
      axiosInstance.get<{
        data: Array<{ area_id: number; area_name: string }>;
      }>(`${BASE}/pathao/areas`, { params: { zone_id: zoneId } }),
  },

  courier: {
    steadfast: {
      getSettings: () =>
        axiosInstance.get<{
          data: {
            apiKey: string;
            secretKey: string;
            baseUrl: string;
            webhookBearerToken: string;
            active: boolean;
          };
        }>(`${BASE}/courier/steadfast/settings`),
      updateSettings: (body: {
        apiKey?: string;
        secretKey?: string;
        baseUrl?: string;
        webhookBearerToken?: string;
        active?: boolean;
      }) =>
        axiosInstance.put<{
          message: string;
          data: {
            apiKey: string;
            secretKey: string;
            baseUrl: string;
            webhookBearerToken: string;
            active: boolean;
          };
        }>(`${BASE}/courier/steadfast/settings`, body),
    },
    pathao: {
      getSettings: () =>
        axiosInstance.get<{
          data: {
            apiKey: string;
            secretKey: string;
            baseUrl: string;
            storeId: string;
            username: string;
            active: boolean;
          };
        }>(`${BASE}/courier/pathao/settings`),
      updateSettings: (body: {
        apiKey?: string;
        secretKey?: string;
        baseUrl?: string;
        storeId?: string;
        username?: string;
        password?: string;
        active?: boolean;
      }) =>
        axiosInstance.put<{
          message: string;
          data: {
            apiKey: string;
            secretKey: string;
            baseUrl: string;
            storeId: string;
            username: string;
            active: boolean;
          };
        }>(`${BASE}/courier/pathao/settings`, body),
    },
  },

  shippingOptions: {
    list: () =>
      axiosInstance.get<{ data: AdminShippingOption[] }>(
        `${BASE}/shipping-options`,
      ),
    create: (body: { name: string; amount: number; sortOrder?: number }) =>
      axiosInstance.post<{ message: string; data: AdminShippingOption }>(
        `${BASE}/shipping-options`,
        body,
      ),
    update: (
      id: string,
      body: {
        name?: string;
        amount?: number;
        sortOrder?: number;
        isActive?: boolean;
      },
    ) =>
      axiosInstance.put<{ message: string; data: AdminShippingOption }>(
        `${BASE}/shipping-options/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(
        `${BASE}/shipping-options/${id}`,
      ),
  },

  vendors: {
    list: (params?: {
      limit?: number;
      page?: number;
      search?: string;
      status?: "pending" | "approved";
    }) =>
      axiosInstance.get<{
        data: {
          vendors: AdminVendor[];
          totalResults: number;
          totalPages: number;
          currentPage: number;
          resultsPerPage: number;
        };
      }>(`${BASE}/vendors`, { params }),
    approve: (id: string) =>
      axiosInstance.post<{ message: string; data: AdminVendor }>(
        `${BASE}/vendors/${id}/approve`,
      ),
    get: (id: string) =>
      axiosInstance.get<{ data: AdminVendor }>(`${BASE}/vendors/${id}`),
    create: (body: {
      name: string;
      email?: string;
      address?: string;
      whatsappNumber?: string;
      contactName?: string;
    }) =>
      axiosInstance.post<{ message: string; data: AdminVendor }>(
        `${BASE}/vendors`,
        {
          name: body.name,
          email: body.email || undefined,
          address: body.address || undefined,
          whatsapp_number: body.whatsappNumber || undefined,
          contact_name: body.contactName || undefined,
        },
      ),
    update: (
      id: string,
      body: {
        name?: string;
        email?: string;
        address?: string;
        whatsappNumber?: string;
        contactName?: string;
      },
    ) =>
      axiosInstance.put<{ message: string; data: AdminVendor }>(
        `${BASE}/vendors/${id}`,
        {
          ...(body.name != null && { name: body.name }),
          ...(body.email !== undefined && { email: body.email }),
          ...(body.address !== undefined && { address: body.address }),
          ...(body.whatsappNumber !== undefined && {
            whatsapp_number: body.whatsappNumber,
          }),
          ...(body.contactName !== undefined && {
            contact_name: body.contactName,
          }),
        },
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/vendors/${id}`),
  },

  incompleteOrders: {
    list: (params?: {
      limit?: number;
      page?: number;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    }) =>
      axiosInstance.get<{
        data: {
          incompleteOrders: AdminIncompleteOrder[];
          totalResults: number;
          totalPages: number;
          currentPage: number;
          resultsPerPage: number;
        };
      }>(`${BASE}/incomplete-orders`, { params }),
    get: (id: string) =>
      axiosInstance.get<{ data: AdminIncompleteOrder }>(
        `${BASE}/incomplete-orders/${id}`,
      ),
    sendMarketing: (id: string) =>
      axiosInstance.post<{ message: string }>(
        `${BASE}/incomplete-orders/${id}/send-marketing`,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(
        `${BASE}/incomplete-orders/${id}`,
      ),
  },

  pages: {
    list: (params?: { limit?: number; page?: number; search?: string }) =>
      axiosInstance.get<{
        data: {
          pages: AdminPage[];
          totalResults: number;
          totalPages: number;
          currentPage: number;
          resultsPerPage: number;
        };
      }>(`${BASE}/pages`, { params }),
    get: (id: string) =>
      axiosInstance.get<{ data: AdminPage }>(`${BASE}/pages/${id}`),
    create: (body: {
      title: string;
      slug?: string;
      description?: string;
      content?: string;
      images?: string[];
      isActive?: boolean;
    }) =>
      axiosInstance.post<{ message: string; data: AdminPage }>(
        `${BASE}/pages`,
        {
          title: body.title,
          slug: body.slug,
          description: body.description,
          content: body.content,
          images: body.images,
          isActive: body.isActive,
        },
      ),
    update: (
      id: string,
      body: {
        title?: string;
        slug?: string;
        description?: string;
        content?: string;
        images?: string[];
        isActive?: boolean;
      },
    ) =>
      axiosInstance.put<{ message: string; data: AdminPage }>(
        `${BASE}/pages/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/pages/${id}`),
  },

  coupons: {
    list: () => axiosInstance.get<{ data: AdminCoupon[] }>(`${BASE}/coupons`),
    create: (body: {
      code: string;
      name: string;
      description?: string;
      type: "PERCENTAGE" | "FIXED";
      value: number;
      minPurchase?: number;
      maxDiscount?: number;
      validFrom: string;
      validUntil: string;
      usageLimit?: number;
      isActive?: boolean;
      scope?: "ALL" | "USER";
    }) =>
      axiosInstance.post<{ message: string; data: AdminCoupon }>(
        `${BASE}/coupons`,
        body,
      ),
    update: (id: string, body: Partial<AdminCoupon>) =>
      axiosInstance.put<{ message: string; data: AdminCoupon }>(
        `${BASE}/coupons/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/coupons/${id}`),
    assignToUser: (id: string, userId: string) =>
      axiosInstance.post<{ message: string }>(`${BASE}/coupons/${id}/assign`, {
        userId,
      }),
  },

  sliders: {
    list: () =>
      axiosInstance.get<{
        data: Array<{
          id: number;
          title: string | null;
          image: string;
          link: string | null;
          description: string | null;
          sortOrder: number;
          isActive: boolean;
        }>;
      }>(`${BASE}/sliders`),
    create: (body: {
      title?: string | null;
      image: string;
      link?: string | null;
      description?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    }) =>
      axiosInstance.post<{
        message: string;
        data: {
          id: number;
          title: string | null;
          image: string;
          link: string | null;
          description: string | null;
          sortOrder: number;
          isActive: boolean;
        };
      }>(`${BASE}/sliders`, body),
    update: (
      id: number,
      body: {
        title?: string | null;
        image?: string;
        link?: string | null;
        description?: string | null;
        sortOrder?: number;
        isActive?: boolean;
      },
    ) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: number;
          title: string | null;
          image: string;
          link: string | null;
          description: string | null;
          sortOrder: number;
          isActive: boolean;
        };
      }>(`${BASE}/sliders/${id}`, body),
    delete: (id: number) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/sliders/${id}`),
    reorder: (ids: number[]) =>
      axiosInstance.post<{ message: string }>(`${BASE}/sliders/reorder`, {
        ids,
      }),
  },

  notices: {
    list: () =>
      axiosInstance.get<{
        data: Array<{
          id: number;
          text: string;
          sortOrder: number;
          isActive: boolean;
          scrollSpeed: number;
        }>;
      }>(`${BASE}/notices`),
    create: (body: {
      text: string;
      sortOrder?: number;
      isActive?: boolean;
      scrollSpeed?: number;
    }) =>
      axiosInstance.post<{
        message: string;
        data: {
          id: number;
          text: string;
          sortOrder: number;
          isActive: boolean;
          scrollSpeed: number;
        };
      }>(`${BASE}/notices`, body),
    update: (
      id: number,
      body: {
        text?: string;
        sortOrder?: number;
        isActive?: boolean;
        scrollSpeed?: number;
      },
    ) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: number;
          text: string;
          sortOrder: number;
          isActive: boolean;
          scrollSpeed: number;
        };
      }>(`${BASE}/notices/${id}`, body),
    delete: (id: number) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/notices/${id}`),
    reorder: (ids: number[]) =>
      axiosInstance.post<{ message: string }>(`${BASE}/notices/reorder`, {
        ids,
      }),
  },

  homeSections: {
    list: () =>
      axiosInstance.get<{
        data: Array<{
          id: number;
          name: string;
          slug: string;
          themeType?: string;
          title?: string | null;
          description?: string | null;
          subtitle?: string | null;
          themeData?: Record<string, any>;
          backgroundColor?: string | null;
          textColor?: string | null;
          ctaText?: string | null;
          ctaLink?: string | null;
          isVisible?: boolean;
          sortOrder: number;
          productsCount: number;
          countdownEnd?: string | null;
          icon?: string | null;
          image?: string | null;
        }>;
      }>(`${BASE}/home-sections`),
    get: (id: number) =>
      axiosInstance.get<{
        data: {
          id: number;
          name: string;
          slug: string;
          themeType?: string;
          title?: string | null;
          description?: string | null;
          subtitle?: string | null;
          themeData?: Record<string, any>;
          backgroundColor?: string | null;
          textColor?: string | null;
          ctaText?: string | null;
          ctaLink?: string | null;
          isVisible?: boolean;
          sortOrder: number;
          productsCount: number;
          products: Array<{ id: string; name: string; slug: string }>;
          countdownEnd?: string | null;
          icon?: string | null;
          image?: string | null;
        };
      }>(`${BASE}/home-sections/${id}`),
    create: (body: {
      name: string;
      slug?: string;
      themeType?: string;
      title?: string;
      description?: string;
      subtitle?: string;
      themeData?: Record<string, any>;
      backgroundColor?: string;
      textColor?: string;
      ctaText?: string;
      ctaLink?: string;
      isVisible?: boolean;
      sortOrder?: number;
      countdownEnd?: string;
      icon?: string;
      image?: string;
    }) =>
      axiosInstance.post<{
        message: string;
        data: {
          id: number;
          name: string;
          slug: string;
          themeType?: string;
          title?: string | null;
          description?: string | null;
          subtitle?: string | null;
          themeData?: Record<string, any>;
          backgroundColor?: string | null;
          textColor?: string | null;
          ctaText?: string | null;
          ctaLink?: string | null;
          isVisible?: boolean;
          sortOrder: number;
          productsCount: number;
          countdownEnd?: string | null;
          icon?: string | null;
          image?: string | null;
        };
      }>(`${BASE}/home-sections`, body),
    update: (
      id: number,
      body: {
        name?: string;
        slug?: string;
        themeType?: string;
        title?: string;
        description?: string;
        subtitle?: string;
        themeData?: Record<string, any>;
        backgroundColor?: string;
        textColor?: string;
        ctaText?: string;
        ctaLink?: string;
        isVisible?: boolean;
        sortOrder?: number;
        countdownEnd?: string;
        icon?: string;
        image?: string;
      },
    ) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: number;
          name: string;
          slug: string;
          themeType?: string;
          title?: string | null;
          description?: string | null;
          subtitle?: string | null;
          themeData?: Record<string, any>;
          backgroundColor?: string | null;
          textColor?: string | null;
          ctaText?: string | null;
          ctaLink?: string | null;
          isVisible?: boolean;
          sortOrder: number;
          productsCount: number;
          countdownEnd?: string | null;
          icon?: string | null;
          image?: string | null;
        };
      }>(`${BASE}/home-sections/${id}`, body),
    delete: (id: number) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/home-sections/${id}`),
    updateProducts: (id: number, productIds: string[]) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: number;
          name: string;
          slug: string;
          sortOrder: number;
          productsCount: number;
        };
      }>(`${BASE}/home-sections/${id}/products`, { productIds }),
    reorder: (sectionIds: number[]) =>
      axiosInstance.post<{ message: string }>(`${BASE}/home-sections/reorder`, {
        sectionIds,
      }),
  },

  settings: {
    get: () =>
      axiosInstance.get<{
        data: {
          searchPlaceholder: string;
          topbar: {
            isActive: boolean;
            email: string;
            phone: string;
            bgColor: string;
            textColor: string;
            linkColor: string;
            wishlistLabel: string;
            wishlistPath: string;
            trackOrderLabel: string;
            trackOrderPath: string;
            showTrackOrder: boolean;
          };
          storeInfo: {
            storeName: string;
            logo: string;
            address: string;
            email: string;
            phone: string;
            whatsappLink: string;
            messengerLink: string;
          };
          seoSettings?: {
            defaultTitle: string;
            defaultDescription: string;
            defaultKeywords: string;
            defaultOgImage: string;
            pages: Array<{
              path: string;
              title?: string;
              description?: string;
              keywords?: string;
              ogImage?: string;
            }>;
          };
          popupSettings?: {
            isActive: boolean;
            showTime: number;
            delayTime: number;
            image?: string;
            title?: string;
            description?: string;
            buttonText?: string;
            buttonLink?: string;
            pages?: string[];
          };
          animationSettings?: {
            welcomeAnimation: {
              isActive: boolean;
              duration: number;
              showConfetti: boolean;
              backgroundColor: string;
              circleColor: string;
            };
            pageTransitionAnimation: {
              isActive: boolean;
              duration: number;
              backgroundColor: string;
              circleColor: string;
            };
          };
          languageSettings?: {
            isActive: boolean;
            defaultLang: "en" | "bn";
            enabled: { en: boolean; bn: boolean };
          };
          translations?: Record<string, Record<string, Record<string, string>>>;
        };
      }>(`${BASE}/settings`),
    update: (body: {
      searchPlaceholder?: string;
      topbar?: Partial<{
        isActive: boolean;
        email: string;
        phone: string;
        bgColor: string;
        textColor: string;
        linkColor: string;
        wishlistLabel: string;
        wishlistPath: string;
        trackOrderLabel: string;
        trackOrderPath: string;
        showTrackOrder: boolean;
      }>;
      storeInfo?: {
        storeName?: string;
        logo?: string;
        address?: string;
        email?: string;
        phone?: string;
        whatsappLink?: string;
        messengerLink?: string;
      };
      seoSettings?: {
        defaultTitle?: string;
        defaultDescription?: string;
        defaultKeywords?: string;
        defaultOgImage?: string;
        pages?: Array<{
          path: string;
          title?: string;
          description?: string;
          keywords?: string;
          ogImage?: string;
        }>;
      };
      popupSettings?: {
        isActive?: boolean;
        showTime?: number;
        delayTime?: number;
        image?: string;
        title?: string;
        description?: string;
        buttonText?: string;
        buttonLink?: string;
        pages?: string[];
      };
      animationSettings?: {
        welcomeAnimation?: {
          isActive?: boolean;
          duration?: number;
          showConfetti?: boolean;
          backgroundColor?: string;
          circleColor?: string;
        };
        pageTransitionAnimation?: {
          isActive?: boolean;
          duration?: number;
          backgroundColor?: string;
          circleColor?: string;
        };
      };
      languageSettings?: {
        isActive?: boolean;
        defaultLang?: "en" | "bn";
        enabled?: { en?: boolean; bn?: boolean };
      };
      translations?: Record<string, Record<string, Record<string, string>>>;
    }) =>
      axiosInstance.put<{
        message: string;
        data: {
          searchPlaceholder: string;
          topbar: Record<string, unknown>;
          storeInfo: {
            storeName: string;
            logo: string;
            address: string;
            email: string;
            phone: string;
            whatsappLink: string;
            messengerLink: string;
          };
          seoSettings?: {
            defaultTitle: string;
            defaultDescription: string;
            defaultKeywords: string;
            defaultOgImage: string;
            pages: Array<{
              path: string;
              title?: string;
              description?: string;
              keywords?: string;
              ogImage?: string;
            }>;
          };
          popupSettings?: {
            isActive: boolean;
            showTime: number;
            delayTime: number;
            image?: string;
            title?: string;
            description?: string;
            buttonText?: string;
            buttonLink?: string;
            pages?: string[];
          };
          animationSettings?: {
            welcomeAnimation: {
              isActive: boolean;
              duration: number;
              showConfetti: boolean;
              backgroundColor: string;
              circleColor: string;
            };
            pageTransitionAnimation: {
              isActive: boolean;
              duration: number;
              backgroundColor: string;
              circleColor: string;
            };
          };
          languageSettings?: {
            isActive: boolean;
            defaultLang: "en" | "bn";
            enabled: { en: boolean; bn: boolean };
          };
          translations?: Record<string, Record<string, Record<string, string>>>;
        };
      }>(`${BASE}/settings`, body),
  },

  footer: {
    list: () =>
      axiosInstance.get<{
        data: Array<{
          id: number;
          columnName: string;
          title: string | null;
          logoUrl?: string | null;
          links: Array<{ label: string; url: string }>;
          socialLinks?: Array<{ platform: string; url: string }>;
          contactInfo?: Array<{ type: string; value: string }>;
          content: string | null;
          copyrightText?: string | null;
          poweredByText?: string | null;
          sortOrder: number;
          isActive: boolean;
        }>;
      }>(`${BASE}/footer`),
    create: (body: {
      columnName: string;
      title?: string;
      logoUrl?: string;
      links?: Array<{ label: string; url: string }>;
      socialLinks?: Array<{ platform: string; url: string }>;
      contactInfo?: Array<{ type: string; value: string }>;
      content?: string;
      copyrightText?: string;
      poweredByText?: string;
      sortOrder?: number;
      isActive?: boolean;
    }) =>
      axiosInstance.post<{
        message: string;
        data: {
          id: number;
          columnName: string;
          title: string | null;
          logoUrl?: string | null;
          links: Array<{ label: string; url: string }>;
          socialLinks?: Array<{ platform: string; url: string }>;
          contactInfo?: Array<{ type: string; value: string }>;
          content: string | null;
          copyrightText?: string | null;
          poweredByText?: string | null;
          sortOrder: number;
          isActive: boolean;
        };
      }>(`${BASE}/footer`, body),
    update: (
      id: number,
      body: {
        columnName?: string;
        title?: string;
        logoUrl?: string;
        links?: Array<{ label: string; url: string }>;
        socialLinks?: Array<{ platform: string; url: string }>;
        contactInfo?: Array<{ type: string; value: string }>;
        content?: string;
        copyrightText?: string;
        poweredByText?: string;
        sortOrder?: number;
        isActive?: boolean;
      },
    ) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: number;
          columnName: string;
          title: string | null;
          logoUrl?: string | null;
          links: Array<{ label: string; url: string }>;
          socialLinks?: Array<{ platform: string; url: string }>;
          contactInfo?: Array<{ type: string; value: string }>;
          content: string | null;
          copyrightText?: string | null;
          poweredByText?: string | null;
          sortOrder: number;
          isActive: boolean;
        };
      }>(`${BASE}/footer/${id}`, body),
    delete: (id: number) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/footer/${id}`),
  },

  chats: {
    list: (params?: { status?: "OPEN" | "RESOLVED" }) =>
      axiosInstance.get<{
        data: Array<{
          id: string;
          userId: string;
          user: { id: string; name: string; email: string } | null;
          status: string;
          lastMessage?: string | null;
          lastMessageAt?: string | null;
          messageCount: number;
          unreadCount: number;
          createdAt?: string;
          updatedAt?: string;
        }>;
      }>(`${BASE}/chats`, { params }),
    get: (id: string) =>
      axiosInstance.get<{
        data: {
          id: string;
          userId: string;
          user: { id: string; name: string; email: string } | null;
          status: string;
          messages: Array<{
            id: string;
            chatId: string;
            senderId: string;
            sender: { id: string; name: string; email: string } | null;
            content: string | null;
            type: string;
            url: string | null;
            createdAt?: string;
          }>;
          createdAt?: string;
          updatedAt?: string;
        };
      }>(`${BASE}/chats/${id}`),
    sendMessage: (
      id: string,
      body: { content: string; type?: "TEXT" | "IMAGE"; url?: string },
    ) =>
      axiosInstance.post<{
        message: string;
        data: {
          id: string;
          content: string;
          senderId: string;
          createdAt?: string;
        };
      }>(`${BASE}/chats/${id}/messages`, body),
    updateStatus: (id: string, body: { status: "OPEN" | "RESOLVED" }) =>
      axiosInstance.put<{
        message: string;
        data: { id: string; status: string };
      }>(`${BASE}/chats/${id}/status`, body),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/chats/${id}`),
  },

  roles: {
    list: () =>
      axiosInstance.get<{
        data: {
          roles: Array<{
            id: string;
            name: string;
            description?: string | null;
            permissions: string[];
            isActive?: boolean;
            usersCount: number;
            createdAt?: string;
          }>;
        };
      }>(`${BASE}/roles`),
    get: (id: string) =>
      axiosInstance.get<{
        data: {
          id: string;
          name: string;
          description?: string | null;
          permissions: string[];
          isActive?: boolean;
          usersCount: number;
        };
      }>(`${BASE}/roles/${id}`),
    create: (body: {
      name: string;
      description?: string;
      permissions: string[];
    }) =>
      axiosInstance.post<{
        message: string;
        data: { id: string; name: string };
      }>(`${BASE}/roles`, body),
    update: (
      id: string,
      body: {
        name?: string;
        description?: string;
        permissions?: string[];
        isActive?: boolean;
      },
    ) =>
      axiosInstance.put<{ message: string; data: { id: string } }>(
        `${BASE}/roles/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/roles/${id}`),
  },

  subcategories: {
    list: (params?: { categoryId?: string }) =>
      axiosInstance.get<{
        data: {
          subcategories: Array<{
            id: string;
            categoryId: string;
            category?: { id: string; name: string } | null;
            name: string;
            slug: string;
            description?: string | null;
            shortDescription?: string | null;
            images: string[];
            productsCount: number;
          }>;
        };
      }>(`${BASE}/subcategories`, { params }),
    get: (id: string) =>
      axiosInstance.get<{
        data: {
          id: string;
          categoryId: string;
          category?: { id: string; name: string } | null;
          name: string;
          slug: string;
          description?: string | null;
          shortDescription?: string | null;
          images: string[];
          productsCount: number;
        };
      }>(`${BASE}/subcategories/${id}`),
    create: (body: {
      categoryId: string;
      name: string;
      shortDescription?: string;
      description?: string;
      images?: string[];
    }) =>
      axiosInstance.post<{
        message: string;
        data: { id: string; name: string; slug: string };
      }>(`${BASE}/subcategories`, body),
    update: (
      id: string,
      body: {
        categoryId?: string;
        name?: string;
        shortDescription?: string;
        description?: string;
        images?: string[];
      },
    ) =>
      axiosInstance.put<{ message: string; data: { id: string } }>(
        `${BASE}/subcategories/${id}`,
        body,
      ),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/subcategories/${id}`),
  },

  emailSettings: {
    get: () =>
      axiosInstance.get<{
        data: {
          id: number;
          mailer: string;
          host: string | null;
          port: number | null;
          username: string | null;
          password: string | null;
          encryption: string | null;
          fromAddress: string;
          fromName: string;
          isActive: boolean;
        };
      }>(`${BASE}/email-settings`),
    update: (body: {
      mailer: string;
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      encryption?: string;
      fromAddress: string;
      fromName: string;
      isActive: boolean;
    }) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: number;
          mailer: string;
          host: string | null;
          port: number | null;
          username: string | null;
          password: string | null;
          encryption: string | null;
          fromAddress: string;
          fromName: string;
          isActive: boolean;
        };
      }>(`${BASE}/email-settings`, body),
    testEmail: (body: { email: string }) =>
      axiosInstance.post<{ message: string }>(
        `${BASE}/email-settings/test`,
        body,
      ),
  },

  emailTemplates: {
    list: () =>
      axiosInstance.get<{
        data: Array<{
          id: string;
          eventType: string;
          name: string;
          subject: string;
          bodyHtml: string;
          bodyText: string | null;
          availableVariables: Record<string, string>;
          isEnabled: boolean;
          createdAt?: string;
          updatedAt?: string;
        }>;
      }>(`${BASE}/email-templates`),
    get: (id: string) =>
      axiosInstance.get<{
        data: {
          id: string;
          eventType: string;
          name: string;
          subject: string;
          bodyHtml: string;
          bodyText: string | null;
          availableVariables: Record<string, string>;
          isEnabled: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      }>(`${BASE}/email-templates/${id}`),
    create: (body: {
      eventType: string;
      name: string;
      subject: string;
      bodyHtml: string;
      bodyText?: string;
      isEnabled?: boolean;
    }) =>
      axiosInstance.post<{
        message: string;
        data: {
          id: string;
          eventType: string;
          name: string;
          subject: string;
          bodyHtml: string;
          bodyText: string | null;
          availableVariables: Record<string, string>;
          isEnabled: boolean;
        };
      }>(`${BASE}/email-templates`, body),
    update: (
      id: string,
      body: {
        eventType?: string;
        name?: string;
        subject?: string;
        bodyHtml?: string;
        bodyText?: string;
        isEnabled?: boolean;
      },
    ) =>
      axiosInstance.put<{
        message: string;
        data: {
          id: string;
          eventType: string;
          name: string;
          subject: string;
          bodyHtml: string;
          bodyText: string | null;
          availableVariables: Record<string, string>;
          isEnabled: boolean;
        };
      }>(`${BASE}/email-templates/${id}`, body),
    delete: (id: string) =>
      axiosInstance.delete<{ message: string }>(
        `${BASE}/email-templates/${id}`,
      ),
    getEventTypes: () =>
      axiosInstance.get<{
        data: {
          eventTypes: Record<string, string>;
          variables: Record<string, Record<string, string>>;
        };
      }>(`${BASE}/email-templates/event-types`),
    testEmail: (
      id: string,
      body: { email: string; variables?: Record<string, string> },
    ) =>
      axiosInstance.post<{ message: string }>(
        `${BASE}/email-templates/${id}/test`,
        body,
      ),
  },

  emailLogs: {
    list: (params?: {
      status?: string;
      event_type?: string;
      recipient_email?: string;
      limit?: number;
    }) =>
      axiosInstance.get<{
        data: {
          logs: Array<{
            id: number;
            templateId: string | null;
            templateName: string | null;
            eventType: string;
            recipientEmail: string;
            recipientName: string | null;
            subject: string;
            status: string;
            errorMessage: string | null;
            variablesUsed: Record<string, any> | null;
            relatedModelType: string | null;
            relatedModelId: string | null;
            sentAt: string | null;
            createdAt: string;
          }>;
          totalResults: number;
          totalPages: number;
          currentPage: number;
          resultsPerPage: number;
        };
      }>(`${BASE}/email-logs`, { params }),
    get: (id: number) =>
      axiosInstance.get<{
        data: {
          id: number;
          templateId: string | null;
          templateName: string | null;
          eventType: string;
          recipientEmail: string;
          recipientName: string | null;
          subject: string;
          bodyHtml: string;
          status: string;
          errorMessage: string | null;
          variablesUsed: Record<string, any> | null;
          relatedModelType: string | null;
          relatedModelId: string | null;
          sentAt: string | null;
          createdAt: string;
        };
      }>(`${BASE}/email-logs/${id}`),
    delete: (id: number) =>
      axiosInstance.delete<{ message: string }>(`${BASE}/email-logs/${id}`),
    clearAll: () =>
      axiosInstance.delete<{ message: string }>(`${BASE}/email-logs/clear`),
  },
};
