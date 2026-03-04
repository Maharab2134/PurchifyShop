import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, Heart } from 'lucide-react'
import { configApi, type TopbarConfig, type LanguageSettings } from '@/api/config'
import { wishlistApi } from '@/api/wishlist'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import i18nInstance from '@/i18n/i18n'

// Cache config globally to avoid refetching
let cachedTopbar: TopbarConfig | null = null
let cachedLanguageSettings: LanguageSettings | null = null
let configFetchPromise: Promise<void> | null = null

export default function TopBar() {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const [config, setConfig] = useState<TopbarConfig | null>(cachedTopbar)
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings | null>(cachedLanguageSettings)
  const [currentLang, setCurrentLang] = useState<'en' | 'bn'>(() =>
    i18nInstance.language === 'bn' ? 'bn' : 'en'
  )
  const [wishlistCount, setWishlistCount] = useState(0)

  // Fetch config only once, use cache if available
  useEffect(() => {
    if (cachedTopbar) {
      setConfig(cachedTopbar)
      setLanguageSettings(cachedLanguageSettings)
      return
    }
    
    if (configFetchPromise) {
      configFetchPromise
        .then(() => {
          setConfig(cachedTopbar)
          setLanguageSettings(cachedLanguageSettings)
        })
        .catch(() => setConfig(null))
      return
    }

    configFetchPromise = configApi
      .getConfig()
      .then(({ topbar, languageSettings }) => {
        cachedTopbar = topbar
        cachedLanguageSettings = languageSettings
        setConfig(topbar)
        setLanguageSettings(languageSettings)
      })
      .catch(() => {
        cachedTopbar = null
        cachedLanguageSettings = null
        setConfig(null)
      })
      .finally(() => {
        configFetchPromise = null
      })
  }, [])

  // Fetch wishlist count only when authenticated changes, not on every route
  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistCount(0)
      return
    }
    
    const controller = new AbortController()
    wishlistApi
      .get()
      .then((res) => {
        if (!controller.signal.aborted) {
          const ids = res.data?.data?.productIds ?? []
          setWishlistCount(ids.length)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setWishlistCount(0)
        }
      })
    
    return () => controller.abort()
  }, [isAuthenticated])

  // Listen for wishlist updates
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

  // Always show TopBar, use default values if config not loaded or inactive
  const isActive = config?.isActive ?? true
  const bg = config?.bgColor || '#ffffff'
  const text = config?.textColor || '#374151'
  const link = config?.linkColor || '#4f46e5'
  const wishlistLabel = t('topbar.wishlist', config?.wishlistLabel || 'My Wishlist')
  const trackOrderLabel = t('topbar.trackOrder', config?.trackOrderLabel || 'Track Order')
  // Wishlist path (default: /wishlist)
  const wishlistPath = (config?.wishlistPath?.trim() || '/wishlist').trim()
  const wishlistHref = wishlistPath.startsWith('/') ? wishlistPath : `/${wishlistPath}`
  // Track Order path (default: /track-order)
  const trackPath = (config?.trackOrderPath?.trim() || '/track-order').trim()
  const trackHref = trackPath.startsWith('/') ? trackPath : `/${trackPath}`
  // Apply for Vendors (controlled from admin)
  const showApplyForVendors = config?.showApplyForVendors === true
  const applyForVendorsLabel = config?.applyForVendorsLabel?.trim() || 'Apply for Vendors'
  const applyForVendorsPath = (config?.applyForVendorsPath?.trim() || '/apply-vendor').trim()
  const applyVendorHref = applyForVendorsPath.startsWith('/') ? applyForVendorsPath : `/${applyForVendorsPath}`

  // Don't render if explicitly disabled (but still show while loading)
  if (config !== null && !isActive) return null

  const showLanguageToggle =
    !!languageSettings &&
    languageSettings.isActive !== false &&
    !!languageSettings.enabled?.en &&
    !!languageSettings.enabled?.bn

  const handleChangeLanguage = (lang: 'en' | 'bn') => {
    setCurrentLang(lang)
    i18nInstance.changeLanguage(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }

  return (
    <div
      className="hidden sm:block w-full py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm border-b border-gray-200 dark:border-gray-700"
      style={{ backgroundColor: bg, color: text }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Mobile: Single row layout */}
        <div className="flex sm:hidden items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0">
            {config?.email && (
              <a
                href={`mailto:${config.email}`}
                className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ color: text }}
              >
                <Mail size={12} className="flex-shrink-0" />
                <span className="text-[10px]">{config.email.length > 15 ? config.email.substring(0, 15) + '...' : config.email}</span>
              </a>
            )}
            {config?.phone && (
              <a
                href={`tel:${config.phone.replace(/[\s\-\(\)]/g, '')}`}
                className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity flex-shrink-0"
                style={{ color: text }}
              >
                <Phone size={12} className="flex-shrink-0" />
                <span className="text-[10px] whitespace-nowrap">{config.phone.length > 12 ? config.phone.substring(0, 12) + '...' : config.phone}</span>
              </a>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link
              to={wishlistHref}
              className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity font-medium whitespace-nowrap flex-shrink-0"
              style={{ color: link }}
            >
              <Heart size={12} className="flex-shrink-0" />
              <span className="text-[10px]">{wishlistLabel} ({wishlistCount})</span>
            </Link>
            {config?.showTrackOrder !== false && (
              <>
                <span className="text-gray-400 dark:text-gray-500 flex-shrink-0" style={{ color: text, opacity: 0.6 }} aria-hidden>•</span>
                <Link
                  to={trackHref}
                  className="font-medium hover:opacity-80 transition-opacity whitespace-nowrap text-[10px] flex-shrink-0"
                  style={{ color: link }}
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  {trackOrderLabel}
                </Link>
              </>
            )}
            {showApplyForVendors && (
              <>
                <span className="text-gray-400 dark:text-gray-500 flex-shrink-0" style={{ color: text, opacity: 0.6 }} aria-hidden>•</span>
                <Link
                  to={applyVendorHref}
                  className="font-medium hover:opacity-80 transition-opacity whitespace-nowrap text-[10px] flex-shrink-0"
                  style={{ color: link }}
                >
                  {applyForVendorsLabel}
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Desktop: Two row layout */}
        <div className="hidden sm:flex sm:items-center sm:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-4 lg:gap-6">
            {config?.email && (
              <a
                href={`mailto:${config.email}`}
                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{ color: text }}
              >
                <Mail size={14} className="flex-shrink-0" />
                <span>{config.email}</span>
              </a>
            )}
            {config?.phone && (
              <a
                href={`tel:${config.phone.replace(/[\s\-\(\)]/g, '')}`}
                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{ color: text }}
              >
                <Phone size={14} className="flex-shrink-0" />
                <span className="whitespace-nowrap">{config.phone}</span>
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {showLanguageToggle && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChangeLanguage('en')}
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    currentLang === 'en' ? 'bg-white/40' : 'hover:bg-white/20'
                  }`}
                  style={{ color: link }}
                >
                  {t('language.en', 'English')}
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeLanguage('bn')}
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    currentLang === 'bn' ? 'bg-white/40' : 'hover:bg-white/20'
                  }`}
                  style={{ color: link }}
                >
                  {t('language.bn', 'বাংলা')}
                </button>
              </div>
            )}
            <Link
              to={wishlistHref}
              className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity font-medium whitespace-nowrap"
              style={{ color: link }}
            >
              <Heart size={14} className="flex-shrink-0" />
              <span className="text-sm">{wishlistLabel} ({wishlistCount})</span>
            </Link>
            {config?.showTrackOrder !== false && (
              <>
                <span className="text-gray-400 dark:text-gray-500" style={{ color: text, opacity: 0.6 }} aria-hidden>|</span>
                <Link
                  to={trackHref}
                  className="font-medium hover:opacity-80 transition-opacity whitespace-nowrap text-sm"
                  style={{ color: link }}
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                >
                  {trackOrderLabel}
                </Link>
              </>
            )}
            {showApplyForVendors && (
              <>
                <span className="text-gray-400 dark:text-gray-500" style={{ color: text, opacity: 0.6 }} aria-hidden>|</span>
                <Link
                  to={applyVendorHref}
                  className="font-medium hover:opacity-80 transition-opacity whitespace-nowrap text-sm"
                  style={{ color: link }}
                >
                  {applyForVendorsLabel}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
