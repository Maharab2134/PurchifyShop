import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Download, Printer, FileText } from "lucide-react";
import MainLayout from "@/components/templates/MainLayout";
import withAdmin from "@/components/HOC/WithAdmin";
import { adminApi } from "@/api/admin";
import useToast from "@/hooks/useToast";
import useFormatPrice from "@/hooks/useFormatPrice";
import formatDate from "@/utils/formatDate";
import { toImageUrl } from "@/utils/imageUrl";
import { storeInfoApi, type StoreInfo } from "@/api/storeInfo";

function InvoicePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { showToast } = useToast();
  const formatPrice = useFormatPrice();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  useEffect(() => {
    // Set document title for print/save filename
    if (order?.id) {
      document.title = `Invoice-${order.id}`;
    }
    return () => {
      document.title = "Your Store";
    };
  }, [order?.id]);

  useEffect(() => {
    // Fetch store info from admin settings
    storeInfoApi
      .get()
      .then(setStoreInfo)
      .catch(() => {
        // Fallback to empty store info if fetch fails
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

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }
  }, []);

  const loadOrder = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.orders.get(orderId);
      setOrder(res.data.data);
      // Set customer user from order
      if (res.data.data.user) {
        setUser(res.data.data.user);
      }
    } catch (err: any) {
      console.error("Error loading order:", err);
      setError(err?.response?.data?.message || "Failed to load order");
      showToast(
        err?.response?.data?.message || "Failed to load order",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!invoiceRef.current || !order) return;

    // Create a new window with invoice content
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Please allow popups to download invoice", "error");
      return;
    }

    // Get all styles from the current page
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {
          return "";
        }
      })
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice-${order.id}</title>
          <style>
            ${styles}
            @media print {
              body { margin: 0; padding: 0; }
              .print\\:hidden { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${invoiceRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();

    // Auto-trigger browser print dialog (user can save as PDF)
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
      }, 300);
    };
  };

  // Generate QR code URL for verification page
  const getQRCodeData = () => {
    if (!order) return "";
    // Generate URL to verification page
    const trackingNumber = order.trackingNumber || order.id;
    const verifyUrl = `${window.location.origin}/invoice-verify/${encodeURIComponent(trackingNumber)}`;
    return verifyUrl;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-lg text-red-500">{error || "Order not found"}</p>
            <Link
              to="/dashboard/orders"
              className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // order.amount = final total (items + shipping already; no platform fees)
  const shippingAmount = order.shippingAmount || 0;
  const itemsSubtotal =
    order.orderItems?.length > 0
      ? order.orderItems.reduce(
          (s: number, i: { price: number; quantity: number }) =>
            s + i.price * i.quantity,
          0,
        )
      : order.amount - shippingAmount;
  const total = order.amount;

  // Get payment method info
  const paymentMethod = order.payment?.method || "N/A";
  const paymentStatus =
    order.payment?.status || order.transaction?.status || order.status;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* Action Buttons - Hidden on Print */}
        <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
          <Link
            to="/dashboard/orders"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            <Printer size={16} />
            Print Invoice
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>

        {/* Invoice Content */}
        <div
          ref={invoiceRef}
          id="invoice-print"
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 md:p-12 print:shadow-none print:border-0 print:rounded-none"
        >
          {/* Header */}
          <div className="border-b-2 border-gray-200 pb-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {storeInfo?.logo ? (
                    <img
                      src={toImageUrl(storeInfo.logo)}
                      alt=""
                      className="h-9 w-auto object-contain"
                    />
                  ) : (
                    <FileText className="text-indigo-600" size={32} />
                  )}
                  <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
                </div>
                <p className="text-gray-600">Thank you for your purchase!</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Invoice Number</p>
                <p className="text-lg font-bold text-gray-800 font-mono">
                  {order.trackingNumber || order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 mt-2 mb-1">Date</p>
                <p className="text-sm font-medium text-gray-700">
                  {order.orderDate ? formatDate(order.orderDate) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Company & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:grid-cols-2 print:gap-3">
            {/* Company Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                From
              </h3>
              <div className="text-gray-700">
                {storeInfo?.storeName && (
                  <p className="font-bold text-lg text-gray-800 mb-1">
                    {storeInfo.storeName}
                  </p>
                )}
                {storeInfo?.email && (
                  <p className="text-sm">{storeInfo.email}</p>
                )}
                {storeInfo?.phone && (
                  <p className="text-sm">{storeInfo.phone}</p>
                )}
                {storeInfo?.address && (
                  <p className="text-sm whitespace-pre-line">
                    {storeInfo.address}
                  </p>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="text-right ml-auto">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Bill To
              </h3>
              <div className="text-gray-700">
                {user && (
                  <>
                    <p className="font-bold text-lg text-gray-800 mb-1">
                      {user.name || "Customer"}
                    </p>
                    <p className="text-sm">{user.email || ""}</p>
                    {(order?.contactPhone || user.phone) && (
                      <p className="text-sm">
                        Phone: {order?.contactPhone || user.phone}
                      </p>
                    )}
                  </>
                )}
                {order.address && (
                  <div className="mt-3 text-sm">
                    <p>{order.address.street}</p>
                    <p>
                      {order.address.city}, {order.address.state}
                    </p>
                    <p>
                      {order.address.country} - {order.address.zip}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Order Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Product Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Attributes
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Qty
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems?.map((item: any, index: number) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <p className="font-medium text-gray-800">
                          {item.variant?.product?.name || "Product"}
                        </p>
                        {item.variant?.product?.brand && (
                          <p className="text-xs text-gray-500 mt-1">
                            Brand: {item.variant.product.brand.name}
                          </p>
                        )}
                        {item.size && (
                          <p className="text-xs text-gray-500 mt-1">
                            Size: {item.size.name}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {(() => {
                          const variantAttributes = Array.isArray(
                            item.variant?.attributes,
                          )
                            ? item.variant.attributes
                            : [];
                          // Show only Color attribute (the one selected on product page)
                          const colorAttribute = variantAttributes.find(
                            (attr: any) =>
                              attr?.attribute?.name?.toLowerCase() === "color",
                          );

                          if (colorAttribute) {
                            const attrValue =
                              colorAttribute?.value?.value || "";
                            if (attrValue) {
                              return (
                                <span className="text-sm text-gray-700">
                                  Color: {attrValue}
                                </span>
                              );
                            }
                          }
                          return (
                            <span className="text-xs text-gray-400">—</span>
                          );
                        })()}
                      </td>
                      <td className="py-4 px-4 text-center text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-gray-700">
                        {formatPrice(item.price)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-gray-800">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary & QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-3">
            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg print:p-3 print:bg-white">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Invoice QR Code
              </h3>
              <div className="bg-white p-3 rounded-lg shadow-sm print:shadow-none">
                <QRCodeSVG
                  value={getQRCodeData()}
                  size={160}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Scan to view full invoice details
              </p>
            </div>

            {/* Summary */}
            <div className="flex flex-col justify-end">
              <div className="bg-gray-50 rounded-lg p-6 print:p-3">
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal (items):</span>
                    <span className="font-medium">
                      {formatPrice(itemsSubtotal)}
                    </span>
                  </div>
                  {shippingAmount > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Shipping (included):</span>
                      <span className="font-medium">
                        {formatPrice(shippingAmount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-800">
                        Total:
                      </span>
                      <span className="text-lg font-bold text-indigo-600">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Status Info */}
              <div className="mt-6 space-y-2 text-sm">
                {order.id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-mono text-xs text-gray-800">
                      {order.id}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium text-gray-800">
                    {paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span
                    className={`font-medium ${
                      paymentStatus === "PAID" || paymentStatus === "COMPLETED"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {paymentStatus}
                  </span>
                </div>
                {order.shipment?.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracking:</span>
                    <span className="font-mono text-xs">
                      {order.shipment.trackingNumber}
                    </span>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Tracking:</span>
                    <span className="font-mono text-xs text-gray-800">
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>Thank you for your business!</p>
            <p className="mt-1">
              For any queries, please contact us at{" "}
              <a
                href={`mailto:${storeInfo?.email}`}
                className="text-indigo-600 hover:underline"
              >
                {storeInfo?.email || "info@yourstore.com"}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 4mm;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: auto;
            overflow: visible;
          }
          body * {
            visibility: hidden;
          }
          #invoice-print,
          #invoice-print * {
            visibility: visible;
          }
          #invoice-print {
            width: 183mm;
            margin: 0 auto;
            padding: 5mm;
            box-shadow: none !important;
            border: 0 !important;
            font-size: 11.5px;
            line-height: 1.22;
            page-break-after: avoid;
            page-break-before: avoid;
            page-break-inside: avoid;
            height: auto;
            overflow: visible;
          }
          #invoice-print h1 { font-size: 20px; margin-bottom: 4px; }
          #invoice-print h2 { font-size: 16px; margin-bottom: 4px; }
          #invoice-print h3 { font-size: 12px; margin-bottom: 3px; }
          #invoice-print p { margin: 1.5px 0; }
          #invoice-print .pb-6 { padding-bottom: 8px; }
          #invoice-print .mb-8 { margin-bottom: 8px; }
          #invoice-print .py-4 { padding-top: 3px; padding-bottom: 3px; }
          #invoice-print .px-4 { padding-left: 3px; padding-right: 3px; }
          #invoice-print table th, #invoice-print table td { padding-top: 3px; padding-bottom: 3px; }
          .no-print-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </MainLayout>
  );
}

export default withAdmin(InvoicePage);
