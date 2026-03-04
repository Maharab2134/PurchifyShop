import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, ArrowLeft, Copy, Check, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import MainLayout from '@/components/templates/MainLayout'
import OrderItems from '@/components/orders/OrderItems'
import OrderStatus from '@/components/orders/OrderStatus'
import OrderSummary from '@/components/orders/OrderSummary'
import ShippingAddressCard from '@/components/orders/ShippingAddressCard'
import { ordersApi, type Order } from '@/api/orders'
import useToast from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import formatDate from '@/utils/formatDate'
import { formatPhoneInput, phoneValidationRule } from '@/utils/phoneValidation'

type TrackFormValues = {
  trackingNumber: string
  phone: string
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams()
  const trackingFromUrl = searchParams.get('tracking') ?? ''
  const { showToast } = useToast()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<TrackFormValues>({
    defaultValues: {
      trackingNumber: '',
      phone: user?.phone || '',
    },
  })

  // Pre-fill tracking number from URL (e.g. email "View Order" link)
  useEffect(() => {
    if (trackingFromUrl) {
      form.setValue('trackingNumber', trackingFromUrl)
    }
  }, [trackingFromUrl, form])

  // Update phone when user loads
  useEffect(() => {
    if (user?.phone) {
      form.setValue('phone', user.phone)
    }
  }, [user?.phone, form])

  const onSubmit = form.handleSubmit(async (data) => {
    setLoading(true)
    setError(null)
    setOrder(null)

    try {
      const res = await ordersApi.track(data.trackingNumber.trim(), data.phone.trim())
      setOrder(res.data.data)
      showToast('Order found successfully', 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to track order. Please check your tracking number and phone.'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  })

  const copyTrackingNumber = () => {
    if (!order?.trackingNumber) return
    navigator.clipboard.writeText(order.trackingNumber)
    setCopied(true)
    showToast('Tracking number copied', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      PROCESSING: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
      SHIPPED: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300',
      IN_TRANSIT: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
      DELIVERED: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      CANCELED: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    }
    return map[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Track Your Order
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your tracking number and phone number to view order status
          </p>
        </motion.div>

        {/* Track Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-8"
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tracking Number *
              </label>
              <input
                {...form.register('trackingNumber', { required: 'Tracking number is required' })}
                type="text"
                placeholder="e.g. ORD-20260124-ABC123"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
              />
              {form.formState.errors.trackingNumber && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.trackingNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number (used during order) *
              </label>
              <input
                {...form.register('phone', phoneValidationRule)}
                type="tel"
                inputMode="numeric"
                maxLength={11}
                onChange={(e) => {
                  const formatted = formatPhoneInput(e.target.value)
                  form.setValue('phone', formatted)
                }}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the phone number you used when placing the order
              </p>
              {form.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Track Order
                </>
              )}
            </button>
          </form>

          {error && !order && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </motion.div>

        {/* Order Details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Order Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Order Details
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Tracking:</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                          {order.trackingNumber}
                        </span>
                        <button
                          onClick={copyTrackingNumber}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Copy tracking number"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order Date</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {order.orderDate ? formatDate(order.orderDate) : '—'}
                  </p>
                </div>
              </div>

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
            </div>

            {/* Order Items */}
            {order.orderItems && order.orderItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                <OrderItems order={order} />
              </div>
            )}

            {/* Shipping Address */}
            {order.address && (
              <ShippingAddressCard order={order} />
            )}

            {/* Order Summary */}
            <OrderSummary order={order} />
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
