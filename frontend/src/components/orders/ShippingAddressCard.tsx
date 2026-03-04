import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ShippingAddressCard({ order }: { order: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center space-x-2 mb-4">
        <MapPin size={18} className="text-gray-600 dark:text-gray-400" />
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Shipping Address</h2>
      </div>

      {order.address ? (
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          {order.address.label && (
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{order.address.label}</p>
          )}
          <p className="text-gray-800 dark:text-gray-200">{order.address.street}</p>
          <p className="text-gray-600 dark:text-gray-400">
            {order.address.city}, {order.address.state}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {order.address.country} - {order.address.zip}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">No address provided</p>
      )}
    </motion.div>
  )
}
