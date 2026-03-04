import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ArrowLeft, Copy, Check, X, Truck } from 'lucide-react'
import MainLayout from '@/components/templates/MainLayout'
import WithAuth from '@/components/HOC/WithAuth'
import ConfirmModal from '@/components/admin/ConfirmModal'
import OrderItems from '@/components/orders/OrderItems'
import OrderStatus from '@/components/orders/OrderStatus'
import OrderSummary from '@/components/orders/OrderSummary'
import ShippingAddressCard from '@/components/orders/ShippingAddressCard'
import { ordersApi } from '@/api/orders'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'
import formatDate from '@/utils/formatDate'

function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId) return

    try {
      setIsLoading(true)
      setError(null)
      const res = await ordersApi.getById(orderId)
      setOrder(res.data.data)
    } catch (err: any) {
      console.error('Error loading order:', err)
      setError(err?.response?.data?.message || 'Failed to load order')
      showToast(
        err?.response?.data?.message || 'Failed to load order',
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="col-span-2 space-y-6">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-lg text-red-500 dark:text-red-400">
              {error || 'Order not found'}
            </p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const copyTrackingNumber = () => {
    const tracking = order.trackingNumber || order.id
    navigator.clipboard.writeText(tracking)
    setCopied(true)
    showToast('Tracking number copied', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCancelOrder = async () => {
    if (!order) return
    setCanceling(true)
    try {
      await ordersApi.cancel(order.id)
      showToast('Order cancelled successfully', 'success')
      setShowCancelConfirm(false)
      await loadOrder()
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to cancel order'
      showToast(errorMsg, 'error')
    } finally {
      setCanceling(false)
    }
  }

  // Check if order can be cancelled
  // User can only cancel if status is PENDING
  // Once admin changes to PROCESSING or beyond, user cannot cancel
  const canCancel = order?.status === 'PENDING'

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      PROCESSING: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
      SHIPPED: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300',
      IN_TRANSIT: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
      DELIVERED: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      CANCELED: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
      RETURNED: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      REFUNDED: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    }
    return map[status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              <span>Back to Orders</span>
            </Link>
          </motion.div>

          {/* Main Header Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left: Order Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Package size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      Order Details
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.orderDate ? formatDate(order.orderDate) : '—'}
                    </p>
                  </div>
                </div>
                
                {/* Order Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order ID</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {order.id.slice(0, 12)}...
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.id)
                          showToast('Order ID copied', 'success')
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copy Order ID"
                      >
                        <Copy size={14} className="text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  {order.trackingNumber && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tracking Number</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {order.trackingNumber}
                        </span>
                        <button
                          onClick={copyTrackingNumber}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Copy tracking number"
                        >
                          {copied ? (
                            <Check size={14} className="text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy size={14} className="text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Status & Actions */}
              <div className="flex flex-col items-start lg:items-end gap-4">
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${statusBadge(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  {canCancel && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={canceling}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {canceling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <>
                          <X size={16} />
                          <span>Cancel Order</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="text-right lg:text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(order.amount)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Items - Full Width on Mobile, Left Column on Desktop */}
            <div className="lg:col-span-2">
              <OrderItems order={order} />
            </div>

            {/* Right Sidebar - Status, Summary, Address */}
            <div className="lg:col-span-1 space-y-6">
              <OrderStatus order={order} />
              
              {/* Courier Information - Show when status is IN_TRANSIT */}
              {order.status === 'IN_TRANSIT' && order.shipment && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Truck size={20} className="text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Courier Information</h2>
                  </div>
                  
                  <div className="space-y-3">
                    {order.shipment.courierCompany && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Courier Company</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{order.shipment.courierCompany}</p>
                      </div>
                    )}
                    {order.shipment.courierTrackingId && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tracking ID</p>
                        <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">{order.shipment.courierTrackingId}</p>
                      </div>
                    )}
                    {order.shipment.dispatchDate && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dispatch Date</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {new Date(order.shipment.dispatchDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {order.shipment.expectedDeliveryDate && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Delivery</p>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          {new Date(order.shipment.expectedDeliveryDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              
              <OrderSummary order={order} />
              <ShippingAddressCard order={order} />
            </div>
          </div>

          {showCancelConfirm && (
            <ConfirmModal
              open={true}
              onCancel={() => setShowCancelConfirm(false)}
              onConfirm={handleCancelOrder}
              title="Cancel Order"
              message={`Are you sure you want to cancel order #${order.id.slice(0, 8)}...? This action cannot be undone.`}
              confirmLabel="Cancel Order"
              danger={true}
              loading={canceling}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}

export default WithAuth(OrderTrackingPage)
