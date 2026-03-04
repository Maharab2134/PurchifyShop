import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  Check,
  Ticket,
  X,
  MapPin,
  Plus,
  Phone,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
} from "lucide-react";
import MainLayout from "@/components/templates/MainLayout";
import { paymentMethodsApi, type PaymentMethod } from "@/api/paymentMethods";
import { couponsApi, type Coupon } from "@/api/coupons";
import { addressesApi, type Address } from "@/api/addresses";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/utils/axiosInstance";
import useToast from "@/hooks/useToast";
import { CURRENCY_SYMBOL } from "@/hooks/useFormatPrice";
import { cartApi } from "@/api/cart";
import { shippingOptionsApi, type ShippingOption } from "@/api/shippingOptions";
import { toImageUrl, mapImageUrls, getProductImage } from "@/utils/imageUrl";
import { generateProductPlaceholder } from "@/utils/placeholderImage";
import {
  formatPhoneInput,
  phoneValidationRule,
  senderNumberValidationRule,
} from "@/utils/phoneValidation";

type FormValues = {
  selectedAddressId: string | null;
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  phone: string;
  paymentType: "cash_on_delivery" | "digital" | null;
  paymentMethodId: number | null;
  senderNumber: string;
  transactionId: string;
  couponCode: string;
  shippingOptionId: string | null;
};

