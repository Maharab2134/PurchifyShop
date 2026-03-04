import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  XCircle,
  RotateCcw,
  DollarSign,
  ShoppingBag,
} from 'lucide-react'
import { motion } from 'framer-motion'
import getStatusStep from '@/utils/getStatusStep'
import formatDate from '@/utils/formatDate'

export default function OrderStatus({ order }: { order: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
      case 'PROCESSING':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
      case 'SHIPPED':
        return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300'
      case 'IN_TRANSIT':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
      case 'DELIVERED':
        return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
      case 'CANCELED':
        return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
      case 'RETURNED':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
      case 'REFUNDED':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={24} />
      case 'PROCESSING':
        return <Package size={24} />
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return <Truck size={24} />
      case 'DELIVERED':
        return <CheckCircle size={24} />
      case 'CANCELED':
        return <XCircle size={24} />
      case 'RETURNED':
        return <RotateCcw size={24} />
      case 'REFUNDED':
        return <DollarSign size={24} />
      default:
        return <ShoppingBag size={24} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending'
      case 'PROCESSING':
        return 'Processing'
      case 'SHIPPED':
        return 'Shipped'
      case 'IN_TRANSIT':
        return 'In Transit'
      case 'DELIVERED':
        return 'Delivered'
      case 'CANCELED':
        return 'Canceled'
      case 'RETURNED':
        return 'Returned'
      case 'REFUNDED':
        return 'Refunded'
      default:
        return 'Unknown'
    }
  }

  const getStatusDate = (status: string) => {
    switch (status) {
      case 'PENDING':
        return formatDate(order.createdAt || order.orderDate)
      case 'PROCESSING':
        return formatDate(order.createdAt || order.orderDate)
      case 'SHIPPED':
        return order.shipment?.shippedDate
          ? formatDate(order.shipment.shippedDate)
          : 'Pending'
      case 'IN_TRANSIT':
        return order.shipment?.shippedDate
          ? formatDate(order.shipment.shippedDate)
          : 'Pending'
      case 'DELIVERED':
        return order.shipment?.deliveryDate
          ? formatDate(order.shipment.deliveryDate)
          : 'Pending'
      case 'CANCELED':
      case 'RETURNED':
      case 'REFUNDED':
        return order.transaction?.updatedAt
          ? formatDate(order.transaction.updatedAt)
          : formatDate(order.updatedAt || order.orderDate)
      default:
        return 'N/A'
    }
  }

  const transactionStatus = order.transaction?.status || order.status
  const currentStep = getStatusStep(transactionStatus)
  const isTerminalStatus = ['CANCELED', 'RETURNED', 'REFUNDED'].includes(
    transactionStatus
  )
  const statusSteps = isTerminalStatus
    ? ['PENDING', transactionStatus]
    : ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <p
            className={`font-medium px-3 py-1 rounded-full flex items-center ${getStatusColor(
              transactionStatus
            )}`}
          >
            {getStatusIcon(transactionStatus)}
            <span className="ml-2">{getStatusText(transactionStatus)}</span>
          </p>
        </div>
      </div>

      {/* Status Steps */}
      <div className="flex flex-wrap justify-between relative mt-6">
        {/* Progress line */}
        <div
          className="absolute top-5 left-0 h-1 bg-gray-200 dark:bg-gray-700 w-full"
          style={{ zIndex: 1 }}
        ></div>
        <div
          className="absolute top-5 left-0 h-1 bg-blue-500 dark:bg-blue-400 transition-all duration-500"
          style={{
            zIndex: 2,
            width: `${
              ((currentStep - 1) / Math.max(statusSteps.length - 1, 1)) * 100
            }%`,
          }}
        ></div>
        {statusSteps.map((status, index) => (
          <motion.div
            key={status}
            className={`flex flex-col items-center z-10 ${
              statusSteps.length === 2 ? 'w-1/2' : `w-1/${statusSteps.length}`
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div
              className={`w-12 h-12 rounded-md flex items-center justify-center mb-2 ${
                currentStep >= index + 1
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              }`}
            >
              {getStatusIcon(status)}
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{getStatusText(status)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{getStatusDate(status)}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
