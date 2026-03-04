import { useEffect, useState } from 'react'
import { FileQuestion, Eye, Trash2, CheckSquare, Square, Send, Search } from 'lucide-react'
import Modal from '@/components/common/Modal'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { adminApi, type AdminIncompleteOrder } from '@/api/admin'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'

export default function AdminIncompleteOrders() {
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [list, setList] = useState<AdminIncompleteOrder[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<AdminIncompleteOrder | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<AdminIncompleteOrder | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [sendingMarketingId, setSendingMarketingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.incompleteOrders.list({
        limit: 100,
        search: search.trim() || undefined,
      })
      setList(res.data.data?.incompleteOrders ?? [])
      setTotalResults(res.data.data?.totalResults ?? 0)
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
  }, [search])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await adminApi.incompleteOrders.get(id)
      setDetail(res.data.data)
    } catch {
      showToast('Failed to load details', 'error')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingOrder) return
    try {
      await adminApi.incompleteOrders.delete(deletingOrder.id)
      showToast('Incomplete order deleted successfully', 'success')
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
      const deletePromises = Array.from(selectedOrders).map((id) => adminApi.incompleteOrders.delete(id))
      await Promise.all(deletePromises)
      showToast(`${selectedOrders.size} incomplete order(s) deleted successfully`, 'success')
      setSelectedOrders(new Set())
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete'
      showToast(msg, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleSendMarketing = async (io: AdminIncompleteOrder) => {
    if (!io.user?.email) {
      showToast('No email for this user. Cannot send marketing message.', 'error')
      return
    }
    setSendingMarketingId(io.id)
    try {
      await adminApi.incompleteOrders.sendMarketing(io.id)
      showToast('Marketing message sent successfully', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send'
      showToast(msg, 'error')
    } finally {
      setSendingMarketingId(null)
    }
  }

  return (
    
      <><div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Incomplete Orders</h1>
            <p className="text-sm text-gray-500">
              Users who visited checkout/cart but did not complete. Total: {totalResults}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
                placeholder="Search by user name, email, ID..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm w-56"
              />
            </div>
            <button
              type="button"
              onClick={() => setSearch(searchInput)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              <Search size={14} />
              Search
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedOrders.size} selected</span>
              <button
                type="button"
                onClick={() => setDeletingOrder({ id: 'bulk' } as AdminIncompleteOrder)}
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
              <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!loading && !error && list.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileQuestion className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No incomplete orders yet.</p>
          </div>
        )}

        {!loading && !error && list.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Select all"
                      >
                        {selectedOrders.size === list.length && list.length > 0 ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Subtotal</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Visited At</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((io) => (
                    <tr key={io.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedOrders.has(io.id) ? 'bg-indigo-50' : ''}`}>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectOrder(io.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Select incomplete order"
                        >
                          {selectedOrders.has(io.id) ? (
                            <CheckSquare size={18} className="text-indigo-600" />
                          ) : (
                            <Square size={18} className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        {io.user ? (
                          <div>
                            <p className="font-medium text-gray-800">{io.user.name}</p>
                            <p className="text-xs text-gray-500">{io.user.email}</p>
                            <p className="text-xs text-gray-400">ID: {io.user.id}</p>
                          </div>
                        ) : io.userId ? (
                          <div>
                            <p className="font-medium text-gray-600">User (deleted or not found)</p>
                            <p className="text-xs text-gray-400">ID: {io.userId}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">Guest (session)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{formatPrice(io.subtotal)}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {io.visitedAt ? new Date(io.visitedAt).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(io.id)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            aria-label="View details"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendMarketing(io)}
                            disabled={!io.user?.email || sendingMarketingId === io.id}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Send marketing message"
                            title={io.user?.email ? 'Send marketing message (Hi, product দেখলেন কিনলেন না, দেরি না করে কিনে ফেলুন)' : 'No email – cannot send'}
                          >
                            <Send size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(io)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            aria-label="Delete incomplete order"
                            title="Delete Incomplete Order"
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
            title={deletingOrder.id === 'bulk' ? 'Delete Selected Incomplete Orders' : 'Delete Incomplete Order'}
            message={
              deletingOrder.id === 'bulk'
                ? `Are you sure you want to delete ${selectedOrders.size} incomplete order(s)? This action cannot be undone.`
                : `Are you sure you want to delete incomplete order ${deletingOrder.id.slice(0, 8)}...? This action cannot be undone.`
            }
            confirmLabel="Delete"
            danger={true}
            loading={bulkDeleting}
          />
        )}

        {detail && (
          <Modal
            open={true}
            onClose={() => setDetail(null)}
            title="Incomplete Order Details"
            size="lg"
          >
            {detailLoading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500">User</p>
                  <p className="font-medium">
                    {detail.user
                      ? `${detail.user.name} (${detail.user.email})`
                      : detail.userId
                        ? `User (deleted or not found) - ID: ${detail.userId}`
                        : 'Guest'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="font-medium">{formatPrice(detail.subtotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Visited</p>
                  <p>{detail.visitedAt ? new Date(detail.visitedAt).toLocaleString() : '—'}</p>
                </div>
                {detail.items && detail.items.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Cart items</p>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left py-2 px-3">Product</th>
                            <th className="text-left py-2 px-3">SKU</th>
                            <th className="text-right py-2 px-3">Qty</th>
                            <th className="text-right py-2 px-3">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.items.map((it, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                              <td className="py-2 px-3">{it.productName}</td>
                              <td className="py-2 px-3 font-mono text-xs">{it.sku}</td>
                              <td className="py-2 px-3 text-right">{it.quantity}</td>
                              <td className="py-2 px-3 text-right">{formatPrice(it.price * it.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </>
  )
}
