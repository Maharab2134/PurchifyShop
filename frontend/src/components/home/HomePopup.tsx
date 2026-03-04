import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { animationApi } from '@/api/animation'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '@/lib/config'

export default function HomePopup() {
  const location = useLocation()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<{
    isActive: boolean
    showTime: number
    delayTime: number
    image?: string
    title?: string
    description?: string
    buttonText?: string
    buttonLink?: string
    pages?: string[]
  } | null>(null)
  const [show, setShow] = useState(false)
  const [hasShown, setHasShown] = useState(false)
  const [welcomeCompleted, setWelcomeCompleted] = useState(false)

  // Listen for welcome animation completion
  useEffect(() => {
    const handleWelcomeComplete = () => {
      setWelcomeCompleted(true)
    }
    window.addEventListener('welcome-animation-complete', handleWelcomeComplete)
    return () => {
      window.removeEventListener('welcome-animation-complete', handleWelcomeComplete)
    }
  }, [])

  useEffect(() => {
    animationApi
      .get()
      .then((data) => {
        const popupSettings = data.popupSettings
        const animSettings = data.animationSettings
        
        if (popupSettings) {
          // Check if popup should show on current page
          const pages = popupSettings.pages || []
          const shouldShowOnPage = pages.length === 0 || pages.includes(location.pathname)
          
          if (!shouldShowOnPage) {
            setSettings({
              isActive: false,
              showTime: 3000,
              delayTime: 2500,
            })
            return
          }
          
          setSettings({
            isActive: popupSettings.isActive ?? false,
            showTime: popupSettings.showTime ?? 3000,
            delayTime: popupSettings.delayTime ?? 2500,
            image: popupSettings.image ?? '',
            title: popupSettings.title ?? '',
            description: popupSettings.description ?? '',
            buttonText: popupSettings.buttonText ?? '',
            buttonLink: popupSettings.buttonLink ?? '',
            pages: popupSettings.pages ?? [],
          })

          // Check if popup should be shown
          if (popupSettings.isActive && !hasShown) {
            const popupShownKey = pages.length > 0 
              ? `popup_shown_${location.pathname}` 
              : 'home_popup_shown'
            const popupShown = localStorage.getItem(popupShownKey)
            if (!popupShown) {
              // Wait for welcome animation to complete, then show popup
              const checkWelcomeComplete = () => {
                const welcomeActive = animSettings?.welcomeAnimation?.isActive ?? false
                const delay = welcomeActive && !welcomeCompleted 
                  ? (animSettings.welcomeAnimation.duration + (popupSettings.delayTime ?? 2500))
                  : (popupSettings.delayTime ?? 2500)

                setTimeout(() => {
                  setShow(true)
                  // Auto-hide after showTime
                  setTimeout(() => {
                    setShow(false)
                    setHasShown(true)
                    const popupShownKey = pages.length > 0 
                      ? `popup_shown_${location.pathname}` 
                      : 'home_popup_shown'
                    localStorage.setItem(popupShownKey, 'true')
                  }, popupSettings.showTime ?? 3000)
                }, delay)
              }

              const welcomeActive = animSettings?.welcomeAnimation?.isActive ?? false
              if (welcomeActive && !welcomeCompleted) {
                // Wait for welcome to complete
                const interval = setInterval(() => {
                  if (welcomeCompleted) {
                    clearInterval(interval)
                    checkWelcomeComplete()
                  }
                }, 100)
                return () => clearInterval(interval)
              } else {
                checkWelcomeComplete()
              }
            }
          }
        } else {
          // Set default settings if no data
          setSettings({
            isActive: false,
            showTime: 3000,
            delayTime: 2500,
          })
        }
      })
      .catch((error) => {
        // Set default settings on error
        setSettings({
          isActive: false,
          showTime: 3000,
          delayTime: 2500,
        })
        console.error('Failed to load popup settings:', error)
      })
  }, [hasShown, location.pathname, welcomeCompleted])
  
  // Reset hasShown when pathname changes (if pages array is configured)
  useEffect(() => {
    if (settings?.pages && settings.pages.length > 0) {
      // Reset popup shown state when navigating to a different configured page
      const popupShownKey = `popup_shown_${location.pathname}`
      const wasShown = localStorage.getItem(popupShownKey)
      if (!wasShown) {
        setHasShown(false)
      }
    }
  }, [location.pathname, settings?.pages])

  const handleClose = () => {
    setShow(false)
    setHasShown(true)
    const popupShownKey = settings?.pages && settings.pages.length > 0 
      ? `popup_shown_${location.pathname}` 
      : 'home_popup_shown'
    localStorage.setItem(popupShownKey, 'true')
  }
  
  const handleButtonClick = () => {
    if (settings?.buttonLink) {
      if (settings.buttonLink.startsWith('http://') || settings.buttonLink.startsWith('https://')) {
        window.open(settings.buttonLink, '_blank')
      } else {
        navigate(settings.buttonLink)
      }
    }
    handleClose()
  }

  if (!settings || !settings.isActive || !show) return null

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[111] w-full max-w-sm sm:max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: '#8B1538' }} // Dark red/maroon background
          >
            <div className="relative p-4 sm:p-6">
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors z-10"
                aria-label="Close popup"
              >
                <X size={20} />
              </button>
              
              {/* Title and Description */}
              {(settings.title || settings.description) && (
                <div className="text-center mb-4">
                  {settings.title && (
                    <h3 className="text-white text-lg sm:text-xl font-bold mb-2">
                      {settings.title}
                    </h3>
                  )}
                  {settings.description && (
                    <p className="text-white/90 text-sm sm:text-base">
                      {settings.description}
                    </p>
                  )}
                </div>
              )}

              {/* Product Image */}
              {settings.image && (
                <div className="mb-4 flex justify-center">
                  <div className="w-full max-w-xs h-48 sm:h-64 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={settings.image.startsWith('http') 
                        ? settings.image 
                        : `${API_BASE_URL.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${settings.image}`}
                      alt="Popup"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Button */}
              {settings.buttonText && (
                <div className="mt-4">
                  <button
                    onClick={handleButtonClick}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    {settings.buttonText}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
