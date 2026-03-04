import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck, RefreshCw, ExternalLink, CheckCircle, XCircle, Loader2, Settings, Trash2, Search, CheckSquare, Square, Plus } from 'lucide-react'
import Button from '@/components/atoms/Button'
import { adminApi, type AdminOrder } from '@/api/admin'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'

export default function AdminSteadfastCourier() {
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<{
    configured: boolean
    active?: boolean
    balance?: number | null
    message?: string
  } | null>(null)
  const [loadingApiStatus, setLoadingApiStatus] = useState(false)
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [statusById, setStatusById] = useState<Record<string, string>>({})
  const [loadingStatusId, setLoadingStatusId] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [savingWeightId, setSavingWeightId] = useState<string | null>(null)
  const RESULTS_PER_PAGE = 15
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const loadOrders = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminApi.orders.list({
        limit: RESULTS_PER_PAGE,
        page,
        search: searchQuery.trim() || undefined,
        courierPage: 'steadfast',
      })
      const data = res.data.data
      setOrders(data?.orders ?? [])
      setTotalPages(data?.totalPages ?? 1)
      setTotalResults(data?.totalResults ?? 0)
      setCurrentPage(data?.currentPage ?? 1)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load orders'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadApiStatus = async () => {
    setLoadingApiStatus(true)
    try {
      const res = await adminApi.steadfast.status()
      setApiStatus(res.data.data ?? null)
    } catch {
      setApiStatus({ configured: false, message: 'Failed to check API' })
    } finally {
      setLoadingApiStatus(false)
    }
  }

  useEffect(() => {
    loadOrders(currentPage)
    loadApiStatus()
  }, [currentPage, searchQuery])

  const applySearch = () => {
    setSearchQuery(searchInput.trim())
    setCurrentPage(1)
  }

  const toggleSelect = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) setSelectedOrders(new Set())
    else setSelectedOrders(new Set(orders.map((o) => o.id)))
  }

  const deleteOrder = async (orderId: string) => {
    if (!window.confirm('Permanently delete this order? This cannot be undone.')) return
    setDeletingId(orderId)
    try {
      await adminApi.orders.delete(orderId)
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      setTotalResults((n) => Math.max(0, n - 1))
      setSelectedOrders((prev) => {
        const next = new Set(prev)
        next.delete(orderId)
        return next
      })
      showToast('Order deleted', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete order'
      showToast(msg, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const deleteSelected = async () => {
    if (selectedOrders.size === 0) return
    if (!window.confirm(`Delete ${selectedOrders.size} selected order(s)? This cannot be undone.`)) return
    const count = selectedOrders.size
    setBulkDeleting(true)
    try {
      await Promise.all(Array.from(selectedOrders).map((id) => adminApi.orders.delete(id)))
      setSelectedOrders(new Set())
      showToast(`${count} order(s) deleted`, 'success')
      await loadOrders(currentPage)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete some orders'
      showToast(msg, 'error')
      await loadOrders(currentPage)
    } finally {
      setBulkDeleting(false)
    }
  }

  const saveParcelWeight = async (orderId: string, value: string) => {
    const weight = value.trim() === '' ? null : parseFloat(value)
    if (weight !== null && (Number.isNaN(weight) || weight < 0)) return
    setSavingWeightId(orderId)
    try {
      await adminApi.orders.updateParcelWeight(orderId, weight)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, parcelWeight: weight ?? undefined } : o)),
      )
      showToast('Weight saved', 'success')
    } catch {
      showToast('Failed to save weight', 'error')
    } finally {
      setSavingWeightId(null)
    }
  }

  const createParcel = async (orderId: string) => {
    setCreatingId(orderId)
    try {
      const res = await adminApi.orders.steadfastCreate(orderId)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, shipment: res.data.data?.order?.shipment ?? o.shipment, status: res.data.data?.order?.status ?? o.status } : o)),
      )
      showToast(res.data.message ?? 'Steadfast parcel created', 'success')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; steadfast?: { message?: string } }; status?: number } }
      const msg = err?.response?.data?.message ?? err?.response?.data?.steadfast?.message ?? 'Failed to create parcel. Check Courier → Settings → Steadfast Settings.'
      showToast(msg, 'error')
    } finally {
      setCreatingId(null)
    }
  }

  const checkStatus = async (orderId: string) => {
    setLoadingStatusId(orderId)
    try {
      const res = await adminApi.orders.steadfastStatus(orderId)
      setStatusById((prev) => ({ ...prev, [orderId]: res.data.data?.delivery_status ?? '—' }))
      showToast('Status updated', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to get status'
      showToast(msg, 'error')
    } finally {
      setLoadingStatusId(null)
    }
  }

  const cancelSteadfast = async (orderId: string) => {
    if (!window.confirm('Remove this order from Steadfast? Our link will be cleared and order set to PROCESSING. Cancel the consignment manually on Steadfast portal if needed.')) return
    setCancelingId(orderId)
    try {
      const res = await adminApi.orders.steadfastCancel(orderId)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, shipment: res.data.data?.order?.shipment ?? null, status: res.data.data?.order?.status ?? o.status } : o)),
      )
      setStatusById((prev) => {
        const next = { ...prev }
        delete next[orderId]
        return next
      })
      showToast(res.data.message ?? 'Steadfast link removed', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to cancel/remove'
      showToast(msg, 'error')
    } finally {
      setCancelingId(null)
    }
  }

  const isSteadfast = (o: AdminOrder) => o.shipment?.courierCompany === 'Steadfast'
  const canCreate = (o: AdminOrder) =>
    !isSteadfast(o) && o.status !== 'CANCELED' && o.status !== 'DELIVERED'

  const statusBadge = (status: string) => {
    const c: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      IN_TRANSIT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
      CANCELED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    }
    return c[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <Truck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Steadfast Courier Management
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Create parcels and check status manually. Configure in Courier → Settings.
            </p>
          </div>
        </div>
      </div>

      {apiStatus != null && apiStatus.active === false && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Steadfast Courier service is inactive.</strong> Enable it in Courier → Settings to create parcels and use the API.
          </p>
          <Link to="/dashboard/courier/settings">
            <Button type="button" variant="secondary" size="sm">Open Settings</Button>
          </Link>
        </div>
      )}

      {/* API status card */}
      <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">API Integration</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Courier → Settings → Steadfast Settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadApiStatus}
              disabled={loadingApiStatus || apiStatus?.active === false}
            >
              {loadingApiStatus ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking…
                </span>
              ) : (
                'Test connection'
              )}
            </Button>
            {apiStatus != null && (
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${apiStatus.configured ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                {apiStatus.configured ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {apiStatus.configured ? (apiStatus.message ?? 'Connected') + (apiStatus.balance != null ? ` • ${formatPrice(apiStatus.balance)}` : '') : (apiStatus.message ?? 'Not configured')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Orders table card */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Orders
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                Enter <strong>Weight (kg)</strong> then blur to save, then click <strong>Create parcel</strong>. Weight is sent to Steadfast.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-hidden">
                <span className="pl-3 flex items-center text-gray-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search order, phone, customer…"
                  className="w-48 sm:w-56 py-2 pr-3 pl-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-0"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                />
                <Button type="button" variant="secondary" size="sm" onClick={applySearch} disabled={loading} className="!rounded-none !border-0" title="Search">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {selectedOrders.size > 0 && (
                <Button type="button" variant="secondary" size="sm" onClick={deleteSelected} disabled={bulkDeleting} className="!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20">
                  {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 inline mr-1" />}
                  Delete selected ({selectedOrders.size})
                </Button>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={() => loadOrders(currentPage)} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-500" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading orders…</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                    <th className="px-4 py-3 w-10">
                      <button type="button" onClick={toggleSelectAll} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600" title={selectedOrders.size === orders.length ? 'Deselect all' : 'Select all'}>
                        {orders.length > 0 && selectedOrders.size === orders.length ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Weight (kg)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tracking</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center">
                        <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                        <p className="mt-3 text-gray-500 dark:text-gray-400">No orders to show</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Orders will appear here when customers place orders.</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 w-10">
                          <button type="button" onClick={() => toggleSelect(o.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                            {selectedOrders.has(o.id) ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/dashboard/orders/${o.id}`} className="font-mono text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                            {o.trackingNumber ?? o.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{o.user?.name ?? '—'}</span>
                          {o.contactPhone && <span className="text-gray-500 dark:text-gray-400 ml-1">({o.contactPhone})</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatPrice(o.amount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              className="w-20 px-2.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-500"
                              value={o.parcelWeight != null ? String(o.parcelWeight) : ''}
                              onBlur={(e) => saveParcelWeight(o.id, e.target.value)}
                              onChange={(e) =>
                                setOrders((prev) =>
                                  prev.map((ord) =>
                                    ord.id === o.id ? { ...ord, parcelWeight: e.target.value === '' ? null : parseFloat(e.target.value) || null } : ord,
                                  ),
                                )
                              }
                              disabled={!!savingWeightId}
                            />
                            <span className="text-xs text-gray-400">kg</span>
                            {savingWeightId === o.id && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${statusBadge(o.status)}`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isSteadfast(o) ? (
                            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                              {o.shipment?.courierTrackingId ?? '—'}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          {statusById[o.id] && <span className="ml-1 text-xs text-gray-500">({statusById[o.id]})</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {canCreate(o) && (
                              <Button type="button" variant="primary" size="sm" onClick={() => createParcel(o.id)} disabled={!!creatingId || apiStatus?.active === false} title="Create parcel" className="!p-2">
                                {creatingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                              </Button>
                            )}
                            {isSteadfast(o) && (
                              <>
                                <Button type="button" variant="secondary" size="sm" onClick={() => checkStatus(o.id)} disabled={!!loadingStatusId} title="Check status" className="!p-2">
                                  {loadingStatusId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                </Button>
                                <Button type="button" variant="secondary" size="sm" onClick={() => cancelSteadfast(o.id)} disabled={!!cancelingId} className="!p-2 !text-amber-600 hover:!bg-amber-50 dark:hover:!bg-amber-900/20" title="Remove from Steadfast">
                                  {cancelingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                </Button>
                              </>
                            )}
                            <Link to={`/dashboard/orders/${o.id}`}>
                              <Button type="button" variant="secondary" size="sm" title="View" className="!p-2"><ExternalLink className="w-4 h-4" /></Button>
                            </Link>
                            <Button type="button" variant="secondary" size="sm" onClick={() => deleteOrder(o.id)} disabled={!!deletingId} className="!p-2 !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20" title="Delete order">
                              {deletingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination - always show when there are orders */}
            {orders.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page <span className="font-medium text-gray-900 dark:text-gray-100">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                  <span className="ml-2 text-gray-500">({totalResults} total, {RESULTS_PER_PAGE} per page)</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1 || loading}>
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) pageNum = i + 1
                    else if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                    else pageNum = currentPage - 2 + i
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  <Button type="button" variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || loading}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
