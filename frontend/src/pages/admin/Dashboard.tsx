import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Users, Package, ShoppingCart, Store, Activity, Trash2, AlertTriangle } from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import { adminApi, type AdminRecentActivity } from '@/api/admin'
import useFormatPrice from '@/hooks/useFormatPrice'

export default function AdminDashboard() {
  const formatPrice = useFormatPrice()
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState<{
    ordersTotal: number
    ordersCount: number
    refundedOrdersTotal?: number
    refundedOrdersCount?: number
    usersCount: number
    productsCount: number
    vendorsCount?: number
    recentOrders: Array<{
      id: string
      amount: number
      orderDate: string
      status: string
      user: { name: string; email: string } | null
    }>
    salesPerDay?: Array<{ date: string; sales: number }>
    mostSoldProducts?: Array<{ productId: string; productName: string; totalQuantity: number }>
    popularCustomers?: Array<{
      userId: string | null
      name: string
      email: string
      orderCount: number
      totalSpent: number
    }>
    lowStockItems?: Array<{
      variantId: string
      productId: string
      productName: string
      sku: string
      stock: number
      lowStockThreshold: number
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<AdminRecentActivity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [clearing, setClearing] = useState<string | null>(null)

  const refetch = () => {
    setLoading(true)
    setActivitiesLoading(true)
    Promise.allSettled([
      adminApi.analytics().then((res) => setData(res.data.data)),
      adminApi.activities.recent({ limit: 12 }).then((res) => setActivities(res.data.data.activities ?? [])),
    ]).finally(() => {
      setLoading(false)
      setActivitiesLoading(false)
      setClearing(null)
    })
  }

  const handleClearOrders = () => {
    if (!window.confirm('All orders and related data (order items, payments, etc.) will be permanently deleted. Continue?')) return
    setClearing('orders')
    adminApi.orders.clear().then(() => refetch()).catch(() => setClearing(null))
  }

  const handleClearActivities = () => {
    if (!window.confirm('All recent activities will be cleared. Continue?')) return
    setClearing('activities')
    adminApi.activities.clear().then(() => refetch()).catch(() => setClearing(null))
  }

  useEffect(() => {
    setLoading(true)
    setActivitiesLoading(true)
    Promise.allSettled([
      adminApi.analytics().then((res) => setData(res.data.data)),
      adminApi.activities.recent({ limit: 12 }).then((res) => setActivities(res.data.data.activities ?? [])),
    ])
      .then((results) => {
        const analyticsRes = results[0]
        if (analyticsRes.status === 'rejected') {
            setError(analyticsRes.reason?.response?.data?.message as string ?? 'Failed to load analytics')
        } else {
          setError(null)
        }
      })
      .finally(() => {
        setLoading(false)
        setActivitiesLoading(false)
      })
  }, [location.pathname])

  const chartData = useMemo(() => {
    const revenue = data?.ordersTotal ?? 0
    const orders = data?.ordersCount ?? 0
    const refunded = data?.refundedOrdersTotal ?? 0
    const users = data?.usersCount ?? 0
    const products = data?.productsCount ?? 0
    const vendors = data?.vendorsCount ?? 0
    const max = Math.max(revenue, orders, refunded, users, products, vendors, 1)
    return [
      { name: 'Revenue', value: revenue, display: formatPrice(revenue), normalized: (revenue / max) * 100, fill: '#16a34a' },
      { name: 'Orders', value: orders, display: String(orders), normalized: (orders / max) * 100, fill: '#2563eb' },
      { name: 'Refunded', value: refunded, display: formatPrice(refunded), normalized: (refunded / max) * 100, fill: '#dc2626' },
      { name: 'Users', value: users, display: String(users), normalized: (users / max) * 100, fill: '#9333ea' },
      { name: 'Products', value: products, display: String(products), normalized: (products / max) * 100, fill: '#d97706' },
      { name: 'Vendors', value: vendors, display: String(vendors), normalized: (vendors / max) * 100, fill: '#059669' },
    ]
  }, [data?.ordersTotal, data?.ordersCount, data?.refundedOrdersTotal, data?.usersCount, data?.productsCount, data?.vendorsCount, formatPrice])

  // Sales per day: group by month, then by day (1–31) for line chart
  const { salesPerDayChartData, salesPerDayMonthKeys } = useMemo(() => {
    const raw = data?.salesPerDay ?? []
    const byMonth: Record<string, Record<number, number>> = {}
    const monthOrder: string[] = []
    raw.forEach(({ date, sales }) => {
      const d = new Date(date)
      const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      const day = d.getDate()
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {}
        monthOrder.push(monthKey)
      }
      if (!byMonth[monthKey][day]) byMonth[monthKey][day] = 0
      byMonth[monthKey][day] += sales
    })
    const days = Array.from({ length: 31 }, (_, i) => i + 1)
    const chartData = days.map((day) => {
      const row: Record<string, number | string> = { day }
      monthOrder.forEach((m) => {
        row[m] = byMonth[m]?.[day] ?? 0
      })
      return row
    })
    return { salesPerDayChartData: chartData, salesPerDayMonthKeys: monthOrder }
  }, [data?.salesPerDay])

  const SALES_PER_DAY_COLORS = ['#eab308', '#9333ea', '#06b6d4', '#16a34a', '#dc2626']

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-4 sm:p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 sm:h-80 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: formatPrice(data?.ordersTotal ?? 0),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
      link: '/dashboard/transactions',
    },
    {
      title: 'Total Orders',
      value: String(data?.ordersCount ?? 0),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      link: '/dashboard/orders',
    },
    {
      title: 'Total Users',
      value: String(data?.usersCount ?? 0),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      link: '/dashboard/users',
    },
    {
      title: 'Total Products',
      value: String(data?.productsCount ?? 0),
      icon: Package,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      link: '/dashboard/products',
    },
    {
      title: 'Total Vendors',
      value: String(data?.vendorsCount ?? 0),
      icon: Store,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      link: '/dashboard/vendors',
    },
  ]

  return (
    <motion.div
        className="p-4 sm:p-6 min-h-screen space-y-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Dashboard Overview
        </h1>

        {/* Low stock warning */}
        {data?.lowStockItems && data.lowStockItems.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800">
                Low stock warning — {data.lowStockItems.length} item{data.lowStockItems.length !== 1 ? 's' : ''} below threshold
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                {data.lowStockItems.slice(0, 8).map((item) => (
                  <li key={item.variantId}>
                    <strong>{item.productName}</strong> — SKU: {item.sku}, stock: {item.stock} (threshold: {item.lowStockThreshold})
                  </li>
                ))}
                {data.lowStockItems.length > 8 && (
                  <li className="text-amber-600">… and {data.lowStockItems.length - 8} more</li>
                )}
              </ul>
              <Link
                to="/dashboard/products"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-amber-800 hover:text-amber-900"
              >
                Manage products & stock
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.title}
                to={s.link}
                className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-sm text-gray-500 mb-1">{s.title}</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors duration-200">{s.value}</p>
              </Link>
            )
          })}
        </div>

        {/* Sales per day | Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Sales per day</h2>
              <button
                type="button"
                onClick={handleClearOrders}
                disabled={!!clearing}
                title="Clear orders (clears this section data)"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="h-64 sm:h-80 w-full">
              {salesPerDayChartData.length > 0 && salesPerDayMonthKeys.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesPerDayChartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm">
                            <p className="font-medium text-gray-800 mb-1">Day {label}</p>
                            {payload.map((p) => (
                              <p key={p.dataKey} className="text-gray-600">
                                {p.name}: {formatPrice(Number(p.value))}
                              </p>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Legend />
                    {salesPerDayMonthKeys.map((monthKey, i) => (
                      <Line
                        key={monthKey}
                        type="monotone"
                        dataKey={monthKey}
                        name={monthKey}
                        stroke={SALES_PER_DAY_COLORS[i % SALES_PER_DAY_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">No sales data for the last 3 months.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
              <button
                type="button"
                onClick={handleClearOrders}
                disabled={!!clearing}
                title="Clear all orders"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              {!data?.recentOrders?.length ? (
                <p className="p-6 text-gray-500 text-center">No orders yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                        <td className="py-3 px-4">
                          {o.user?.name ?? '—'} <span className="text-gray-400">{o.user?.email}</span>
                        </td>
                        <td className="py-3 px-4 font-medium">{formatPrice(o.amount)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              o.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-800'
                                : o.status === 'CANCELED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Link to={`/dashboard/orders/${o.id}`} className="text-indigo-600 hover:text-indigo-700 font-medium">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Overview Chart | Popular customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Overview Chart</h2>
              <button
                type="button"
                onClick={handleClearOrders}
                disabled={!!clearing}
                title="Clear orders (affects chart data)"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" tickFormatter={(v) => `${Math.round(v)}%`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as (typeof chartData)[0]
                      return (
                        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm">
                          <span className="font-medium text-gray-800">{d.name}:</span>{' '}
                          <span className="text-gray-700">{d.display}</span>
                        </div>
                      )
                    }}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar dataKey="normalized" radius={[6, 6, 0, 0]} maxBarSize={80}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Bar heights are relative (0–100%). Hover for actual values.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Popular customers</h2>
              <button
                type="button"
                onClick={handleClearOrders}
                disabled={!!clearing}
                title="Clear orders (clears customer data)"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              {data?.popularCustomers?.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Orders</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Total spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.popularCustomers.map((c, idx) => (
                      <tr key={c.userId ?? `cust-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-gray-500 text-xs">{c.email}</p>
                        </td>
                        <td className="py-3 px-4 font-medium">{c.orderCount}</td>
                        <td className="py-3 px-4 font-medium">{formatPrice(c.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-6 text-gray-500 text-center text-sm">No customer data yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Most sold products | Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Most sold products</h2>
              <button
                type="button"
                onClick={handleClearOrders}
                disabled={!!clearing}
                title="Clear orders (clears product sales data)"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {data?.mostSoldProducts?.length ? (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.mostSoldProducts.map((p) => ({
                      name: p.productName.length > 20 ? p.productName.slice(0, 20) + '…' : p.productName,
                      fullName: p.productName,
                      quantity: p.totalQuantity,
                    }))}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#6b7280" />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} stroke="#6b7280" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload as { fullName: string; quantity: number }
                        return (
                          <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm">
                            <p className="font-medium text-gray-800">{d.fullName}</p>
                            <p className="text-gray-600">Sold: {d.quantity} units</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="quantity" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">No product sales data yet.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-800">Recent Activities</h2>
              </div>
              <button
                type="button"
                onClick={handleClearActivities}
                disabled={!!clearing}
                title="Clear recent activities"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {activitiesLoading ? (
                <div className="h-64 bg-gray-100 rounded animate-pulse" />
              ) : activities.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activities found.</p>
              ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={(() => {
                    const levelCounts: Record<string, number> = {}
                    activities.forEach((a) => {
                      const level = String(a.level ?? 'info')
                      levelCounts[level] = (levelCounts[level] || 0) + 1
                    })
                    return Object.entries(levelCounts).map(([level, count]) => ({
                      name: level.charAt(0).toUpperCase() + level.slice(1),
                      count,
                      level,
                    }))
                  })()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#666' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#666' } }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                    content={({ payload }) => {
                      if (!payload?.[0]) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                          <p className="text-sm font-semibold text-gray-800 mb-1">{data.name}</p>
                          <p className="text-lg font-bold text-indigo-600">{data.count} activities</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={80}>
                    {(() => {
                      const levelCounts: Record<string, number> = {}
                      activities.forEach((a) => {
                        const level = String(a.level ?? 'info')
                        levelCounts[level] = (levelCounts[level] || 0) + 1
                      })
                      return Object.keys(levelCounts).map((level, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            level === 'error' ? '#dc2626' :
                            level === 'warning' ? '#f59e0b' :
                            level === 'success' ? '#16a34a' :
                            '#3b82f6'
                          }
                        />
                      ))
                    })()}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            to="/dashboard/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
          >
            Manage Products
          </Link>
          <Link
            to="/dashboard/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium text-sm"
          >
            Analytics
          </Link>
        </div>
      </motion.div>
  )
}
