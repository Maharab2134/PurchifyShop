import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, ShoppingCart, Heart, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { cartApi } from '@/api/cart'
import { wishlistApi } from '@/api/wishlist'
import { useTranslation } from 'react-i18next'

/**
 * Bottom nav — Daraz / Amazon / Cartup / Pickaboo / Chaldal style blend:
 * Flat bar, clear icons + labels, orange active state, cart badge, safe area.
 */
export default function MobileBottomNav() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)

  const isAdminPage = location.pathname.startsWith('/dashboard')

  useEffect(() => {
    cartApi
      .get()
      .then((res) => {
        const d = res.data?.data
        setCartCount(d?.itemCount ?? (d?.items?.length ?? 0))
      })
      .catch(() => setCartCount(0))
  }, [location.pathname])

  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistCount(0)
      return
    }
    wishlistApi
      .get()
      .then((res) => {
        const ids = res.data?.data?.productIds ?? []
        setWishlistCount(ids.length)
      })
      .catch(() => setWishlistCount(0))
  }, [location.pathname, isAuthenticated])

  useEffect(() => {
    const onUpdate = () => {
      if (!isAuthenticated) return
      wishlistApi
        .get()
        .then((res) => {
          const ids = res.data?.data?.productIds ?? []
          setWishlistCount(ids.length)
        })
        .catch(() => setWishlistCount(0))
    }
    window.addEventListener('wishlist:updated', onUpdate)
    return () => window.removeEventListener('wishlist:updated', onUpdate)
  }, [isAuthenticated])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  if (isAdminPage) return null

  const items = [
    { path: '/shop', label: t('nav.shop', 'Shop'), Icon: ShoppingBag },
    { path: '/wishlist', label: t('nav.wishlist', 'Wishlist'), Icon: Heart, badge: wishlistCount },
    { path: '/', label: t('nav.home', 'Home'), Icon: Home, isCenter: true },
    { path: '/cart', label: t('nav.cart', 'Cart'), Icon: ShoppingCart, badge: cartCount },
    {
      path: isAuthenticated ? '/profile' : '/sign-in',
      label: isAuthenticated ? t('nav.profile', 'Account') : t('auth.login', 'Login'),
      Icon: User,
    },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom"
      style={{ boxShadow: '0 -1px 10px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-around h-16 px-1">
        {items.map(({ path, label, Icon, badge, isCenter }) => {
          const active = isActive(path)
          const showBadge = typeof badge === 'number' && badge > 0

          if (isCenter) {
            return (
              <Link
                key={path}
                to={path}
                className="flex flex-col items-center justify-center flex-1 min-w-0 py-1.5 -mt-5"
                aria-label={label}
              >
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    active
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icon size={24} strokeWidth={2} />
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium ${
                    active ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center flex-1 min-w-0 py-2 min-h-[44px] active:opacity-80"
              aria-label={label}
            >
              <div className="relative flex items-center justify-center w-9 h-9">
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.75}
                  className={
                    active
                      ? 'text-orange-500 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span
                className={`mt-0.5 text-[10px] font-medium ${
                  active ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
