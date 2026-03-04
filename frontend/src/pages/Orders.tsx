import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Package,
  Calendar,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ArrowRight,
  X,
} from 'lucide-react'
import MainLayout from '@/components/templates/MainLayout'
import WithAuth from '@/components/HOC/WithAuth'
import OrderFilters from '@/components/orders/OrderFilters'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { ordersApi } from '@/api/orders'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; icon: React.ComponentType<{ size?: number; className?: string }> }
    > = {
      PENDING: { color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300', icon: Clock },
      PROCESSING: { color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300', icon: Clock },
      SHIPPED: { color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300', icon: Truck },
      IN_TRANSIT: { color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300', icon: Truck },
      DELIVERED: { color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', icon: CheckCircle },
      CANCELED: { color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300', icon: XCircle },
      RETURNED: { color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300', icon: XCircle },
      REFUNDED: { color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300', icon: XCircle },
    }
    return configs[status] || configs.PENDING
  }

  const config = getStatusConfig(status)
  const IconComponent = config.icon

  return (
    <div
      className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${config.color}`}
    >
      <IconComponent size={12} className="sm:w-3 sm:h-3 mr-1" />
      <span className="hidden sm:inline">{status.replace('_', ' ')}</span>
      <span className="sm:hidden">
        {status.replace('_', ' ').split(' ')[0]}
      </span>
    </div>
  )
}

// Order card component
const OrderCard = ({ 
  order, 
  formatPrice, 
  onCancel,
  cancelingOrderId,
}: { 
  order: any
  formatPrice: (n: number) => string
  onCancel: (orderId: string) => void
  cancelingOrderId: string | null
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getItemCount = (orderItems: any[]) => {
    return (
      orderItems?.reduce(
        (total: number, item: any) => total + item.quantity,
        0
      ) || 0
    )
  }

  const truncateId = (id: string) => {
    return id.length > 8 ? `${id.substring(0, 8)}...` : id
  }

  // Check if order can be cancelled
  // User can only cancel if status is PENDING
  // Once admin changes to PROCESSING or beyond, user cannot cancel
  const canCancel = order.status === 'PENDING'
  const isCanceling = cancelingOrderId === order.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between mb-2 sm:mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
              <Package
                size={14}
                className="sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">
                Order #{truncateId(order.id)}
              </span>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Calendar
                size={12}
                className="sm:w-3 sm:h-3 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {formatDate(order.orderDate)}
              </span>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <DollarSign
              size={14}
              className="sm:w-4 sm:h-4 text-green-500 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                {formatPrice(order.amount)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <ShoppingBag
              size={14}
              className="sm:w-4 sm:h-4 text-blue-500 dark:text-blue-400 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Items</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getItemCount(order.orderItems || [])}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items Preview */}
        {order.orderItems && order.orderItems.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Items:</p>
            <div className="space-y-1">
              {order.orderItems.slice(0, 2).map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs sm:text-sm"
                >
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                    {item.variant?.product?.name || 'Product'}
                    {item.quantity > 1 && ` (×${item.quantity})`}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {order.orderItems.length > 2 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  +{order.orderItems.length - 2} more items
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to={`/orders/${order.id}`}
            className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all duration-200 group text-sm sm:text-base"
          >
            <span>Track Order</span>
            <ArrowRight
              size={14}
              className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-200"
            />
          </Link>
          {canCancel && (
            <button
              onClick={() => onCancel(order.id)}
              disabled={isCanceling}
              className="flex items-center justify-center space-x-1 sm:space-x-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isCanceling ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <X size={14} className="sm:w-4 sm:h-4" />
                  <span>Cancel</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function UserOrders() {
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null)
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<any | null>(null)

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await ordersApi.getAll()
      setOrders(res.data.data.orders || [])
    } catch (err: any) {
      console.error('Error loading orders:', err)
      setError(err?.response?.data?.message || 'Failed to load orders')
      showToast(
        err?.response?.data?.message || 'Failed to load orders',
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelOrder = (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId)
    if (order) {
      setCancelConfirmOrder(order)
    }
  }

  const confirmCancel = async () => {
    if (!cancelConfirmOrder) return
    setCancelingOrderId(cancelConfirmOrder.id)
    try {
      await ordersApi.cancel(cancelConfirmOrder.id)
      showToast('Order cancelled successfully', 'success')
      setCancelConfirmOrder(null)
      await loadOrders()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to cancel order'
      showToast(errorMsg, 'error')
    } finally {
      setCancelingOrderId(null)
    }
  }

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((order: any) => order.status === statusFilter)
    }

    // Apply sort order
    filtered = [...filtered].sort((a: any, b: any) => {
      const dateA = new Date(a.orderDate).getTime()
      const dateB = new Date(b.orderDate).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [orders, statusFilter, sortOrder])

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-8"
        >
          <Package size={20} className="sm:w-6 sm:h-6 text-indigo-500 dark:text-indigo-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            Your Orders
          </h1>
        </motion.div>

        {/* Filters */}
        {!isLoading && orders.length > 0 && (
          <OrderFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-lg text-red-500 dark:text-red-400">Error loading orders: {error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">You have no orders yet</p>
            <Link
              to="/shop"
              className="mt-4 inline-block text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              Start Shopping
            </Link>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Package
              size={40}
              className="sm:w-12 sm:h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3 sm:mb-4"
            />
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
              No orders match your filters
            </p>
            <button
              onClick={() => setStatusFilter('')}
              className="mt-3 sm:mt-4 inline-block text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {filteredAndSortedOrders.map((order: any) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                formatPrice={formatPrice}
                onCancel={handleCancelOrder}
                cancelingOrderId={cancelingOrderId}
              />
            ))}
          </div>
        )}

        {cancelConfirmOrder && (
          <ConfirmModal
            open={true}
            onCancel={() => setCancelConfirmOrder(null)}
            onConfirm={confirmCancel}
            title="Cancel Order"
            message={`Are you sure you want to cancel order #${cancelConfirmOrder.id.slice(0, 8)}...? This action cannot be undone.`}
            confirmLabel="Cancel Order"
            danger={true}
            loading={cancelingOrderId === cancelConfirmOrder.id}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default WithAuth(UserOrders)
