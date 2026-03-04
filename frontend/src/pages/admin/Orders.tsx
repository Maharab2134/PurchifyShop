import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Package,
  Eye,
  RefreshCw,
  FileText,
  Download,
  Trash2,
  CheckSquare,
  Square,
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Calendar,
  Phone,
  Truck,
  Share2,
  Copy,
  Check,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "@/components/common/Modal";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { adminApi, type AdminOrder, type AdminOrderDetail } from "@/api/admin";
import useToast from "@/hooks/useToast";
import useFormatPrice from "@/hooks/useFormatPrice";
import { toImageUrl, mapImageUrls, getProductImage } from "@/utils/imageUrl";
import { generateProductPlaceholder } from "@/utils/placeholderImage";

const STATUS_OPTIONS = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELED",
  "RETURNED",
  "REFUNDED",
];

export default function AdminOrders() {
  const { showToast } = useToast();
  const formatPrice = useFormatPrice();
  const location = useLocation();
  const navigate = useNavigate();
  const openOrderId = (location.state as { openOrderId?: string } | null)
    ?.openOrderId;
  const [list, setList] = useState<AdminOrder[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [deletingOrder, setDeletingOrder] = useState<AdminOrder | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [vendorWhatsAppData, setVendorWhatsAppData] = useState<{
    orderId: string;
    trackingNumber: string;
    vendors: Array<{
      vendorId: string;
      vendorName: string;
      whatsappNumber: string;
      whatsappUrl: string;
      items: Array<{ productName: string; size: string; quantity: number }>;
    }>;
  } | null>(null);
  const [loadingVendorWhatsApp, setLoadingVendorWhatsApp] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [courierCompany, setCourierCompany] = useState("");
  const [courierTrackingId, setCourierTrackingId] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const openedFromStateRef = useRef(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.orders.list({
        limit: 50,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setList(res.data.data?.orders ?? []);
      setTotalResults(res.data.data?.totalResults ?? 0);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to load";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter, search]);

  useEffect(() => {
    if (openOrderId && !openedFromStateRef.current) {
      openedFromStateRef.current = true;
      openDetail(openOrderId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [openOrderId, navigate, location.pathname]);

  const loadVendorWhatsApp = async (orderId: string) => {
    setLoadingVendorWhatsApp(true);
    try {
      const res = await adminApi.orders.vendorWhatsApp(orderId);
      setVendorWhatsAppData(res.data.data);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to load vendor info";
      showToast(msg, "error");
    } finally {
      setLoadingVendorWhatsApp(false);
    }
  };

  const getVendorMessage = (
    vendor: {
      items: Array<{ productName: string; size: string; quantity: number }>;
    },
    orderId: string,
  ) => {
    const orderIdText = vendorWhatsAppData?.trackingNumber || orderId;
    let message = `Order ID: ${orderIdText}\n\n`;
    message += `Products:\n`;
    vendor.items.forEach((item) => {
      message += `• ${item.productName} (Size: ${item.size}, Qty: ${item.quantity})\n`;
    });
    return message.trim();
  };

  const copyVendorMessage = async (
    vendorId: string,
    vendor: {
      items: Array<{ productName: string; size: string; quantity: number }>;
    },
    orderId: string,
  ) => {
    const message = getVendorMessage(vendor, orderId);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedMessageId(vendorId);
      showToast("Message copied to clipboard!", "success");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      showToast("Failed to copy message", "error");
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await adminApi.orders.get(id);
      setDetail(res.data.data);
      setSelectedStatus(res.data.data.status);
      // Load courier info if available
      if (res.data.data.shipment) {
        setCourierCompany(res.data.data.shipment.courierCompany || "");
        setCourierTrackingId(res.data.data.shipment.courierTrackingId || "");
        setDispatchDate(res.data.data.shipment.dispatchDate || "");
        setExpectedDeliveryDate(
          res.data.data.shipment.expectedDeliveryDate || "",
        );
      } else {
        setCourierCompany("");
        setCourierTrackingId("");
        setDispatchDate("");
        setExpectedDeliveryDate("");
      }
    } catch {
      showToast("Failed to load order details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!detail || selectedStatus === detail.status) return;
    setUpdatingStatus(true);
    try {
      const courierInfo =
        selectedStatus === "IN_TRANSIT"
          ? {
              courierCompany: courierCompany || undefined,
              courierTrackingId: courierTrackingId || undefined,
              dispatchDate: dispatchDate || undefined,
              expectedDeliveryDate: expectedDeliveryDate || undefined,
            }
          : undefined;
      const res = await adminApi.orders.updateStatus(
        detail.id,
        selectedStatus,
        courierInfo,
      );
      setDetail(res.data.data);
      showToast("Order status updated", "success");
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update";
      showToast(msg, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    try {
      await adminApi.orders.delete(deletingOrder.id);
      showToast("Order deleted successfully", "success");
      setDeletingOrder(null);
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete";
      showToast(msg, "error");
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === list.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(list.map((o) => o.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.size === 0) return;
    setBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedOrders).map((id) =>
        adminApi.orders.delete(id),
      );
      await Promise.all(deletePromises);
      showToast(
        `${selectedOrders.size} order(s) deleted successfully`,
        "success",
      );
      setSelectedOrders(new Set());
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to delete";
      showToast(msg, "error");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleExport = () => {
    try {
      const dataToExport = list.map((order) => ({
        "Order ID": order.id,
        User: order.user?.name || "N/A",
        Email: order.user?.email || "N/A",
        Phone: order.user?.phone || "N/A",
        Status: order.status,
        "Total Amount": formatPrice(order.amount),
        "Shipping Amount": formatPrice(order.shippingAmount),
        "Order Date": order.orderDate
          ? new Date(order.orderDate).toLocaleDateString()
          : "N/A",
        "Created Date": order.createdAt
          ? new Date(order.createdAt).toLocaleDateString()
          : "N/A",
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(
        wb,
        `orders-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      showToast("Orders exported successfully", "success");
    } catch (e) {
      showToast("Failed to export orders", "error");
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      IN_TRANSIT: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELED: "bg-red-100 text-red-800",
      RETURNED: "bg-orange-100 text-orange-800",
      REFUNDED: "bg-gray-100 text-gray-800",
    };
    return map[status] ?? "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Orders
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
                placeholder="Search order ID, tracking, phone, user, amount..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm w-64"
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || list.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Total: {totalResults} orders</p>
          {selectedOrders.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedOrders.size} selected
              </span>
              <button
                type="button"
                onClick={() => setDeletingOrder({ id: "bulk" } as AdminOrder)}
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
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-14 bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!loading && !error && list.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No orders yet.</p>
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
                        {selectedOrders.size === list.length &&
                        list.length > 0 ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Tracking
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">
                      Date
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((o) => (
                    <tr
                      key={o.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${selectedOrders.has(o.id) ? "bg-indigo-50" : ""}`}
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectOrder(o.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Select order"
                        >
                          {selectedOrders.has(o.id) ? (
                            <CheckSquare
                              size={18}
                              className="text-indigo-600"
                            />
                          ) : (
                            <Square size={18} className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/dashboard/orders/${o.id}`}
                          className="font-mono text-xs text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                          title="View order details"
                        >
                          {o.trackingNumber ?? o.id.slice(0, 8) + "…"}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        {o.user ? (
                          <div>
                            <p className="font-medium text-gray-800">
                              {o.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {o.user.email}
                            </p>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {formatPrice(o.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge(o.status)}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {o.orderDate
                          ? new Date(o.orderDate).toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/dashboard/orders/${o.id}`}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            aria-label="View order"
                            title="View Order Details"
                          >
                            <Eye size={16} />
                          </Link>
                          <a
                            href={`/orders/${o.id}/invoice`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
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
                              e.preventDefault();
                              // Trigger download by opening in new tab and printing
                              const win = window.open(
                                `/orders/${o.id}/invoice`,
                                "_blank",
                              );
                              if (win) {
                                win.onload = () => {
                                  setTimeout(() => {
                                    win.print();
                                  }, 500);
                                };
                              }
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            aria-label="Download invoice"
                            title="Download Invoice"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(o)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
            onConfirm={
              deletingOrder.id === "bulk" ? handleBulkDelete : handleDelete
            }
            title={
              deletingOrder.id === "bulk"
                ? "Delete Selected Orders"
                : "Delete Order"
            }
            message={
              deletingOrder.id === "bulk"
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
            title="Order details"
            size="xl"
          >
            {detailLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">
                  Loading order details…
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800/50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                        Order Information
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Order #
                        {detail.trackingNumber ||
                          detail.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        detail.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          : detail.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : detail.status === "SHIPPED" ||
                                detail.status === "IN_TRANSIT"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              : detail.status === "DELIVERED"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : detail.status === "CANCELED" ||
                                    detail.status === "REFUNDED"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {detail.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                        <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Order ID
                        </p>
                        <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {detail.id.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                        <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Tracking
                        </p>
                        <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {detail.trackingNumber ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Order Date
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {detail.orderDate
                            ? new Date(detail.orderDate).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Customer Information
                    </h3>
                  </div>
                  {detail.user ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Name & Email
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {detail.user.name}{" "}
                          <span className="text-gray-500 dark:text-gray-400">
                            ({detail.user.email})
                          </span>
                        </p>
                      </div>
                      {(detail.user.phone || detail.contactPhone) && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Phone Number
                            </p>
                            <p className="text-sm font-mono font-medium text-gray-900 dark:text-gray-100">
                              {detail.contactPhone || detail.user.phone || "—"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      —
                    </p>
                  )}
                </div>

                {/* Order Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Order Status
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
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
                  {(selectedStatus === "IN_TRANSIT" ||
                    detail.status === "IN_TRANSIT") && (
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
                            onChange={(e) =>
                              setCourierTrackingId(e.target.value)
                            }
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
                            onChange={(e) =>
                              setExpectedDeliveryDate(e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-500/30 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display existing courier info if status is IN_TRANSIT and info exists */}
                  {detail.status === "IN_TRANSIT" && detail.shipment && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Current Courier Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {detail.shipment.courierCompany && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Courier Company:
                            </span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                              {detail.shipment.courierCompany}
                            </span>
                          </div>
                        )}
                        {detail.shipment.courierTrackingId && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Tracking ID:
                            </span>
                            <span className="ml-2 font-mono font-medium text-gray-900 dark:text-gray-100">
                              {detail.shipment.courierTrackingId}
                            </span>
                          </div>
                        )}
                        {detail.shipment.dispatchDate && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Dispatch Date:
                            </span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                              {new Date(
                                detail.shipment.dispatchDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {detail.shipment.expectedDeliveryDate && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Expected Delivery:
                            </span>
                            <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                              {new Date(
                                detail.shipment.expectedDeliveryDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Address */}
                {detail.address && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Shipping Address
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {detail.address.label && (
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {detail.address.label}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {detail.address.street}, {detail.address.city},{" "}
                        {detail.address.state}, {detail.address.country}{" "}
                        {detail.address.zip}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                {detail.payment && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Payment Information
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Payment Method
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {detail.payment.method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Amount
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatPrice(detail.payment.amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Status
                          </p>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              detail.payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : detail.payment.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : detail.payment.status === "CANCELED" ||
                                      detail.payment.status === "REFUNDED"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {detail.payment.status}
                          </span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          View payment details (Sending Number, Transaction ID)
                          from{" "}
                          <Link
                            to="/dashboard/transactions"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            Transactions
                          </Link>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {detail.orderItems && detail.orderItems.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingBag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Order Items
                      </h3>
                      <span className="ml-auto px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                        {detail.orderItems.length}{" "}
                        {detail.orderItems.length === 1 ? "item" : "items"}
                      </span>
                      <button
                        type="button"
                        onClick={() => loadVendorWhatsApp(detail.id)}
                        disabled={loadingVendorWhatsApp}
                        className="ml-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Share order with vendors via WhatsApp"
                      >
                        <Share2 size={16} />
                        {loadingVendorWhatsApp
                          ? "Loading..."
                          : "Share with Vendors"}
                      </button>
                    </div>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Image
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Attributes
                            </th>
                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Size
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Qty
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {detail.orderItems.map((it) => {
                            // Get all images from variant and product (exact same logic as ProductDetail page)
                            const variantImages = Array.isArray(
                              it.variant?.images,
                            )
                              ? it.variant.images
                              : [];
                            const productImages = Array.isArray(
                              it.variant?.product?.images,
                            )
                              ? it.variant.product.images
                              : [];
                            const productName =
                              it.variant?.product?.name || "Product";

                            // Use the same image logic as ProductDetail page
                            const selectedImage = it?.selectedImage
                              ? it.selectedImage.startsWith("http") ||
                                it.selectedImage.startsWith("data:")
                                ? it.selectedImage
                                : toImageUrl(it.selectedImage)
                              : null;
                            const itemImage =
                              selectedImage ||
                              getProductImage(
                                variantImages,
                                productImages,
                                productName,
                                56,
                              );

                            // Get image URLs for fallback
                            const allImages = [
                              ...(productImages || []),
                              ...variantImages,
                            ].filter(
                              (img, index, arr) =>
                                arr.indexOf(img) === index &&
                                img &&
                                img.trim() !== "",
                            );
                            const imageUrls = mapImageUrls(allImages);

                            return (
                              <tr
                                key={it.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                    <img
                                      src={itemImage}
                                      alt={productName}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        const currentSrc = target.src;

                                        // Try next image in the array if available
                                        if (imageUrls.length > 1) {
                                          const currentIndex =
                                            imageUrls.findIndex(
                                              (url) =>
                                                url === currentSrc ||
                                                currentSrc.includes(
                                                  url.split("/").pop() || "",
                                                ),
                                            );
                                          if (
                                            currentIndex >= 0 &&
                                            currentIndex < imageUrls.length - 1
                                          ) {
                                            target.src =
                                              imageUrls[currentIndex + 1];
                                            return;
                                          }
                                        }

                                        // Fallback to placeholder if no more images
                                        const placeholder =
                                          generateProductPlaceholder(
                                            productName,
                                            56,
                                          );
                                        if (target.src !== placeholder) {
                                          target.src = placeholder;
                                        }
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  {productName ? (
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {productName}
                                      </p>
                                      {it.variant?.sku && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          SKU: {it.variant.sku}
                                        </p>
                                      )}
                                    </div>
                                  ) : null}
                                </td>
                                <td className="py-3 px-4 max-w-[180px]">
                                  {(() => {
                                    const raw =
                                      it.variant?.product?.shortDescription ||
                                      it.variant?.product?.description ||
                                      "";
                                    const stripped = raw
                                      .replace(/<[^>]*>/g, "")
                                      .trim();
                                    const display = stripped.slice(0, 150);
                                    return display ? (
                                      <p
                                        className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3"
                                        title={stripped}
                                      >
                                        {display}
                                        {stripped.length > 150 ? "…" : ""}
                                      </p>
                                    ) : (
                                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                        —
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="py-3 px-4">
                                  {(() => {
                                    const variantAttributes = Array.isArray(
                                      it.variant?.attributes,
                                    )
                                      ? it.variant.attributes
                                      : [];
                                    // Show only Color attribute (the one selected on product page)
                                    const colorAttribute =
                                      variantAttributes.find(
                                        (attr: any) =>
                                          attr?.attribute?.name?.toLowerCase() ===
                                          "color",
                                      );

                                    if (colorAttribute) {
                                      const rawValue = colorAttribute?.value;
                                      const attrValue =
                                        typeof rawValue === "string"
                                          ? rawValue
                                          : rawValue?.value || "";
                                      if (attrValue) {
                                        return (
                                          <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                                            Color: {attrValue}
                                          </span>
                                        );
                                      }
                                    }
                                    return (
                                      <span className="text-xs text-gray-400 dark:text-gray-500">
                                        —
                                      </span>
                                    );
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
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {formatPrice(it.price * it.quantity)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {formatPrice(it.price)} each
                                  </p>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Vendor WhatsApp Links */}
                    {vendorWhatsAppData &&
                      vendorWhatsAppData.vendors.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              <Share2 size={16} className="text-green-600" />
                              Share with Vendors
                            </h4>
                          </div>
                          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                              <strong>Note:</strong> This link works best with
                              WhatsApp mobile app or desktop app. WhatsApp Web
                              doesn't support direct message links. If using
                              WhatsApp Web, please copy the message and send
                              manually.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {vendorWhatsAppData.vendors.map((vendor) => (
                              <div
                                key={vendor.vendorId}
                                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {vendor.vendorName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {vendor.whatsappNumber}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        copyVendorMessage(
                                          vendor.vendorId,
                                          vendor,
                                          vendorWhatsAppData.orderId ||
                                            detail.id,
                                        )
                                      }
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
                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                                  <p className="font-medium mb-1">Items:</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {vendor.items.map((item, idx) => (
                                      <li key={idx}>
                                        {item.productName} (Size: {item.size},
                                        Qty: {item.quantity})
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

                {/* Order Summary */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Order Summary
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-5 space-y-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total Items
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {detail.orderItems?.reduce(
                          (sum: number, item: any) => sum + item.quantity,
                          0,
                        ) || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Subtotal
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(
                          detail.orderItems?.reduce(
                            (sum: number, item: any) =>
                              sum + item.price * item.quantity,
                            0,
                          ) || 0,
                        )}
                      </span>
                    </div>
                    {detail.shippingOption && detail.shippingAmount > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Shipping
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {detail.shippingOption.name} —{" "}
                          {formatPrice(detail.shippingAmount)}
                        </span>
                      </div>
                    )}
                    {detail.shippingAmount > 0 && !detail.shippingOption && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Shipping
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatPrice(detail.shippingAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-gray-300 dark:border-gray-600">
                      <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Total
                      </span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {formatPrice(detail.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href={`/orders/${detail.id}/invoice`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    <FileText size={18} />
                    View Invoice
                  </a>
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
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
  );
}
