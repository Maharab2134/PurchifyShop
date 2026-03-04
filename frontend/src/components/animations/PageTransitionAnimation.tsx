import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { toImageUrl } from '@/utils/imageUrl'
import { storeInfoApi } from '@/api/storeInfo'

interface PageTransitionAnimationProps {
  isActive: boolean
  duration: number
  backgroundColor: string
  circleColor: string
}

export default function PageTransitionAnimation({
  isActive,
  duration,
  backgroundColor,
  circleColor,
}: PageTransitionAnimationProps) {
  const location = useLocation()
  const [logo, setLogo] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string>('Store')
  const [logoStatus, setLogoStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [show, setShow] = useState(false)
  const previousPathRef = useRef<string | null>(null)
  const isInitialMountRef = useRef(true)

  // Load store info once and keep it
  useEffect(() => {
    setLogoStatus('loading')
    storeInfoApi
      .get()
      .then((info) => {
        setLogo(info.logo ? toImageUrl(info.logo) : null)
        setStoreName(info.storeName?.trim() || 'Store')
        setLogoStatus('loaded')
      })
      .catch(() => {
        setLogo(null)
        setStoreName('Store')
        setLogoStatus('error')
      })
  }, [])

  // Show animation on route change (not on initial mount)
  useEffect(() => {
    if (!isActive) {
      setShow(false)
      // Still track the path even if inactive
      if (previousPathRef.current === null) {
        previousPathRef.current = location.pathname
      }
      isInitialMountRef.current = false
      return
    }

    // Skip animation on initial mount
    if (isInitialMountRef.current) {
      previousPathRef.current = location.pathname
      isInitialMountRef.current = false
      return
    }

    // Only show if path actually changed
    if (previousPathRef.current !== location.pathname) {
      setShow(true)
      previousPathRef.current = location.pathname
      
      // Hide after duration
      const hideTimer = setTimeout(() => {
        setShow(false)
      }, duration)
      
      return () => {
        clearTimeout(hideTimer)
      }
    }
  }, [location.pathname, isActive, duration])

  if (!isActive) return null

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-9998 flex items-center justify-center"
          style={{ backgroundColor }}
        >
          {/* Logo with Rotating Circle - Center */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center relative"
          >
            {/* Container for Logo and Circle - Perfectly Centered */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
              {/* Rotating Circle Around Logo */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              >
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={circleColor || '#6366f1'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="282.6"
                    strokeDashoffset="70.65"
                    opacity="0.9"
                  />
                </svg>
              </motion.div>
              
              {/* Logo - Static in Center */}
              {logoStatus === 'loaded' && logo ? (
                <motion.img
                  src={logo}
                  alt={storeName || 'Logo'}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10"
                  loading="eager"
                  decoding="async"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    imageRendering: 'auto',
                    filter: 'none',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    setLogo(null)
                    setLogoStatus('error')
                  }}
                />
              ) : logoStatus === 'loaded' || logoStatus === 'error' ? (
                <motion.div
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 flex items-center justify-center relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="text-white text-xl sm:text-2xl font-bold">
                    {storeName ? storeName.charAt(0).toUpperCase() : 'L'}
                  </span>
                </motion.div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24" />
              )}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
