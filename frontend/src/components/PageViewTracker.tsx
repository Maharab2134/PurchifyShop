import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '@/api/analytics'

function isStorefrontPath(path: string): boolean {
  if (path.startsWith('/dashboard') || path.startsWith('/sign-in') || path.startsWith('/sign-up') || path.startsWith('/password-reset')) return false
  return path === '/' || path.startsWith('/shop') || path.startsWith('/product/') || path.startsWith('/cart') ||
    path.startsWith('/wishlist') || path.startsWith('/coupons') || path.startsWith('/orders') || path.startsWith('/profile')
}

export default function PageViewTracker() {
  const location = useLocation()
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    const path = location.pathname
    if (prevPathRef.current === path) return
    prevPathRef.current = path
    if (!isStorefrontPath(path)) return
    trackPageView(path)
  }, [location.pathname])

  return null
}
