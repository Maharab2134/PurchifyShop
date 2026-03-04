import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck, RefreshCw, ExternalLink, CheckCircle, XCircle, Loader2, Settings, Trash2, Search, CheckSquare, Square, Plus } from 'lucide-react'
import Button from '@/components/atoms/Button'
import { adminApi, type AdminOrder } from '@/api/admin'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'

export default function AdminPathaoCourier() {
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<{
    configured: boolean
    active?: boolean
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
  // Create parcel modal: delivery location (Pathao city/zone/area)
  const [parcelModalOrderId, setParcelModalOrderId] = useState<string | null>(null)
  const [parcelCityId, setParcelCityId] = useState<number | ''>('')
  const [parcelZoneId, setParcelZoneId] = useState<number | ''>('')
  const [parcelAreaId, setParcelAreaId] = useState<number | ''>('')
  const [parcelCities, setParcelCities] = useState<Array<{ city_id: number; city_name: string }>>([])
  const [parcelZones, setParcelZones] = useState<Array<{ zone_id: number; zone_name: string }>>([])
  const [parcelAreas, setParcelAreas] = useState<Array<{ area_id: number; area_name: string }>>([])
  const [parcelLoadingCities, setParcelLoadingCities] = useState(false)
  const [parcelLoadingZones, setParcelLoadingZones] = useState(false)
  const [parcelLoadingAreas, setParcelLoadingAreas] = useState(false)

  const loadOrders = async (page = 1) => {
    setLoading(true)
    try {
      const res = await adminApi.orders.list({
        limit: RESULTS_PER_PAGE,
        page,
        search: searchQuery.trim() || undefined,
        courierPage: 'pathao',
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
      const res = await adminApi.pathao.status()
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

  const openParcelModal = (orderId: string) => {
    setParcelModalOrderId(orderId)
    setParcelCityId('')
    setParcelZoneId('')
    setParcelAreaId('')
    setParcelZones([])
    setParcelAreas([])
    setParcelLoadingCities(true)
    setParcelLoadingZones(false)
    setParcelLoadingAreas(false)
    adminApi.pathao.cities()
      .then((res) => setParcelCities(res.data.data ?? []))
      .catch((err: { response?: { data?: { message?: string } } }) => {
        const msg = err?.response?.data?.message ?? 'Failed to load cities'
        showToast(msg, 'error')
      })
      .finally(() => setParcelLoadingCities(false))
  }

  const onParcelCityChange = (cityId: number | '') => {
    setParcelCityId(cityId)
    setParcelZoneId('')
    setParcelAreaId('')
    setParcelAreas([])
    if (cityId === '') {
      setParcelZones([])
      return
    }
    setParcelLoadingZones(true)
    adminApi.pathao.zones(cityId)
      .then((res) => setParcelZones(res.data.data ?? []))
      .catch((err: { response?: { data?: { message?: string } } }) => {
        showToast(err?.response?.data?.message ?? 'Failed to load zones', 'error')
      })
      .finally(() => setParcelLoadingZones(false))
  }

  const onParcelZoneChange = (zoneId: number | '') => {
    setParcelZoneId(zoneId)
    setParcelAreaId('')
    if (zoneId === '') {
      setParcelAreas([])
      return
    }
    setParcelLoadingAreas(true)
    adminApi.pathao.areas(zoneId)
      .then((res) => setParcelAreas(res.data.data ?? []))
      .catch((err: { response?: { data?: { message?: string } } }) => {
        showToast(err?.response?.data?.message ?? 'Failed to load areas', 'error')
      })
      .finally(() => setParcelLoadingAreas(false))
  }

  const closeParcelModal = () => {
    setParcelModalOrderId(null)
    setParcelCityId('')
    setParcelZoneId('')
    setParcelAreaId('')
  }

  const createParcel = async (orderId: string, cityId?: number, zoneId?: number, areaId?: number) => {
    if (cityId == null || zoneId == null || areaId == null) {
      openParcelModal(orderId)
      return
    }
    setCreatingId(orderId)
    try {
      const res = await adminApi.orders.pathaoCreate(orderId, { pathao_city_id: cityId, pathao_zone_id: zoneId, pathao_area_id: areaId })
      setParcelModalOrderId(null)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, shipment: res.data.data?.order?.shipment ?? o.shipment, status: res.data.data?.order?.status ?? o.status } : o)),
      )
      showToast(res.data.message ?? 'Pathao parcel created', 'success')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; pathao?: { message?: string } }; status?: number } }
      const msg = err?.response?.data?.message ?? err?.response?.data?.pathao?.message ?? 'Failed to create parcel. Check Courier → Settings → Pathao Settings.'
      showToast(msg, 'error')
    } finally {
      setCreatingId(null)
    }
  }

  const submitParcelModal = () => {
    if (!parcelModalOrderId || parcelCityId === '' || parcelZoneId === '' || parcelAreaId === '') {
      showToast('Select City, Zone and Area', 'error')
      return
    }
    createParcel(parcelModalOrderId, Number(parcelCityId), Number(parcelZoneId), Number(parcelAreaId))
  }

  const checkStatus = async (orderId: string) => {
    setLoadingStatusId(orderId)
    try {
      const res = await adminApi.orders.pathaoStatus(orderId)
      setStatusById((prev) => ({ ...prev, [orderId]: res.data.data?.delivery_status ?? '—' }))
      showToast('Status updated', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to get status'
      showToast(msg, 'error')
    } finally {
      setLoadingStatusId(null)
    }
  }

  const cancelPathao = async (orderId: string) => {
    if (!window.confirm('Remove this order from Pathao? Our link will be cleared and order set to PROCESSING. Cancel the consignment manually on Pathao portal if needed.')) return
    setCancelingId(orderId)
    try {
      const res = await adminApi.orders.pathaoCancel(orderId)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, shipment: res.data.data?.order?.shipment ?? null, status: res.data.data?.order?.status ?? o.status } : o)),
      )
      setStatusById((prev) => {
        const next = { ...prev }
        delete next[orderId]
        return next
      })
      showToast(res.data.message ?? 'Pathao link removed', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to cancel/remove'
      showToast(msg, 'error')
    } finally {
      setCancelingId(null)
    }
  }

  const isPathao = (o: AdminOrder) => o.shipment?.courierCompany === 'Pathao'
  const canCreate = (o: AdminOrder) =>
    !isPathao(o) && o.status !== 'CANCELED' && o.status !== 'DELIVERED'

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
          <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30">
            <Truck className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Pathao Courier Management
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Create parcels and check status. Set Client ID, Secret, Username, Password and Store ID in Courier → Settings.
            </p>
          </div>
        </div>
      </div>

      {apiStatus != null && apiStatus.active === false && (
        <div className="mb-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Pathao Courier service is inactive.</strong> Enable it in Courier → Settings to create parcels and use the API.
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
              <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">API Integration</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Courier → Settings → Pathao Settings
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
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${apiStatus.configured ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                {apiStatus.configured ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {apiStatus.configured ? (apiStatus.message ?? 'Configured') : (apiStatus.message ?? 'Not configured')}
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
                <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Orders
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                Enter <strong>Weight (kg)</strong> then blur to save. Click <strong>Create parcel</strong> and select City, Zone and Area to create a Pathao consignment.
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
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-orange-500" />
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
                          <CheckSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
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
                              <CheckSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/dashboard/orders/${o.id}`} className="font-mono text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline">
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
                              className="w-20 px-2.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-500"
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
                            {savingWeightId === o.id && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${statusBadge(o.status)}`}>
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isPathao(o) ? (
                            <span className="font-mono text-sm text-orange-600 dark:text-orange-400">
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
                              <Button type="button" variant="primary" size="sm" onClick={() => openParcelModal(o.id)} disabled={!!creatingId || apiStatus?.active === false} title="Create parcel" className="!p-2">
                                {creatingId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                              </Button>
                            )}
                            {isPathao(o) && (
                              <>
                                <Button type="button" variant="secondary" size="sm" onClick={() => checkStatus(o.id)} disabled={!!loadingStatusId} title="Check status" className="!p-2">
                                  {loadingStatusId === o.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                </Button>
                                <Button type="button" variant="secondary" size="sm" onClick={() => cancelPathao(o.id)} disabled={!!cancelingId} className="!p-2 !text-amber-600 hover:!bg-amber-50 dark:hover:!bg-amber-900/20" title="Remove from Pathao">
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
                        className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
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

      {/* Create parcel modal: select City, Zone, Area */}
      {parcelModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => closeParcelModal()}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pathao delivery location</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select City, Zone and Area for this order. Required for parcel creation.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <select
                value={parcelCityId === '' ? '' : parcelCityId}
                onChange={(e) => onParcelCityChange(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={parcelLoadingCities}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select city</option>
                {parcelCities.map((c) => (
                  <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
                ))}
              </select>
              {parcelLoadingCities && <span className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
              <select
                value={parcelZoneId === '' ? '' : parcelZoneId}
                onChange={(e) => onParcelZoneChange(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={parcelCityId === '' || parcelLoadingZones}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select zone</option>
                {parcelZones.map((z) => (
                  <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
                ))}
              </select>
              {parcelLoadingZones && <span className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Area</label>
              <select
                value={parcelAreaId === '' ? '' : parcelAreaId}
                onChange={(e) => setParcelAreaId(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={parcelZoneId === '' || parcelLoadingAreas}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select area</option>
                {parcelAreas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
                ))}
              </select>
              {parcelLoadingAreas && <span className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</span>}
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="primary" onClick={submitParcelModal} disabled={parcelCityId === '' || parcelZoneId === '' || parcelAreaId === '' || !!creatingId}>
                {creatingId === parcelModalOrderId ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> Creating…</> : <><Plus className="w-4 h-4 mr-2 inline" /> Create parcel</>}
              </Button>
              <Button type="button" variant="secondary" onClick={closeParcelModal}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
