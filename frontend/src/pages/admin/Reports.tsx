import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, DollarSign, Package, Users } from 'lucide-react'
import { adminApi } from '@/api/admin'
import {
  createSalesReportDocx,
  createProductsReportDocx,
  createUsersReportDocx,
  downloadBlob,
} from '@/utils/wordReport'

const dateStr = () => new Date().toISOString().slice(0, 10)

export default function AdminReports() {
  const [reportDownloading, setReportDownloading] = useState<'sales' | 'products' | 'users' | null>(null)

  const downloadSalesReport = async () => {
    setReportDownloading('sales')
    try {
      const res = await adminApi.analytics()
      const d = res.data.data
      const blob = await createSalesReportDocx({
        ordersTotal: d?.ordersTotal ?? 0,
        ordersCount: d?.ordersCount ?? 0,
        refundedOrdersTotal: d?.refundedOrdersTotal,
        refundedOrdersCount: d?.refundedOrdersCount,
        salesPerDay: d?.salesPerDay,
        mostSoldProducts: d?.mostSoldProducts,
        popularCustomers: d?.popularCustomers,
      })
      downloadBlob(blob, `Sales-Report-${dateStr()}.docx`)
    } catch {
      // ignore
    } finally {
      setReportDownloading(null)
    }
  }

  const downloadProductsReport = async () => {
    setReportDownloading('products')
    try {
      const res = await adminApi.products.list({ limit: 5000 })
      const products = res.data.data?.products ?? []
      const blob = await createProductsReportDocx(
        products.map((p: { name: string; slug: string; category?: { name: string } | null; status: string; discountedPrice: number; totalStock: number; variantCount?: number }) => ({
          name: p.name,
          slug: p.slug,
          category: p.category,
          status: p.status,
          discountedPrice: p.discountedPrice,
          totalStock: p.totalStock,
          variantCount: p.variantCount,
        }))
      )
      downloadBlob(blob, `Products-Report-${dateStr()}.docx`)
    } catch {
      // ignore
    } finally {
      setReportDownloading(null)
    }
  }

  const downloadUsersReport = async () => {
    setReportDownloading('users')
    try {
      const res = await adminApi.users.list({ limit: 5000 })
      const users = res.data.data?.users ?? []
      const blob = await createUsersReportDocx(
        users.map((u: { name: string; email: string; role: string; createdAt?: string }) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
        }))
      )
      downloadBlob(blob, `Users-Report-${dateStr()}.docx`)
    } catch {
      // ignore
    } finally {
      setReportDownloading(null)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Reports</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Download Sales, Products, or Users report as Word (.docx) with a professional template. Use for accounting, inventory, or user management.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Sales Report</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenue, orders, trends</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Summary, sales per day, most sold products, and popular customers.
          </p>
          <button
            type="button"
            onClick={downloadSalesReport}
            disabled={reportDownloading !== null}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {reportDownloading === 'sales' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {reportDownloading === 'sales' ? 'Downloading…' : 'Download as Word'}
          </button>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Products Report</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Catalog &amp; stock</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            All products with name, category, price, and stock.
          </p>
          <button
            type="button"
            onClick={downloadProductsReport}
            disabled={reportDownloading !== null}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {reportDownloading === 'products' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {reportDownloading === 'products' ? 'Downloading…' : 'Download as Word'}
          </button>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-white dark:from-violet-900/20 dark:to-gray-800/50 p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 dark:bg-violet-500/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Users Report</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Accounts &amp; roles</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            All users with name, email, role, and join date.
          </p>
          <button
            type="button"
            onClick={downloadUsersReport}
            disabled={reportDownloading !== null}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {reportDownloading === 'users' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {reportDownloading === 'users' ? 'Downloading…' : 'Download as Word'}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
