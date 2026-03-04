import { useMemo } from 'react'
import { motion } from 'framer-motion'
import useFormatPrice from '@/hooks/useFormatPrice'
import formatDate from '@/utils/formatDate'
import { Calendar, Package, ShoppingBag } from 'lucide-react'
import ToggleableText from '@/components/atoms/ToggleableText'

export default function OrderSummary({ order }: { order: any }) {
  const formatPrice = useFormatPrice()
  // order.amount = final total (items + shipping already; no platform fees)
  const shippingAmount = order.shippingAmount ?? 0
  const itemsSubtotal = useMemo(() => {
    if (!order.orderItems?.length) return order.amount - shippingAmount
    return order.orderItems.reduce(
      (sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity,
      0
    )
  }, [order.orderItems, order.amount, shippingAmount])
  const total = order.amount

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700"
    >
      <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4">Order Details</h2>

      {/* Order Details Section */}
      <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <Package size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-800 dark:text-gray-200">Order Tracking:</span>
            <ToggleableText
              content={order?.trackingNumber || order?.shipment?.trackingNumber || 'Not available'}
              truncateLength={15}
            />
          </div>
          {order?.shipment?.trackingNumber && order?.trackingNumber !== order?.shipment?.trackingNumber && (
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <Package size={16} className="text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-800 dark:text-gray-200">Shipment Tracking:</span>
              <ToggleableText
                content={order.shipment.trackingNumber}
                truncateLength={15}
              />
            </div>
          )}
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <ShoppingBag size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-800 dark:text-gray-200">Order ID:</span>
            <ToggleableText content={order?.id} truncateLength={10} />
          </div>
          <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
            <Calendar size={16} className="text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-800 dark:text-gray-200">
              Placed on {formatDate(order.orderDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary Section – no platform fees; shipping already in total */}
      <div className="space-y-3">
        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <p>Product Price</p>
          <div className="flex items-center space-x-4">
            <span className="text-gray-500 dark:text-gray-400">
              {order.orderItems?.length || 0} Item(s)
            </span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {formatPrice(itemsSubtotal)}
            </span>
          </div>
        </div>
        {shippingAmount > 0 && (
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <p>Shipping</p>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {formatPrice(shippingAmount)}
            </span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="font-semibold text-gray-800 dark:text-gray-100">Total</p>
          <span className="font-semibold text-gray-800 dark:text-gray-100">{formatPrice(total)}</span>
        </div>
      </div>
    </motion.div>
  )
}