export default function Checkout() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [showCouponSection, setShowCouponSection] = useState(false);
  const [showDigitalPayments, setShowDigitalPayments] = useState(false);
  const [cartData, setCartData] = useState<any>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(
    null,
  );
  const [freeDeliveryMinAmount, setFreeDeliveryMinAmount] = useState<number>(0);
  const [freeDeliveryProgressBarEnabled, setFreeDeliveryProgressBarEnabled] =
    useState<boolean>(true);
  const [myCoupons, setMyCoupons] = useState<Coupon[]>([]);
  const incompleteOrderTrackedRef = useRef(false);

  const { control, handleSubmit, watch, reset, setValue } = useForm<FormValues>(
    {
      defaultValues: {
        selectedAddressId: null,
        street: "",
        city: "",
        state: "",
        country: "Bangladesh",
        zip: "",
        phone: user?.phone || "",
        paymentType: null,
        paymentMethodId: null,
        senderNumber: "",
        transactionId: "",
        couponCode: "",
        shippingOptionId: null,
      },
    },
  );

  const selectedAddressId = watch("selectedAddressId");
  const couponCode = watch("couponCode");
  const paymentType = watch("paymentType");
  const paymentMethodId = watch("paymentMethodId");
  const selected = methods.find((m) => m.id === paymentMethodId);
  const needsSenderTxn = selected?.requiresSenderAndTxn ?? false;
  const needsTxnOnly = selected?.requiresTransactionIdOnly ?? false;
  const isBankMethod = Boolean(
    selected && (selected.config?.accountNumber || selected.config?.bankName),
  );

  // Calculate totals
  const subtotal =
    cartData?.items?.reduce(
      (sum: number, item: any) =>
        sum + (item.variant?.price ?? item.price ?? 0) * item.quantity,
      0,
    ) ?? 0;
  const selectedShipping = shippingOptions.find(
    (o) => o.id === selectedShippingId,
  );
  const baseShippingFee = selectedShipping?.amount ?? 0;
  const qualifiesFreeDelivery = Boolean(
    freeDeliveryProgressBarEnabled &&
    freeDeliveryMinAmount > 0 &&
    subtotal >= freeDeliveryMinAmount,
  );
  const shippingFee = qualifiesFreeDelivery ? 0 : baseShippingFee;

  // Calculate payment charge proportionally (charge is for 1000, calculate based on subtotal)
  // Example: if charge is 13 for 1000, then for 2000 it's 26, for 500 it's 6.5
  const calculatePaymentCharge = (charge: number, amount: number): number => {
    if (charge <= 0 || amount <= 0) return 0;
    // Charge is stored for 1000, so calculate proportionally
    return (charge / 1000) * amount;
  };

  const paymentCharge =
    selected && paymentType === "digital"
      ? calculatePaymentCharge(selected.charge ?? 0, subtotal)
      : 0;

  // Total does NOT include payment charge (charge is shown separately but not added)
  const total = subtotal - discount + shippingFee;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    setLoading(true);
    Promise.allSettled([
      cartApi.get().then((cartRes) => {
        const cart = cartRes.data.data;
        if (!cart || !cart.items || cart.items.length === 0) {
          showToast(
            "Your cart is empty. Please add items before checkout.",
            "error",
          );
          navigate("/cart");
          return null;
        }
        setCartData(cart);
        return cart;
      }),
      paymentMethodsApi.getAll().then((r) => {
        setMethods(r.data.data ?? []);
      }),
      addressesApi.getAll().then((r) => {
        setAddresses(r.data.data ?? []);
        if (r.data.data && r.data.data.length > 0) {
          setValue("selectedAddressId", r.data.data[0].id);
        }
      }),
      shippingOptionsApi.getAll().then((r) => {
        const options = r.data.data ?? [];
        setShippingOptions(options);
        setFreeDeliveryMinAmount(Number(r.data.freeDeliveryMinAmount) || 0);
        setFreeDeliveryProgressBarEnabled(
          r.data.freeDeliveryProgressBarEnabled !== false,
        );
        if (options.length > 0) {
          setSelectedShippingId(options[0].id);
          setValue("shippingOptionId", options[0].id);
        }
      }),
      couponsApi
        .getMyCoupons()
        .then((r) => {
          setMyCoupons(r.data.data ?? []);
        })
        .catch(() => setMyCoupons([])),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated, navigate, setValue, showToast]);

  // Track checkout visit for Incomplete Orders (user reached checkout but didn't place order)
  useEffect(() => {
    const items = cartData?.items ?? [];
    if (loading || items.length === 0 || incompleteOrderTrackedRef.current)
      return;
    incompleteOrderTrackedRef.current = true;
    cartApi.trackVisit().catch(() => {});
  }, [loading, cartData?.items]);

  const copyNumber = () => {
    if (selected?.config?.number) {
      navigator.clipboard.writeText(selected.config.number);
      setCopied(true);
      showToast("Number copied", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyCouponResult = (coupon: Coupon) => {
    setAppliedCoupon(coupon);
    if (coupon.type === "PERCENTAGE") {
      const raw = (subtotal * coupon.value) / 100;
      const cap = coupon.maxDiscount ?? Infinity;
      setDiscount(Math.min(raw, cap));
    } else {
      setDiscount(Math.min(coupon.value, subtotal));
    }
    setValue("couponCode", coupon.code);
    showToast("Coupon applied successfully", "success");
  };

  const handleApplyCoupon = async () => {
    if (!couponCode?.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await couponsApi.validateCoupon(couponCode.trim());
      const coupon = res.data.data;
      applyCouponResult(coupon);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "Invalid coupon code", "error");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleApplyMyCoupon = async (coupon: Coupon) => {
    setValidatingCoupon(true);
    try {
      const res = await couponsApi.validateCoupon(coupon.code);
      applyCouponResult(res.data.data);
    } catch (e: any) {
      showToast(
        (e as any)?.response?.data?.message || "Could not apply coupon",
        "error",
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setValue("couponCode", "");
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    if (!data.selectedAddressId && !data.street) {
      showToast("Please select or add an address", "error");
      return;
    }

    if (!data.paymentType) {
      showToast("Please select a payment method", "error");
      return;
    }

    if (data.paymentType === "digital" && !data.paymentMethodId) {
      showToast("Please select a digital payment method", "error");
      return;
    }

    if (data.paymentType === "digital" && needsSenderTxn) {
      if (!data.senderNumber || !data.transactionId) {
        showToast("Please enter sender number and transaction ID", "error");
        return;
      }
    }
    if (data.paymentType === "digital" && needsTxnOnly) {
      if (!data.transactionId?.trim()) {
        showToast(
          "Please enter your transaction number after sending payment to the given account",
          "error",
        );
        return;
      }
    }
    if (data.paymentType === "digital" && isBankMethod) {
      if (!data.senderNumber?.trim()) {
        showToast("Please enter your sending account number", "error");
        return;
      }
      if (!data.transactionId?.trim()) {
        showToast("Please enter the transaction number", "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        phone: data.phone,
        shippingOptionId: data.shippingOptionId,
      };

      if (data.selectedAddressId) {
        payload.addressId = data.selectedAddressId;
      } else {
        payload.street = data.street;
        payload.city = data.city;
        payload.state = data.state;
        payload.country = data.country;
        payload.zip = data.zip;
      }

      if (data.paymentType === "cash_on_delivery") {
        // Find Cash on Delivery payment method
        const codMethod = methods.find(
          (m) =>
            m.slug === "cash_on_delivery" ||
            m.slug === "cash-on-delivery" ||
            m.name.toLowerCase().includes("cash on delivery") ||
            m.name.toLowerCase().includes("cod"),
        );
        if (!codMethod) {
          showToast(
            "Cash on Delivery payment method not found. Please contact support.",
            "error",
          );
          return;
        }
        payload.paymentMethodId = codMethod.id;
      } else {
        payload.paymentMethodId = data.paymentMethodId;
        if (needsSenderTxn) {
          payload.senderNumber = data.senderNumber;
          payload.transactionId = data.transactionId;
        }
        if (needsTxnOnly) {
          payload.transactionId = data.transactionId?.trim();
        }
        if (isBankMethod) {
          payload.senderNumber = data.senderNumber?.trim();
          payload.transactionId = data.transactionId?.trim();
        }
      }

      if (appliedCoupon) {
        payload.couponCode = appliedCoupon.code;
      }

      const res = await axiosInstance.post<{
        data: { orderId: string; trackingNumber?: string };
      }>("/checkout", payload);
      showToast("Order placed successfully!", "success");
      navigate(`/orders/${res.data.data.orderId}`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to place order";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  });

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading checkout...
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Your cart is empty
              </p>
              <button
                onClick={() => navigate("/cart")}
                className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Go to Cart
              </button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const digitalPaymentMethods = methods.filter(
    (m) =>
      m.isActive &&
      m.slug !== "cash_on_delivery" &&
      !m.name.toLowerCase().includes("cash"),
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Checkout
          </h1>

          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left Column - Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Address Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-indigo-600" />
                  Delivery Address
                </h2>

                {addresses.length > 0 && !useNewAddress && (
                  <div className="mb-4">
                    <Controller
                      name="selectedAddressId"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-2">
                          {addresses.map((addr) => (
                            <label
                              key={addr.id}
                              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${
                                field.value === addr.id
                                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              }`}
                            >
                              <input
                                type="radio"
                                checked={field.value === addr.id}
                                onChange={() => field.onChange(addr.id)}
                                className="mt-1 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {addr.label}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {addr.street}, {addr.city}, {addr.state},{" "}
                                  {addr.country} - {addr.zip}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(true)}
                      className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Add New Address
                    </button>
                  </div>
                )}

                {(useNewAddress || addresses.length === 0) && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Controller
                        name="street"
                        control={control}
                        rules={{
                          required: !selectedAddressId ? "Required" : false,
                        }}
                        render={({ field, fieldState }) => (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Street *
                            </label>
                            <input
                              {...field}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                            {fieldState.error && (
                              <p className="text-red-500 text-xs mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                      <Controller
                        name="city"
                        control={control}
                        rules={{
                          required: !selectedAddressId ? "Required" : false,
                        }}
                        render={({ field, fieldState }) => (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              City *
                            </label>
                            <input
                              {...field}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                            {fieldState.error && (
                              <p className="text-red-500 text-xs mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Controller
                        name="state"
                        control={control}
                        rules={{
                          required: !selectedAddressId ? "Required" : false,
                        }}
                        render={({ field, fieldState }) => (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              State *
                            </label>
                            <input
                              {...field}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                            {fieldState.error && (
                              <p className="text-red-500 text-xs mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                      <Controller
                        name="zip"
                        control={control}
                        rules={{
                          required: !selectedAddressId ? "Required" : false,
                        }}
                        render={({ field, fieldState }) => (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              ZIP Code *
                            </label>
                            <input
                              {...field}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                            {fieldState.error && (
                              <p className="text-red-500 text-xs mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country
                          </label>
                          <input
                            {...field}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      )}
                    />
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseNewAddress(false);
                          setValue("selectedAddressId", addresses[0].id);
                        }}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Use Saved Address
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Phone *
                  </label>
                  <Controller
                    name="phone"
                    control={control}
                    rules={phoneValidationRule}
                    render={({ field, fieldState }) => (
                      <div>
                        <input
                          {...field}
                          type="tel"
                          inputMode="numeric"
                          maxLength={11}
                          onChange={(e) => {
                            const formatted = formatPhoneInput(e.target.value);
                            field.onChange(formatted);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          placeholder="01XXXXXXXXX"
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Shipping Options – hide when shipping is free */}
              {shippingOptions.length > 0 && !qualifiesFreeDelivery && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Shipping Method
                  </h2>
                  <Controller
                    name="shippingOptionId"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {shippingOptions.map((option) => (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${
                              field.value === option.id
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                checked={field.value === option.id}
                                onChange={() => {
                                  field.onChange(option.id);
                                  setSelectedShippingId(option.id);
                                }}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {option.name}
                              </span>
                            </div>
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {CURRENCY_SYMBOL}
                              {option.amount.toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Payment Method Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-indigo-600" />
                  Payment Method *
                </h2>

                <div className="space-y-4">
                  {/* Cash on Delivery */}
                  <Controller
                    name="paymentType"
                    control={control}
                    rules={{ required: "Please select a payment method" }}
                    render={({ field, fieldState }) => (
                      <>
                        <label
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                            field.value === "cash_on_delivery"
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          }`}
                        >
                          <input
                            type="radio"
                            checked={field.value === "cash_on_delivery"}
                            onChange={() => {
                              field.onChange("cash_on_delivery");
                              setValue("paymentMethodId", null);
                              setShowDigitalPayments(false);
                            }}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <Wallet
                            size={20}
                            className="text-gray-600 dark:text-gray-400"
                          />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Cash on Delivery
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                              Pay when you receive the order
                            </p>
                          </div>
                        </label>

                        {/* Digital Payments */}
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDigitalPayments(!showDigitalPayments);
                              if (!showDigitalPayments) {
                                field.onChange("digital");
                              }
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                              field.value === "digital"
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md"
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                checked={field.value === "digital"}
                                onChange={() => {
                                  field.onChange("digital");
                                  setShowDigitalPayments(true);
                                }}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <CreditCard
                                size={20}
                                className="text-gray-600 dark:text-gray-400"
                              />
                              <div className="text-left">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  Digital Payments
                                </span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                  bKash, Nagad, Bank Transfer, etc.
                                </p>
                              </div>
                            </div>
                            {showDigitalPayments ? (
                              <ChevronUp
                                size={20}
                                className="text-gray-600 dark:text-gray-400"
                              />
                            ) : (
                              <ChevronDown
                                size={20}
                                className="text-gray-600 dark:text-gray-400"
                              />
                            )}
                          </button>

                          {showDigitalPayments && field.value === "digital" && (
                            <div className="mt-4 pl-8 space-y-3">
                              {digitalPaymentMethods.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No digital payment methods available
                                </p>
                              ) : (
                                digitalPaymentMethods.map((m) => (
                                  <label
                                    key={m.id}
                                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer ${
                                      paymentMethodId === m.id
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      checked={paymentMethodId === m.id}
                                      onChange={() =>
                                        setValue("paymentMethodId", m.id)
                                      }
                                      className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">
                                          {m.name}
                                        </span>
                                        {m.charge > 0 && (
                                          <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Charge: {CURRENCY_SYMBOL}
                                            {(
                                              (m.charge / 1000) *
                                              subtotal
                                            ).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </label>
                                ))
                              )}

                              {/* Bank Account Payment Card (Jolhon / Bank: sending account number) */}
                              {selected &&
                                (selected.config?.accountNumber ||
                                  selected.config?.bankName) && (
                                  <div className="mt-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
                                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 flex items-center gap-2">
                                      <CreditCard size={16} />
                                      Send payment to this account
                                    </h3>
                                    {selected.config?.instruction && (
                                      <p className="text-sm text-blue-800 dark:text-blue-300">
                                        {selected.config.instruction}
                                      </p>
                                    )}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-2 border border-blue-200 dark:border-blue-700">
                                      {selected.config?.accountHolder && (
                                        <div className="flex justify-between">
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Account Holder:
                                          </span>
                                          <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {selected.config.accountHolder}
                                          </span>
                                        </div>
                                      )}
                                      {selected.config?.bankName && (
                                        <div className="flex justify-between">
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Bank Name:
                                          </span>
                                          <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {selected.config.bankName}
                                          </span>
                                        </div>
                                      )}
                                      {selected.config?.branch && (
                                        <div className="flex justify-between">
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Branch:
                                          </span>
                                          <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {selected.config.branch}
                                          </span>
                                        </div>
                                      )}
                                      {selected.config?.accountNumber && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Account Number:
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <code className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded font-mono text-gray-900 dark:text-gray-100 text-sm">
                                              {selected.config.accountNumber}
                                            </code>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                navigator.clipboard.writeText(
                                                  selected.config
                                                    .accountNumber || "",
                                                );
                                                setCopied(true);
                                                showToast(
                                                  "Account number copied",
                                                  "success",
                                                );
                                                setTimeout(
                                                  () => setCopied(false),
                                                  2000,
                                                );
                                              }}
                                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-200 rounded text-xs hover:bg-blue-300 dark:hover:bg-blue-700 transition"
                                            >
                                              {copied ? (
                                                <Check size={12} />
                                              ) : (
                                                <Copy size={12} />
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Bank: Transaction number + Sending account number */}
                              {isBankMethod && selected && (
                                <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
                                  <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                    <Wallet size={16} />
                                    Transaction &amp; Sending account number
                                  </h3>
                                  <p className="text-sm text-amber-800 dark:text-amber-300">
                                    After sending the amount to the account
                                    above, enter your sending account number and
                                    the transaction number you received.
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Controller
                                      name="senderNumber"
                                      control={control}
                                      rules={
                                        isBankMethod
                                          ? senderNumberValidationRule
                                          : {}
                                      }
                                      render={({ field, fieldState }) => (
                                        <div>
                                          <label className="block text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                                            Sending account number *
                                          </label>
                                          <input
                                            {...field}
                                            type="tel"
                                            inputMode="numeric"
                                            placeholder="01XXXXXXXXX"
                                            maxLength={11}
                                            onChange={(e) => {
                                              const formatted =
                                                formatPhoneInput(
                                                  e.target.value,
                                                );
                                              field.onChange(formatted);
                                            }}
                                            className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-500/30 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                          />
                                          {fieldState.error && (
                                            <p className="text-red-500 text-xs mt-1">
                                              {fieldState.error.message}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    />
                                    <Controller
                                      name="transactionId"
                                      control={control}
                                      rules={
                                        isBankMethod
                                          ? {
                                              required:
                                                "Transaction number is required",
                                            }
                                          : {}
                                      }
                                      render={({ field, fieldState }) => (
                                        <div>
                                          <label className="block text-xs font-medium text-amber-900 dark:text-amber-200 mb-1">
                                            Transaction number *
                                          </label>
                                          <input
                                            {...field}
                                            placeholder="Transaction number *"
                                            className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-500/30 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                          />
                                          {fieldState.error && (
                                            <p className="text-red-500 text-xs mt-1">
                                              {fieldState.error.message}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Non-bank digital: Enter transaction number only (e.g. other methods) */}
                              {needsTxnOnly && selected && !isBankMethod && (
                                <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
                                  <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                    <Wallet size={16} />
                                    Enter your transaction number
                                  </h3>
                                  <p className="text-sm text-amber-800 dark:text-amber-300">
                                    After sending the amount to the account
                                    above, enter the transaction number you
                                    received (like bKash/Nagad).
                                  </p>
                                  <Controller
                                    name="transactionId"
                                    control={control}
                                    rules={
                                      needsTxnOnly
                                        ? {
                                            required:
                                              "Transaction number is required",
                                          }
                                        : {}
                                    }
                                    render={({ field, fieldState }) => (
                                      <div>
                                        <input
                                          {...field}
                                          placeholder="Transaction number *"
                                          className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-500/30 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        />
                                        {fieldState.error && (
                                          <p className="text-red-500 text-xs mt-1">
                                            {fieldState.error.message}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  />
                                </div>
                              )}

                              {/* Send Money & Confirm Section (bKash / Nagad / Rocket) */}
                              {needsSenderTxn && selected && (
                                <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
                                  <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                    <Wallet size={16} />
                                    Send money & confirm
                                  </h3>
                                  {selected.config?.instruction && (
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                      {selected.config.instruction}
                                    </p>
                                  )}
                                  {selected.config?.number && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm text-amber-900 dark:text-amber-200">
                                        Send to:
                                      </span>
                                      <code className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded font-mono text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                        {selected.config.number}
                                      </code>
                                      <button
                                        type="button"
                                        onClick={copyNumber}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 rounded text-sm font-medium hover:bg-amber-300 dark:hover:bg-amber-700 transition"
                                      >
                                        {copied ? (
                                          <Check size={14} />
                                        ) : (
                                          <Copy size={14} />
                                        )}
                                        {copied ? "Copied" : "Copy"}
                                      </button>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Controller
                                      name="senderNumber"
                                      control={control}
                                      rules={
                                        needsSenderTxn
                                          ? senderNumberValidationRule
                                          : {}
                                      }
                                      render={({ field, fieldState }) => (
                                        <div>
                                          <input
                                            {...field}
                                            type="tel"
                                            inputMode="numeric"
                                            placeholder="Your sending number *"
                                            maxLength={11}
                                            onChange={(e) => {
                                              const formatted =
                                                formatPhoneInput(
                                                  e.target.value,
                                                );
                                              field.onChange(formatted);
                                            }}
                                            className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-500/30 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                          />
                                          {fieldState.error && (
                                            <p className="text-red-500 text-xs mt-1">
                                              {fieldState.error.message}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    />
                                    <Controller
                                      name="transactionId"
                                      control={control}
                                      rules={
                                        needsSenderTxn
                                          ? { required: "Required" }
                                          : {}
                                      }
                                      render={({ field, fieldState }) => (
                                        <div>
                                          <input
                                            {...field}
                                            placeholder="Transaction ID *"
                                            className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-500/30 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                          />
                                          {fieldState.error && (
                                            <p className="text-red-500 text-xs mt-1">
                                              {fieldState.error.message}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {fieldState.error && (
                          <p className="text-red-500 text-xs mt-2">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>

              {/* Coupon Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCouponSection(!showCouponSection)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Have a coupon code?
                    </span>
                  </div>
                  {showCouponSection ? (
                    <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>

                {showCouponSection && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3">
                    {appliedCoupon ? (
                      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ticket
                            className="text-green-600 dark:text-green-400"
                            size={18}
                          />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              {appliedCoupon.code}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {appliedCoupon.type === "PERCENTAGE"
                                ? `${appliedCoupon.value}% off`
                                : `${CURRENCY_SYMBOL}${appliedCoupon.value} off`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded"
                          aria-label="Remove coupon"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        {myCoupons.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Your coupons
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {myCoupons.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
                                >
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {c.code}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {c.type === "PERCENTAGE"
                                      ? `${c.value}% off`
                                      : `${CURRENCY_SYMBOL}${c.value} off`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyMyCoupon(c)}
                                    disabled={validatingCoupon}
                                    className="ml-1 px-2 py-1 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-medium rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50"
                                  >
                                    {validatingCoupon ? "..." : "Apply"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Controller
                            name="couponCode"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                placeholder="Or enter coupon code"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleApplyCoupon();
                                  }
                                }}
                              />
                            )}
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={validatingCoupon || !couponCode?.trim()}
                            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {validatingCoupon ? "..." : "Apply"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4">
                  {cartData.items.map((item: any) => {
                    // Use the same image logic as ProductDetail page
                    const variantImages = Array.isArray(item?.variant?.images)
                      ? item.variant.images
                      : [];
                    const productImages = Array.isArray(
                      item?.variant?.product?.images,
                    )
                      ? item.variant.product.images
                      : [];
                    const selectedImage = item?.selectedImage
                      ? item.selectedImage.startsWith("http") ||
                        item.selectedImage.startsWith("data:")
                        ? item.selectedImage
                        : toImageUrl(item.selectedImage)
                      : null;
                    const itemImage =
                      selectedImage ||
                      getProductImage(
                        variantImages,
                        productImages,
                        item.variant?.product?.name || "Product",
                        48,
                      );

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <img
                          src={itemImage}
                          alt={item.variant?.product?.name || "Product"}
                          className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0 object-cover"
                          onError={(e) => {
                            e.currentTarget.src = generateProductPlaceholder(
                              item.variant?.product?.name || "Product",
                              48,
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {item.variant?.product?.name || "Product"}
                          </p>
                          {item.variant?.product?.brand && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Brand: {item.variant.product.brand.name}
                            </p>
                          )}
                          <p className="text-gray-600 dark:text-gray-400">
                            Qty: {item.quantity} × {CURRENCY_SYMBOL}
                            {(item.variant?.price ?? item.price ?? 0).toFixed(
                              2,
                            )}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {CURRENCY_SYMBOL}
                          {(
                            (item.variant?.price ?? item.price ?? 0) *
                            item.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>
                      {CURRENCY_SYMBOL}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>
                        -{CURRENCY_SYMBOL}
                        {discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span>
                      {qualifiesFreeDelivery
                        ? "FREE"
                        : `${CURRENCY_SYMBOL}${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  {paymentType === "digital" && paymentCharge > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-500 italic">
                      <span>Payment Charge (not included in total)</span>
                      <span>
                        {CURRENCY_SYMBOL}
                        {paymentCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>
                      {CURRENCY_SYMBOL}
                      {total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || cartData.items.length === 0}
                  className="w-full mt-6 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/30"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Placing order…
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
