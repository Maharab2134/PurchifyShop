import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { CURRENCY_SYMBOL } from '@/hooks/useFormatPrice'
import CheckoutModal from '@/components/cart/CheckoutModal'
import type { ShippingOption } from '@/api/shippingOptions'

interface CartSummaryProps {
  subtotal: number
  currency?: string
  totalItems: number
  cartId?: string
  shippingOptions?: ShippingOption[]
  /** Free delivery minimum amount (from admin Shipping Amount). Progress bar shown when enabled and > 0. */
  freeDeliveryMinAmount?: number
  /** When true, progress bar is shown and free shipping applies when subtotal >= freeDeliveryMinAmount. */
  freeDeliveryProgressBarEnabled?: boolean
}

const PROGRESS_BAR_LENGTH = 20

export default function CartSummary({
  subtotal,
  currency = CURRENCY_SYMBOL,
  totalItems,
  shippingOptions = [],
  freeDeliveryMinAmount = 0,
  freeDeliveryProgressBarEnabled = true,
}: CartSummaryProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)

  useEffect(() => {
    if (shippingOptions.length === 0) {
      setSelectedShippingId(null)
      return
    }
    const stillValid = selectedShippingId && shippingOptions.some((o) => o.id === selectedShippingId)
    if (stillValid) return
    setSelectedShippingId(shippingOptions[0].id)
  }, [shippingOptions, selectedShippingId])

  const selectedOption = useMemo(() => {
    const found = shippingOptions.find((o) => o.id === selectedShippingId)
    if (found) return found
    if (shippingOptions.length > 0) return shippingOptions[0]
    return null
  }, [shippingOptions, selectedShippingId])
  const baseShippingFee = useMemo(() => (selectedOption ? selectedOption.amount : 0), [selectedOption])
  const qualifiesFreeDelivery = Boolean(
    freeDeliveryProgressBarEnabled && freeDeliveryMinAmount > 0 && subtotal >= freeDeliveryMinAmount
  )
  const shippingFee = useMemo(
    () => (qualifiesFreeDelivery ? 0 : baseShippingFee),
    [qualifiesFreeDelivery, baseShippingFee]
  )
  const effectiveShippingId = selectedShippingId ?? selectedOption?.id ?? null
  const total = useMemo(() => subtotal - discount + shippingFee, [subtotal, discount, shippingFee])

  const freeDeliveryProgress = useMemo(() => {
    if (!freeDeliveryProgressBarEnabled || freeDeliveryMinAmount <= 0) return null
    const current = Math.min(subtotal, freeDeliveryMinAmount)
    const ratio = current / freeDeliveryMinAmount
    const filled = Math.round(ratio * PROGRESS_BAR_LENGTH)
    const remaining = Math.max(0, freeDeliveryMinAmount - subtotal)
    return { current, target: freeDeliveryMinAmount, filled, remaining, isReached: subtotal >= freeDeliveryMinAmount }
  }, [subtotal, freeDeliveryMinAmount, freeDeliveryProgressBarEnabled])

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/sign-in')
      return
    }
    navigate('/checkout')
  }

  const handleCheckoutSuccess = (orderId: string) => {
    navigate(`/orders/${orderId}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700"
    >
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        Order Summary
      </h2>

      {freeDeliveryProgress && (
        <div className="mb-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono text-indigo-800 dark:text-indigo-200 whitespace-nowrap">
              [{Array.from({ length: PROGRESS_BAR_LENGTH }, (_, i) => (
                <span key={i} className={i < freeDeliveryProgress.filled ? 'text-indigo-600 dark:text-indigo-400' : 'text-indigo-300 dark:text-indigo-600'}>
                  {i < freeDeliveryProgress.filled ? '█' : '░'}
                </span>
              ))}]
            </span>
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tabular-nums">
              {Math.round(freeDeliveryProgress.current).toLocaleString()} / {Math.round(freeDeliveryProgress.target).toLocaleString()}{currency}
            </span>
          </div>
          {freeDeliveryProgress.isReached ? (
            <p className="text-xs font-medium text-green-700 dark:text-green-400">
              You qualify for FREE delivery!
            </p>
          ) : (
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              Shop {Math.round(freeDeliveryProgress.remaining).toLocaleString()}{currency} more to get FREE delivery!
            </p>
          )}
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {Math.round(freeDeliveryProgress.target).toLocaleString()} টাকা বা তার বেশি শপিং করলে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!
          </p>
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <span>Total Items</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between text-gray-700 dark:text-gray-300">
          <span>Subtotal</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {currency}
            {subtotal.toFixed(2)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span>Discount</span>
            <span className="font-medium">
              -{currency}
              {discount.toFixed(2)}
            </span>
          </div>
        )}
        {shippingOptions.length > 0 ? (
          <>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping</label>
              <select
                value={effectiveShippingId ?? ''}
                onChange={(e) => setSelectedShippingId(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              >
                {shippingOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {currency}{o.amount.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Shipping</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {qualifiesFreeDelivery ? (
                  <span className="text-green-600 dark:text-green-400">FREE</span>
                ) : (
                  <>{currency}{shippingFee.toFixed(2)}</>
                )}
              </span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-gray-700 dark:text-gray-300">
            <span>Shipping</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {qualifiesFreeDelivery ? (
                <span className="text-green-600 dark:text-green-400">FREE</span>
              ) : (
                <>{currency}{shippingFee.toFixed(2)}</>
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Total</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">
            {currency}
            {total.toFixed(2)}
          </span>
        </div>
      </div>

      {isAuthenticated ? (
        <>
          <button
            disabled={totalItems === 0}
            onClick={handleProceedToCheckout}
            className="mt-4 w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-md font-medium text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Proceed to Checkout
          </button>
          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            subtotal={subtotal}
            shippingFee={shippingFee}
            shippingOptionId={effectiveShippingId}
            totalItems={totalItems}
            onSuccess={handleCheckoutSuccess}
            onDiscountChange={setDiscount}
          />
        </>
      ) : (
        <Link
          to="/sign-in"
          className="mt-4 w-full inline-block text-center bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 rounded-md font-medium text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
        >
          Sign in to Checkout
        </Link>
      )}
    </motion.div>
  )
}
