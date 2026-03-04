import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  User,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import MainLayout from "@/components/templates/MainLayout";
import { adminApi } from "@/api/admin";
import useToast from "@/hooks/useToast";
import useFormatPrice from "@/hooks/useFormatPrice";
import formatDate from "@/utils/formatDate";
import { toImageUrl } from "@/utils/imageUrl";
import { storeInfoApi, type StoreInfo } from "@/api/storeInfo";

function InvoiceVerifyPage() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const { showToast } = useToast();
  const formatPrice = useFormatPrice();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    if (trackingNumber) {
      loadOrder();
    }
  }, [trackingNumber]);

  useEffect(() => {
    // Fetch store info for watermark
    storeInfoApi
      .get()
      .then(setStoreInfo)
      .catch(() => {
        setStoreInfo({
          storeName: "",
          logo: "",
          address: "",
          email: "",
          phone: "",
          whatsappLink: "",
          messengerLink: "",
        });
      });
  }, []);

  const loadOrder = async () => {
    if (!trackingNumber) return;

    try {
      setIsLoading(true);
      setError(null);

      // Try multiple approaches to find the order
      let orderData = null;

      // 1. First try as order ID directly
      try {
        const res = await adminApi.orders.get(trackingNumber);
        orderData = res.data.data;
      } catch (e: any) {
        // 2. If that fails, search by tracking number
        try {
          const searchRes = await adminApi.orders.list({
            search: trackingNumber,
            limit: 1,
          });
          if (
            searchRes.data.data?.orders &&
            searchRes.data.data.orders.length > 0
          ) {
            // Get the full order details
            const orderId = searchRes.data.data.orders[0].id;
            const detailRes = await adminApi.orders.get(orderId);
            orderData = detailRes.data.data;
          }
        } catch (searchError) {
          // If search also fails, throw error
          throw new Error("Order not found");
        }
      }

      if (!orderData) {
        throw new Error("Order not found");
      }

      setOrder(orderData);
    } catch (err: any) {
      console.error("Error loading order:", err);
      setError(
        "Invoice not found. Please check the tracking number and try again.",
      );
      showToast("Invoice not found", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="text-green-500" size={24} />;
      case "PROCESSING":
      case "SHIPPED":
      case "IN_TRANSIT":
        return <Clock className="text-blue-500" size={24} />;
      case "CANCELED":
      case "REFUNDED":
        return <XCircle className="text-red-500" size={24} />;
      default:
        return <Package className="text-gray-500" size={24} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHIPPED":
      case "IN_TRANSIT":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELED":
      case "REFUNDED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
            <XCircle className="mx-auto text-red-500 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The invoice you are looking for does not exist"}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <ArrowLeft size={16} />
              Go to Home
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-4"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Invoice Verification
            </h1>
            <div className="flex items-center gap-2">
              {getStatusIcon(order.status)}
            </div>
          </div>
        </div>

        {/* Main Card with Watermark */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
          {/* Watermark Logo */}
          {storeInfo?.logo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
              <img
                src={toImageUrl(storeInfo.logo)}
                alt="Watermark"
                className="w-80 h-80 object-contain opacity-[0.03]"
                style={{ transform: "rotate(-15deg)" }}
              />
            </div>
          )}
          {/* Status Banner */}
          <div
            className={`relative z-10 px-6 py-4 border-b ${getStatusColor(order.status)}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Order Status</p>
                <p className="text-xl font-bold">
                  {order.status.replace("_", " ")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-80">Invoice Number</p>
                <p className="text-lg font-mono font-bold">
                  {order.trackingNumber || order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 p-6 space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Calendar className="text-indigo-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium text-gray-800">
                    {order.orderDate ? formatDate(order.orderDate) : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="text-indigo-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm font-medium text-gray-800">
                    {order.id.slice(0, 16)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Information & Shipping Address Combined */}
            {(order.user || order.address) && (
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Customer Details */}
                  {order.user && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="text-indigo-600" size={20} />
                        <h3 className="text-base font-semibold text-gray-800">
                          Customer Details
                        </h3>
                      </div>

                      <div className="space-y-3 pl-7">
                        <p className="font-medium text-gray-800">
                          {order.user.name}
                        </p>

                        <p className="text-sm text-gray-700">
                          {order.user.email}
                        </p>

                        {(order.contactPhone || order.user.phone) && (
                          <p className="text-sm text-gray-700 font-mono">
                            {order.contactPhone || order.user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Right: Shipping Details */}
                  {order.address && (
                    <div className="space-y-4 ml-auto">
                      <div className="flex items-center justify-end gap-2 mb-4">
                        <MapPin className="text-indigo-600" size={20} />
                        <h3 className="text-base font-semibold text-gray-800">
                          Shipping Details
                        </h3>
                      </div>

                      <div className="space-y-2 pr-7">
                        <p className="text-sm text-gray-700">
                          {order.address.street}
                        </p>
                        <p className="text-sm text-gray-700">
                          {order.address.city}, {order.address.state}
                        </p>
                        <p className="text-sm text-gray-700">
                          {order.address.country} - {order.address.zip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Info */}
            {order.payment && (
              <div className="border-t pt-6">
                <div className="flex items-start gap-3">
                  <CreditCard className="text-indigo-600 mt-1" size={20} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Payment Information
                    </h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="font-medium text-gray-800 capitalize">
                          {order.payment.method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Payment Status</p>
                        <p
                          className={`font-medium ${
                            order.payment.status === "COMPLETED"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {order.payment.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {order.orderItems && order.orderItems.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.orderItems.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {item.variant?.product?.name || "Product"}
                        </p>
                        {item.variant?.sku && (
                          <p className="text-xs text-gray-500 mt-1">
                            SKU: {item.variant.sku}
                          </p>
                        )}
                        {item.size && (
                          <p className="text-xs text-gray-500 mt-1">
                            Size: {item.size.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-6">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {formatPrice(
                        order.orderItems?.reduce(
                          (sum: number, item: any) =>
                            sum + item.price * item.quantity,
                          0,
                        ) || 0,
                      )}
                    </span>
                  </div>
                  {order.shippingAmount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Shipping:</span>
                      <span className="font-medium">
                        {formatPrice(order.shippingAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 border-indigo-200 pt-3 flex justify-between">
                    <span className="text-lg font-bold text-gray-800">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-indigo-600">
                      {formatPrice(order.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This invoice has been verified and is authentic</p>
          <p className="mt-1">Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </MainLayout>
  );
}

export default InvoiceVerifyPage;
