import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Copy, Check, Ticket, X, MapPin, Plus, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '@/components/common/Modal'
import { paymentMethodsApi, type PaymentMethod } from '@/api/paymentMethods'
import { couponsApi, type Coupon } from '@/api/coupons'
import { addressesApi, type Address } from '@/api/addresses'
import { useAuth } from '@/hooks/useAuth'
import axiosInstance from '@/utils/axiosInstance'
import useToast from '@/hooks/useToast'
import { CURRENCY_SYMBOL } from '@/hooks/useFormatPrice'
import { formatPhoneInput, senderNumberValidationRule } from '@/utils/phoneValidation'

type FormValues = {
  selectedAddressId: string | null
  street: string
  city: string
  state: string
  country: string
  zip: string
  phone: string
  paymentMethodId: number | null
  senderNumber: string
  transactionId: string
  couponCode: string
}

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  subtotal: number
  shippingFee: number
  shippingOptionId?: string | null
  totalItems: number
  onSuccess: (orderId: string) => void
  onDiscountChange?: (discount: number) => void
}

export default function CheckoutModal({
  open,
  onClose,
  subtotal,
  shippingFee,
  shippingOptionId,
  totalItems,
  onSuccess,
  onDiscountChange,
}: CheckoutModalProps) {
  const { showToast } = useToast()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [useNewAddress, setUseNewAddress] = useState(false)
  const [showCouponSection, setShowCouponSection] = useState(false)

  const { user } = useAuth()
  const { control, handleSubmit, watch, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      selectedAddressId: null,
      street: '',
      city: '',
      state: '',
      country: 'Bangladesh',
      zip: '',
      phone: user?.phone || '',
      paymentMethodId: null,
      senderNumber: '',
      transactionId: '',
      couponCode: '',
    },
  })

  const selectedAddressId = watch('selectedAddressId')

  const couponCode = watch('couponCode')

  const paymentMethodId = watch('paymentMethodId')
  const selected = methods.find((m) => m.id === paymentMethodId)
  const needsSenderTxn = selected?.requiresSenderAndTxn ?? false

  useEffect(() => {
    if (open) {
      setLoading(true)
      
      // Verify cart and load data
      Promise.allSettled([
        // Verify cart has items
        axiosInstance.get('/cart')
          .then((cartRes) => {
            const cart = cartRes.data.data
            if (!cart || !cart.items || cart.items.length === 0) {
              showToast('Your cart is empty. Please add items before checkout.', 'error')
              onClose()
              return null
            }
            return cart
          })
          .catch((err) => {
            console.error('Cart verification error:', err)
            showToast('Failed to verify cart. Please try again.', 'error')
            onClose()
            return null
          }),
        // Load payment methods
        paymentMethodsApi.getAll()
          .then((r) => setMethods(r.data.data ?? []))
          .catch(() => showToast('Failed to load payment methods.', 'error')),
        // Load addresses
        addressesApi.getAll()
          .then((r) => {
            const addrs = r.data.data ?? []
            setAddresses(addrs)
            if (addrs.length > 0 && !useNewAddress) {
              setValue('selectedAddressId', addrs[0].id)
              setValue('street', addrs[0].street)
              setValue('city', addrs[0].city)
              setValue('state', addrs[0].state)
              setValue('country', addrs[0].country)
              setValue('zip', addrs[0].zip)
            } else if (addrs.length === 0) {
              setUseNewAddress(true)
            }
            // Ensure phone is set after addresses are loaded
            if (user?.phone) {
              setValue('phone', user.phone)
            } else if (typeof window !== 'undefined') {
              try {
                const userStr = localStorage.getItem('user')
                if (userStr) {
                  const localUser = JSON.parse(userStr)
                  if (localUser?.phone) {
                    setValue('phone', localUser.phone)
                  }
                }
              } catch (e) {
                console.error('Failed to parse user from localStorage:', e)
              }
            }
          })
          .catch(() => {
            setUseNewAddress(true)
            // Still try to set phone even if addresses fail
            if (user?.phone) {
              setValue('phone', user.phone)
            } else if (typeof window !== 'undefined') {
              try {
                const userStr = localStorage.getItem('user')
                if (userStr) {
                  const localUser = JSON.parse(userStr)
                  if (localUser?.phone) {
                    setValue('phone', localUser.phone)
                  }
                }
              } catch (e) {
                console.error('Failed to parse user from localStorage:', e)
              }
            }
          }),
      ]).then((results) => {
        // Check if cart verification failed
        const cartResult = results[0]
        if (cartResult?.status === 'rejected' || (cartResult?.status === 'fulfilled' && cartResult.value === null)) {
          // Cart verification failed, modal should already be closed
          return
        }
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
      // Get phone from user or localStorage
      let phoneValue = ''
      if (user?.phone) {
        phoneValue = user.phone
      } else if (typeof window !== 'undefined') {
        try {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            const localUser = JSON.parse(userStr)
            if (localUser?.phone) {
              phoneValue = localUser.phone
            }
          }
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e)
        }
      }
      
      if (!useNewAddress) {
        reset({
          selectedAddressId: null,
          street: '',
          city: '',
          state: '',
          country: 'Bangladesh',
          zip: '',
          phone: phoneValue,
          paymentMethodId: null,
          senderNumber: '',
          transactionId: '',
          couponCode: '',
        })
      } else {
        reset({
          selectedAddressId: null,
          street: '',
          city: '',
          state: '',
          country: 'Bangladesh',
          zip: '',
          phone: phoneValue,
          paymentMethodId: null,
          senderNumber: '',
          transactionId: '',
          couponCode: '',
        })
      }
      setAppliedCoupon(null)
      setDiscount(0)
      onDiscountChange?.(0)
      // Reset useNewAddress only if we're closing, otherwise let addresses loading determine it
      if (!open) {
        setUseNewAddress(false)
      }
    }
  }, [open, reset, onDiscountChange, setValue])

  useEffect(() => {
    if (selectedAddressId && !useNewAddress) {
      const addr = addresses.find((a) => a.id === selectedAddressId)
      if (addr) {
        setValue('street', addr.street)
        setValue('city', addr.city)
        setValue('state', addr.state)
        setValue('country', addr.country)
        setValue('zip', addr.zip)
      }
    }
  }, [selectedAddressId, addresses, setValue, useNewAddress])

  const handleApplyCoupon = async () => {
    if (!couponCode?.trim()) {
      showToast('Enter a coupon code.', 'error')
      return
    }
    setValidatingCoupon(true)
    try {
      const res = await couponsApi.validateCoupon(couponCode.trim())
      const coupon = res.data.data
      const calculatedDiscount = coupon.type === 'PERCENTAGE'
        ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
        : Math.min(coupon.value, subtotal)
      setAppliedCoupon(coupon)
      setDiscount(calculatedDiscount)
      onDiscountChange?.(calculatedDiscount)
      showToast('Coupon applied successfully!', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid coupon'
      showToast(msg, 'error')
      setAppliedCoupon(null)
      setDiscount(0)
      onDiscountChange?.(0)
    } finally {
      setValidatingCoupon(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setDiscount(0)
    setValue('couponCode', '')
    onDiscountChange?.(0)
  }

  const copyNumber = () => {
    const n = selected?.config?.number
    if (!n) return
    navigator.clipboard.writeText(n)
    setCopied(true)
    showToast('Number copied.', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!data.paymentMethodId) {
      showToast('Select a payment method.', 'error')
      return
    }
    if (needsSenderTxn && (!data.senderNumber?.trim() || !data.transactionId?.trim())) {
      showToast('Enter your sending number and transaction ID.', 'error')
      return
    }
    
    // Validate phone
    if (!data.phone?.trim()) {
      showToast('Phone number is required.', 'error')
      return
    }
    
    // Validate address: either selectedAddressId or all address fields
    if (!data.selectedAddressId && (!data.street?.trim() || !data.city?.trim() || !data.state?.trim() || !data.country?.trim() || !data.zip?.trim())) {
      showToast('Please provide a shipping address.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        phone: data.phone.trim(),
        paymentMethodId: data.paymentMethodId,
        senderNumber: needsSenderTxn ? data.senderNumber.trim() : undefined,
        transactionId: needsSenderTxn ? data.transactionId.trim() : undefined,
        couponCode: appliedCoupon?.code || undefined,
        shippingOptionId: shippingOptionId || undefined,
      }

      // If saved address is selected, send addressId; otherwise send full address
      if (data.selectedAddressId && !useNewAddress) {
        payload.addressId = data.selectedAddressId
        // Don't send address fields when using addressId
      } else {
        // Send full address fields for new address
        payload.street = data.street?.trim() || ''
        payload.city = data.city?.trim() || ''
        payload.state = data.state?.trim() || ''
        payload.country = data.country?.trim() || ''
        payload.zip = data.zip?.trim() || ''
      }

      const res = await axiosInstance.post<{ data: { orderId: string; trackingNumber?: string } }>('/checkout', payload)
      const trackingMsg = res.data.data.trackingNumber 
        ? ` Order tracking: ${res.data.data.trackingNumber}`
        : ''
      showToast(`Order placed successfully.${trackingMsg}`, 'success')
      onClose()
      onSuccess(res.data.data.orderId)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: any } } }
      const msg = err?.response?.data?.message ?? 'Checkout failed'
      const errors = err?.response?.data?.errors
      console.error('Checkout error:', { msg, errors, fullError: err })
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Modal open={open} onClose={onClose} title="Checkout" size="lg">
      <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipping address</h3>
              {addresses.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setUseNewAddress(!useNewAddress)
                    if (!useNewAddress) {
                      setValue('selectedAddressId', null)
                      setValue('street', '')
                      setValue('city', '')
                      setValue('state', '')
                      setValue('country', 'Bangladesh')
                      setValue('zip', '')
                    } else {
                      setValue('selectedAddressId', addresses[0].id)
                    }
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  {useNewAddress ? (
                    <>
                      <MapPin className="w-3 h-3" />
                      Use saved address
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      Add new address
                    </>
                  )}
                </button>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">Enter your shipping address</span>
              )}
            </div>

            {!useNewAddress && addresses.length > 0 ? (
              <div className="space-y-2 mb-4">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedAddressId"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setValue('selectedAddressId', addr.id)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      {addr.label && (
                        <p className="font-medium text-gray-800 text-sm mb-1">{addr.label}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {addr.street}, {addr.city}, {addr.state}, {addr.country} - {addr.zip}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Controller
                name="street"
                control={control}
                rules={{ required: 'Required' }}
                render={({ field, fieldState }) => (
                  <div className="sm:col-span-2">
                    <input {...field} placeholder="Street" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" />
                    {fieldState.error && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller name="city" control={control} rules={{ required: 'Required' }} render={({ field, fieldState }) => (
                <div><input {...field} placeholder="City *" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}</div>
              )} />
              <Controller name="state" control={control} rules={{ required: 'Required' }} render={({ field, fieldState }) => (
                <div><input {...field} placeholder="State *" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}</div>
              )} />
              <Controller name="country" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                <input {...field} placeholder="Country" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
              )} />
              <Controller name="zip" control={control} rules={{ required: 'Required' }} render={({ field, fieldState }) => (
                <div><input {...field} placeholder="ZIP *" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}</div>
              )} />
            </div>
            )}
            
            {/* Phone Number Field */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
              <Controller
                name="phone"
                control={control}
                rules={{ required: 'Phone number is required' }}
                render={({ field, fieldState }) => (
                  <div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...field}
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    {fieldState.error && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment method *</h3>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Loading…</p>
            ) : methods.length === 0 ? (
              <p className="text-amber-600 dark:text-amber-400 text-sm">No payment methods available.</p>
            ) : (
              <Controller
                name="paymentMethodId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {methods.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                          field.value === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethodId"
                          checked={field.value === m.id}
                          onChange={() => field.onChange(m.id)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="font-medium text-gray-800">{m.name}</span>
                          {m.charge > 0 && (
                            <span className="text-sm text-gray-600">
                              Charge: {CURRENCY_SYMBOL}{((m.charge / 1000) * subtotal).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
            )}
          </div>

          {needsSenderTxn && selected && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
              <h3 className="text-sm font-medium text-amber-900">Send money &amp; confirm</h3>
              {selected.config?.instruction && (
                <p className="text-sm text-amber-800">{selected.config.instruction}</p>
              )}
              {selected.config?.number && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-amber-900">Send to:</span>
                  <code className="px-2 py-1 bg-white rounded font-mono text-amber-900">{selected.config.number}</code>
                  <button type="button" onClick={copyNumber} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-200 text-amber-900 rounded text-sm font-medium hover:bg-amber-300">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name="senderNumber"
                  control={control}
                  rules={needsSenderTxn ? senderNumberValidationRule : {}}
                  render={({ field, fieldState }) => (
                    <div>
                      <input
                        {...field}
                        type="tel"
                        inputMode="numeric"
                        placeholder="Your sending number *"
                        maxLength={11}
                        onChange={(e) => {
                          const formatted = formatPhoneInput(e.target.value)
                          field.onChange(formatted)
                        }}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                      {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="transactionId"
                  control={control}
                  rules={needsSenderTxn ? { required: 'Required' } : {}}
                  render={({ field, fieldState }) => (
                    <div>
                      <input {...field} placeholder="Transaction ID *" className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                      {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          <div>
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
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                {appliedCoupon ? (
                  <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ticket className="text-green-600 dark:text-green-400" size={18} />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">{appliedCoupon.code}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {appliedCoupon.type === 'PERCENTAGE' ? `${appliedCoupon.value}% off` : `${CURRENCY_SYMBOL}${appliedCoupon.value} off`}
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
                  <div className="flex gap-2">
                    <Controller
                      name="couponCode"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          placeholder="Enter coupon code"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleApplyCoupon()
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
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{CURRENCY_SYMBOL}{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{CURRENCY_SYMBOL}{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{CURRENCY_SYMBOL}{shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-800 pt-2">
              <span>Total</span>
              <span>{CURRENCY_SYMBOL}{(subtotal - discount + shippingFee).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition">
              Cancel
            </button>
            <button type="submit" disabled={submitting || totalItems === 0} className="flex-1 px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-indigo-500/30">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing order…
                </span>
              ) : (
                'Place order'
              )}
            </button>
          </div>
        </form>
    </Modal>
  )
}
