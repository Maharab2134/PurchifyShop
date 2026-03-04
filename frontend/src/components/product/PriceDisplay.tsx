import useFormatPrice from '@/hooks/useFormatPrice'

export interface PriceDisplayProps {
  /** Discount badge e.g. "-10%" */
  discountBadge?: string | null
  /** Original price before discount */
  originalPrice: number
  /** Price after discount (or same as original if no discount) */
  discountedPrice: number
  /** Whether discount is currently active */
  isDiscountActive?: boolean
  /** Optional class for container */
  className?: string
  /** Size: 'sm' | 'base' | 'lg' | 'xl' */
  size?: 'sm' | 'base' | 'lg' | 'xl'
}

/**
 * Renders price as "-10% ৳500.00 ৳450.00" when discount active,
 * else just "৳450.00". Uses ৳ (BDT).
 */
export default function PriceDisplay({
  discountBadge,
  originalPrice,
  discountedPrice,
  isDiscountActive = false,
  className = '',
  size = 'base',
}: PriceDisplayProps) {
  const formatPrice = useFormatPrice()
  const showDiscount = isDiscountActive && discountBadge && originalPrice > discountedPrice

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg sm:text-xl',
    xl: 'text-2xl sm:text-3xl',
  }
  const badgeSize = size === 'lg' || size === 'xl' ? 'text-xs' : 'text-[10px]'

  return (
    <div className={`flex flex-wrap items-baseline gap-1.5 ${className}`}>
      {showDiscount && (
        <>
          <span className={`px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold rounded ${badgeSize}`}>
            {discountBadge}
          </span>
          <span className={`text-gray-400 dark:text-gray-500 line-through ${sizeClasses[size]}`}>
            {formatPrice(originalPrice)}
          </span>
        </>
      )}
      <span className={`font-bold text-gray-900 dark:text-gray-100 ${sizeClasses[size]} ${showDiscount ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
        {formatPrice(discountedPrice)}
      </span>
    </div>
  )
}
