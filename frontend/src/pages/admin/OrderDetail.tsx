import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Package, Truck, Calendar, User, Phone, MapPin, CreditCard, RefreshCw, ShoppingBag, Share2, Copy, Check } from 'lucide-react'
import Button from '@/components/atoms/Button'
import { adminApi, type AdminOrderDetail } from '@/api/admin'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'
import { toImageUrl, mapImageUrls, getProductImage } from '@/utils/imageUrl'
import { generateProductPlaceholder } from '@/utils/placeholderImage'
import ConfirmModal from '@/components/admin/ConfirmModal'

const STATUS_OPTIONS = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELED',
  'RETURNED',
  'REFUNDED',
]

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [deletingOrder, setDeletingOrder] = useState(false)
  const [courierCompany, setCourierCompany] = useState('')
  const [courierTrackingId, setCourierTrackingId] = useState('')
  const [dispatchDate, setDispatchDate] = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [vendorWhatsAppData, setVendorWhatsAppData] = useState<{
    orderId: string
    trackingNumber: string
    vendors: Array<{
      vendorId: string
      vendorName: string
      whatsappNumber: string
      whatsappUrl: string
      items: Array<{ productName: string; size: string; quantity: number }>
    }>
  } | null>(null)
  const [loadingVendorWhatsApp, setLoadingVendorWhatsApp] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [loadingSteadfastCreate, setLoadingSteadfastCreate] = useState(false)
  const [loadingSteadfastStatus, setLoadingSteadfastStatus] = useState(false)
  const [steadfastStatus, setSteadfastStatus] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadDetail()
    }
  }, [id])

  const loadDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await adminApi.orders.get(id)
      setDetail(res.data.data)
      setSelectedStatus(res.data.data.status)
      // Load courier info if available
      if (res.data.data.shipment) {
        setCourierCompany(res.data.data.shipment.courierCompany || '')
        setCourierTrackingId(res.data.data.shipment.courierTrackingId || '')
        setDispatchDate(res.data.data.shipment.dispatchDate || '')
        setExpectedDeliveryDate(res.data.data.shipment.expectedDeliveryDate || '')
      } else {
        setCourierCompany('')
        setCourierTrackingId('')
        setDispatchDate('')
        setExpectedDeliveryDate('')
      }
    } catch {
      showToast('Failed to load order details', 'error')
      navigate('/dashboard/orders')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async () => {
    if (!detail || selectedStatus === detail.status) return
    setUpdatingStatus(true)
    try {
      const courierInfo = selectedStatus === 'IN_TRANSIT' ? {
        courierCompany: courierCompany || undefined,
        courierTrackingId: courierTrackingId || undefined,
        dispatchDate: dispatchDate || undefined,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
      } : undefined
      const res = await adminApi.orders.updateStatus(detail.id, selectedStatus, courierInfo)
      setDetail(res.data.data)
      showToast('Order status updated', 'success')
      await loadDetail()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update'
      showToast(msg, 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const createSteadfastParcel = async () => {
    if (!detail?.id) return
    setLoadingSteadfastCreate(true)
    setSteadfastStatus(null)
    try {
      const res = await adminApi.orders.steadfastCreate(detail.id)
      setDetail(res.data.data.order)
      showToast(res.data.message || 'Steadfast parcel created', 'success')
      await loadDetail()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; steadfast?: { message?: string } } } }
      const msg = err?.response?.data?.message ?? err?.response?.data?.steadfast?.message ?? 'Failed to create Steadfast parcel. Check Courier → Settings → Steadfast Settings.'
      showToast(msg, 'error')
    } finally {
      setLoadingSteadfastCreate(false)
    }
  }

  const checkSteadfastStatus = async () => {
    if (!detail?.id) return
    setLoadingSteadfastStatus(true)
    setSteadfastStatus(null)
    try {
      const res = await adminApi.orders.steadfastStatus(detail.id)
      setSteadfastStatus(res.data.data.delivery_status)
      showToast('Status refreshed', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to get Steadfast status'
      showToast(msg, 'error')
    } finally {
      setLoadingSteadfastStatus(false)
    }
  }

  const handleDelete = async () => {
    if (!detail) return
    setDeletingOrder(true)
    try {
      await adminApi.orders.delete(detail.id)
      showToast('Order deleted successfully', 'success')
      navigate('/dashboard/orders')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete'
      showToast(msg, 'error')
    } finally {
      setDeletingOrder(false)
    }
  }

  const loadVendorWhatsApp = async (orderId: string) => {
    setLoadingVendorWhatsApp(true)
    try {
      const res = await adminApi.orders.vendorWhatsApp(orderId)
      setVendorWhatsAppData(res.data.data)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load vendor info'
      showToast(msg, 'error')
    } finally {
      setLoadingVendorWhatsApp(false)
    }
  }

  const getVendorMessage = (vendor: { items: Array<{ productName: string; size: string; quantity: number }> }, orderId: string) => {
    const orderIdStr = detail?.trackingNumber || orderId
    let message = `Order ID: ${orderIdStr}\n\n`
    message += `Products:\n`
    vendor.items.forEach((item) => {
      message += `• ${item.productName} (Size: ${item.size}, Qty: ${item.quantity})\n`
    })
    return message
  }

  const copyVendorMessage = (vendorId: string, vendor: { items: Array<{ productName: string; size: string; quantity: number }> }, orderId: string) => {
    const message = getVendorMessage(vendor, orderId)
    navigator.clipboard.writeText(message)
    setCopiedMessageId(vendorId)
    showToast('Message copied to clipboard', 'success')
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading order details…</p>
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-12">
          <p className="text-lg text-red-500 dark:text-red-400">Order not found</p>
          <Button
            type="button"
            onClick={() => navigate('/dashboard/orders')}
            className="mt-4 inline-flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Orders
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Button
          type="button"
          onClick={() => navigate('/dashboard/orders')}
          className="inline-flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">
          Order Details: {detail.trackingNumber || detail.id.slice(0, 8).toUpperCase()}
        </h1>
      </div>

      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Order Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Order #{detail.trackingNumber || detail.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              detail.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
              detail.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
              detail.status === 'SHIPPED' || detail.status === 'IN_TRANSIT' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
              detail.status === 'DELIVERED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
              detail.status === 'CANCELED' || detail.status === 'REFUNDED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {detail.status.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Order ID</p>
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{detail.id.slice(0, 12)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tracking</p>
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{detail.trackingNumber ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Order Date</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {detail.orderDate ? new Date(detail.orderDate).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>
          </div>
          {detail.user ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name & Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {detail.user.name} <span className="text-gray-500 dark:text-gray-400">({detail.user.email})</span>
                </p>
              </div>
              {(detail.user.phone || detail.contactPhone) && (
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                    <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                      {detail.contactPhone || detail.user.phone || '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Order Status</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
            {selectedStatus !== detail.status && (
              <button
                type="button"
                onClick={updateStatus}
                disabled={updatingStatus}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {updatingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Update Status
                  </>
                )}
              </button>
            )}
          </div>
          
          {/* Courier Information - Show when status is IN_TRANSIT or when setting to IN_TRANSIT */}
          {(selectedStatus === 'IN_TRANSIT' || detail.status === 'IN_TRANSIT') && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Courier Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Courier Company
                  </label>
                  <input
                    type="text"
                    value={courierCompany}
                    onChange={(e) => setCourierCompany(e.target.value)}
                    placeholder="e.g., DHL, FedEx, UPS"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/30 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Courier Tracking ID
                  </label>
                  <input
                    type="text"
                    value={courierTrackingId}
                    onChange={(e) => setCourierTrackingId(e.target.value)}
                    placeholder="Tracking number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/30 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/30 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/30 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Display existing courier info if status is IN_TRANSIT and info exists */}
          {detail.status === 'IN_TRANSIT' && detail.shipment && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Current Courier Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {detail.shipment.courierCompany && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Courier Company:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{detail.shipment.courierCompany}</span>
                  </div>
                )}
                {detail.shipment.courierTrackingId && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tracking ID:</span>
                    <span className="ml-2 font-mono font-medium text-gray-900 dark:text-gray-100">{detail.shipment.courierTrackingId}</span>
                  </div>
                )}
                {detail.shipment.dispatchDate && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Dispatch Date:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {new Date(detail.shipment.dispatchDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {detail.shipment.expectedDeliveryDate && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Expected Delivery:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {new Date(detail.shipment.expectedDeliveryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {detail.shipment.steadfastConsignmentId != null && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Steadfast Consignment ID:</span>
                    <span className="ml-2 font-mono font-medium text-gray-900 dark:text-gray-100">{detail.shipment.steadfastConsignmentId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Steadfast Courier (manual control only – main hub: Steadfast Courier management) */}
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Steadfast Courier (manual only)
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Manual control only. Create parcel or check status here, or manage from{' '}
              <Link to="/dashboard/courier/steadfast-management" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                Steadfast Courier management
              </Link>
              . Set API keys in Courier → Settings (Steadfast / Pathao tabs).
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {detail.shipment?.courierCompany === 'Steadfast' ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={checkSteadfastStatus}
                    disabled={loadingSteadfastStatus}
                  >
                    {loadingSteadfastStatus ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Checking…
                      </span>
                    ) : (
                      'Check Steadfast Status'
                    )}
                  </Button>
                  {steadfastStatus != null && (
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Delivery status: {steadfastStatus}
                    </span>
                  )}
                </>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={createSteadfastParcel}
                  disabled={loadingSteadfastCreate || detail.status === 'CANCELED' || detail.status === 'DELIVERED'}
                >
                  {loadingSteadfastCreate ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    'Create Steadfast Parcel'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {detail.address && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Shipping Address</h3>
            </div>
            <div className="space-y-2">
              {detail.address.label && (
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{detail.address.label}</p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {detail.address.street}, {detail.address.city}, {detail.address.state}, {detail.address.country} {detail.address.zip}
              </p>
            </div>
          </div>
        )}

        {/* Payment Information */}
        {detail.payment && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Payment Information</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Method</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">{detail.payment.method}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Amount</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(detail.payment.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    detail.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    detail.payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                    detail.payment.status === 'CANCELED' || detail.payment.status === 'REFUNDED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {detail.payment.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        {detail.orderItems && detail.orderItems.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Order Items</h3>
              <span className="ml-auto px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                {detail.orderItems.length} {detail.orderItems.length === 1 ? 'item' : 'items'}
              </span>
              <button
                type="button"
                onClick={() => loadVendorWhatsApp(detail.id)}
                disabled={loadingVendorWhatsApp}
                className="ml-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Share order with vendors via WhatsApp"
              >
                <Share2 size={16} />
                {loadingVendorWhatsApp ? 'Loading...' : 'Share with Vendors'}
              </button>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Image</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Product</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Attributes</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Size</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Qty</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {detail.orderItems.map((it) => {
                    const variantImages = Array.isArray(it.variant?.images) ? it.variant.images : []
                    const productImages = Array.isArray(it.variant?.product?.images) ? it.variant.product.images : []
                    const productName = it.variant?.product?.name || 'Product'
                    const selectedImage = it?.selectedImage
                      ? it.selectedImage.startsWith('http') || it.selectedImage.startsWith('data:')
                        ? it.selectedImage
                        : toImageUrl(it.selectedImage)
                      : null
                    const itemImage = selectedImage || getProductImage(
                      variantImages,
                      productImages,
                      productName,
                      56
                    )
                    
                    const allImages = [
                      ...(productImages || []),
                      ...variantImages,
                    ].filter((img, index, arr) => arr.indexOf(img) === index && img && img.trim() !== '')
                    const imageUrls = mapImageUrls(allImages)
                    
                    return (
                      <tr key={it.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                            <img
                              src={itemImage}
                              alt={productName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.currentTarget
                                const currentSrc = target.src
                                
                                if (imageUrls.length > 1) {
                                  const currentIndex = imageUrls.findIndex(url => url === currentSrc || currentSrc.includes(url.split('/').pop() || ''))
                                  if (currentIndex >= 0 && currentIndex < imageUrls.length - 1) {
                                    target.src = imageUrls[currentIndex + 1]
                                    return
                                  }
                                }
                                
                                const placeholder = generateProductPlaceholder(productName, 56)
                                if (target.src !== placeholder) {
                                  target.src = placeholder
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {productName ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{productName}</p>
                              {it.variant?.product?.brand && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  Brand: {it.variant.product.brand.name}
                                </p>
                              )}
                              {it.variant?.sku && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  SKU: {it.variant.sku}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          {(() => {
                            const raw = it.variant?.product?.shortDescription || it.variant?.product?.description || ''
                            const stripped = raw.replace(/<[^>]*>/g, '').trim()
                            const display = stripped.slice(0, 200)
                            return display ? (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3" title={stripped}>
                                {display}{stripped.length > 200 ? '…' : ''}
                              </p>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">—</span>
                            )
                          })()}
                        </td>
                        <td className="py-3 px-4">
                          {(() => {
                            const variantAttributes = Array.isArray(it.variant?.attributes) ? it.variant.attributes : []
                            const colorAttribute = variantAttributes.find((attr: any) => 
                              attr?.attribute?.name?.toLowerCase() === 'color'
                            )
                            
                            if (colorAttribute) {
                              const v = colorAttribute?.value
                              const attrValue = typeof v === 'string' ? v : (v && typeof v === 'object' ? (v as { value?: string }).value : '') ?? ''
                              if (attrValue) {
                                return (
                                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                                    Color: {attrValue}
                                  </span>
                                )
                              }
                            }
                            return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                          })()}
                        </td>
                        <td className="py-3 px-4">
                          {it.size?.name ? (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                              {it.size.name}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-semibold">
                            {it.quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(it.price * it.quantity)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatPrice(it.price)} each</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Vendor WhatsApp Links */}
            {vendorWhatsAppData && vendorWhatsAppData.vendors.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Share2 size={16} className="text-green-600" />
                    Share with Vendors
                  </h4>
                </div>
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> This link works best with WhatsApp mobile app or desktop app. 
                    WhatsApp Web doesn't support direct message links. If using WhatsApp Web, please copy the message and send manually.
                  </p>
                </div>
                <div className="space-y-3">
                  {vendorWhatsAppData.vendors.map((vendor) => (
                    <div key={vendor.vendorId} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{vendor.vendorName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{vendor.whatsappNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyVendorMessage(vendor.vendorId, vendor, vendorWhatsAppData.orderId || detail.id)}
                            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                            title="Copy message for WhatsApp Web"
                          >
                            {copiedMessageId === vendor.vendorId ? (
                              <>
                                <Check size={16} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={16} />
                                Copy Message
                              </>
                            )}
                          </button>
                          <a
                            href={vendor.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                            <Share2 size={16} />
                            Open WhatsApp
                          </a>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Items for this vendor:</p>
                        <ul className="space-y-1">
                          {vendor.items.map((item, idx) => (
                            <li key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                              • {item.productName} (Size: {item.size}, Qty: {item.quantity})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={() => setDeletingOrder(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete Order
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={deletingOrder}
        title="Delete Order"
        message={`Are you sure you want to delete order ${detail.id.slice(0, 8)}...? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deletingOrder}
        onConfirm={handleDelete}
        onCancel={() => setDeletingOrder(false)}
      />
    </div>
  )
}
