import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Package, Eye, FileText, Download, RefreshCw, Trash2, CheckSquare, Square, Search } from 'lucide-react'
import Modal from '@/components/common/Modal'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { adminApi, type AdminOrder, type AdminOrderDetail } from '@/api/admin'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'
import OrderItems from '@/components/orders/OrderItems'
import OrderStatus from '@/components/orders/OrderStatus'
import OrderSummary from '@/components/orders/OrderSummary'
import ShippingAddressCard from '@/components/orders/ShippingAddressCard'

export default function AdminRefundedOrders() {
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const location = useLocation()
  const navigate = useNavigate()
  const openOrderId = (location.state as { openOrderId?: string } | null)?.openOrderId
  const [list, setList] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<AdminOrder | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const openedFromStateRef = useRef(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.orders.list({
        limit: 50,
        paymentStatus: 'REFUNDED',
        search: search.trim() || undefined,
      })
      setList(res.data.data?.orders ?? [])
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [location.pathname, search])

  useEffect(() => {
    if (openOrderId && !openedFromStateRef.current) {
      openedFromStateRef.current = true
      openDetail(openOrderId)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [openOrderId, navigate, location.pathname])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await adminApi.orders.get(id)
      setDetail(res.data.data)
    } catch {
      showToast('Failed to load order details', 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingOrder) return
    try {
      await adminApi.orders.delete(deletingOrder.id)
      showToast('Order deleted successfully', 'success')
      setDeletingOrder(null)
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete'
      showToast(msg, 'error')
    }
  }

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === list.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(list.map((o) => o.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return
    setBulkDeleting(true)
    try {
      const deletePromises = Array.from(selectedOrders).map((id) => adminApi.orders.delete(id))
      await Promise.all(deletePromises)
      showToast(`${selectedOrders.size} order(s) deleted successfully`, 'success')
      setSelectedOrders(new Set())
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete'
      showToast(msg, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      PROCESSING: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
      SHIPPED: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300',
      IN_TRANSIT: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
      DELIVERED: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      CANCELED: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
      RETURNED: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
      REFUNDED: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    }
    return map[status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }

  const paymentStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
      PAID: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
      REFUNDED: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
      FAILED: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300',
    }
    return map[status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }

  return (
    
      <><div className="p-4 sm:p-6">
        <div className="mb-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Refunded Orders</h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
                  placeholder="Search order ID, tracking, phone, user..."
                  className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-100 text-sm w-56"
                />
              </div>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
              >
                <Search size={14} />
                Search
              </button>
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Orders with payment status REFUNDED. These orders have been refunded to customers.
          </p>
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{selectedOrders.size} selected</span>
              <button
                type="button"
                onClick={() => setDeletingOrder({ id: 'bulk' } as AdminOrder)}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedOrders.size})
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}

        {!loading && !error && list.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <Package size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-600 dark:text-gray-400">No refunded orders yet.</p>
          </div>
        )}

        {!loading && !error && list.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 w-12">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Select all"
                      >
                        {selectedOrders.size === list.length && list.length > 0 ? (
                          <CheckSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square size={18} className="text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Order Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Payment Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr key={o.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedOrders.has(o.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectOrder(o.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Select order"
                        >
                          {selectedOrders.has(o.id) ? (
                            <CheckSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square size={18} className="text-gray-400 dark:text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openDetail(o.id)}
                          className="font-mono text-xs text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left"
                          title="View order"
                        >
                          {o.id.slice(0, 8)}…
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        {o.user ? (
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{o.user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{o.user.email}</p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">{formatPrice(o.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {o.payment ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${paymentStatusBadge(o.payment.status)}`}>
                            {o.payment.status}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {o.orderDate ? new Date(o.orderDate).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(o.id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                            aria-label="View order"
                            title="View Order"
                          >
                            <Eye size={16} />
                          </button>
                          <a
                            href={`/orders/${o.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                            aria-label="View invoice"
                            title="View Invoice"
                          >
                            <FileText size={16} />
                          </a>
                          <a
                            href={`/orders/${o.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault()
                              const win = window.open(`/orders/${o.id}/invoice`, '_blank')
                              if (win) {
                                win.onload = () => {
                                  setTimeout(() => {
                                    win.print()
                                  }, 500)
                                }
                              }
                            }}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                            aria-label="Download invoice"
                            title="Download Invoice"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(o)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            aria-label="Delete order"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {deletingOrder && (
          <ConfirmModal
            open={true}
            onCancel={() => setDeletingOrder(null)}
            onConfirm={deletingOrder.id === 'bulk' ? handleBulkDelete : handleDelete}
            title={deletingOrder.id === 'bulk' ? 'Delete Selected Orders' : 'Delete Order'}
            message={
              deletingOrder.id === 'bulk'
                ? `Are you sure you want to delete ${selectedOrders.size} order(s)? This action cannot be undone.`
                : `Are you sure you want to delete order ${deletingOrder.id.slice(0, 8)}...? This action cannot be undone.`
            }
            confirmLabel="Delete"
            danger={true}
            loading={bulkDeleting}
          />
        )}

        {detail && (
          <Modal
            open
            onClose={() => setDetail(null)}
            title="Refunded Order Details"
            size="xl"
          >
            {detailLoading ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">Loading…</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order ID</p>
                    <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{detail.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tracking</p>
                    <p className="font-mono text-sm text-gray-800 dark:text-gray-200">{detail.trackingNumber ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User</p>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      {detail.user ? (
                        <div>
                          <p>{detail.user.name} ({detail.user.email})</p>
                          {(detail.user.phone || detail.contactPhone) && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Phone: <span className="font-mono">{detail.contactPhone || detail.user.phone || '—'}</span>
                            </p>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{formatPrice(detail.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge(detail.status)}`}>
                      {detail.status}
                    </span>
                  </div>
                  {detail.payment && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Status</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${paymentStatusBadge(detail.payment.status)}`}>
                        {detail.payment.status}
                      </span>
                    </div>
                  )}
                </div>

                {detail.payment && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Refund Information</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Payment Method:</span>{' '}
                        <span className="text-gray-600 dark:text-gray-400">{detail.payment.method}</span>
                      </p>
                      <p>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Refunded Amount:</span>{' '}
                        <span className="text-red-700 dark:text-red-300 font-semibold">{formatPrice(detail.payment.amount)}</span>
                      </p>
                      {detail.payment.senderNumber && (
                        <p>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Original Sender Number:</span>{' '}
                          <span className="text-gray-600 dark:text-gray-400 font-mono">{detail.payment.senderNumber}</span>
                        </p>
                      )}
                      {detail.payment.transactionId && (
                        <p>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Transaction ID:</span>{' '}
                          <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{detail.payment.transactionId}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <OrderStatus order={detail} />

                {detail.orderItems && detail.orderItems.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Order Items</h3>
                    <OrderItems order={detail} />
                  </div>
                )}

                {detail.address && (
                  <ShippingAddressCard order={detail} />
                )}

                <OrderSummary order={detail} />
              </div>
            )}
          </Modal>
        )}
      </div>
    </>
  )
}
