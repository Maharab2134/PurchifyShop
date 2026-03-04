import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toImageUrl } from '@/utils/imageUrl'
import { storeInfoApi } from '@/api/storeInfo'
import {
  ShoppingCart,
  Package,
  Gift,
  Tag,
  ShoppingBag,
  Star,
  Box,
  Truck,
  CreditCard,
  Heart,
  Sparkles,
  Award,
  Trophy,
  Zap,
  TrendingUp,
  DollarSign,
  Percent,
  Bell,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  Shield,
  CheckCircle,
  Sparkle,
  Store,
  ShoppingBasket,
} from 'lucide-react'

interface WelcomeAnimationProps {
  isActive: boolean
  duration?: number
  showConfetti?: boolean
  backgroundColor?: string
  circleColor?: string
  onComplete: () => void
}

// Shopping item icons for animation
const shoppingIcons = [
  { Icon: ShoppingCart, color: '#4ecdc4', name: 'Cart' },
  { Icon: Package, color: '#ff6b6b', name: 'Package' },
  { Icon: Gift, color: '#ffe66d', name: 'Gift' },
  { Icon: Tag, color: '#a8e6cf', name: 'Tag' },
  { Icon: ShoppingBag, color: '#ffd93d', name: 'Bag' },
  { Icon: Star, color: '#6bcf7f', name: 'Star' },
  { Icon: Box, color: '#4d96ff', name: 'Box' },
  { Icon: Truck, color: '#9b59b6', name: 'Truck' },
  { Icon: CreditCard, color: '#ff6b6b', name: 'Card' },
  { Icon: Heart, color: '#e74c3c', name: 'Heart' },
  { Icon: Sparkles, color: '#f39c12', name: 'Sparkles' },
  { Icon: Award, color: '#3498db', name: 'Award' },
  { Icon: Trophy, color: '#e67e22', name: 'Trophy' },
  { Icon: Zap, color: '#f1c40f', name: 'Zap' },
  { Icon: TrendingUp, color: '#2ecc71', name: 'Trending' },
  { Icon: DollarSign, color: '#27ae60', name: 'Dollar' },
  { Icon: Percent, color: '#e91e63', name: 'Percent' },
]

export default function WelcomeAnimation({
  isActive,
  duration = 5000,
  showConfetti = true,
  backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  circleColor = '#ffffff',
  onComplete,
}: WelcomeAnimationProps) {
  const [logo, setLogo] = useState<string | null>(null)
  const [storeName, setStoreName] = useState<string>('Store')
  const [logoStatus, setLogoStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isActive) {
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
    }
  }, [isActive])

  useEffect(() => {
    if (!isActive) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const percentage = Math.min((elapsed / duration) * 100, 100)
      setProgress(percentage)

      if (elapsed >= duration) {
        clearInterval(interval)
        onComplete()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [isActive, duration, onComplete])

  if (!isActive) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: backgroundColor,
        }}
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              ],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Floating particles */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${(i * 7) % 100}%`,
                top: `${(i * 11) % 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + (i % 2),
                delay: i * 0.1,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        {/* Enhanced Confetti */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  backgroundColor: [
                    '#FF6B6B', '#4ECDC4', '#FFE66D', '#FFD93D',
                    '#6BCF7F', '#4D96FF', '#9B59B6', '#FF9FF3'
                  ][Math.floor(Math.random() * 8)],
                  rotate: Math.random() * 360,
                }}
                animate={{
                  y: [0, window.innerHeight + 100],
                  x: [0, (Math.random() - 0.5) * 200],
                  rotate: [0, 360],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 1.5,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Shopping Icons Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {shoppingIcons.map((item, index) => {
            const angle = (index * 360) / shoppingIcons.length
            const radius = 150 + Math.random() * 100
            const x = Math.cos(angle * Math.PI / 180) * radius
            const y = Math.sin(angle * Math.PI / 180) * radius

            return (
              <motion.div
                key={index}
                className="absolute left-1/2 top-1/2"
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: [0, x, x * 1.5],
                  y: [0, y, y * 1.5],
                  scale: [0, 1, 0.8],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2.5,
                  delay: 0.5 + index * 0.05,
                  ease: "easeOut",
                }}
              >
                <div className="relative">
                  <item.Icon
                    size={24 + Math.random() * 12}
                    style={{ color: item.color }}
                    className="drop-shadow-lg"
                  />
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full blur-md"
                    style={{ backgroundColor: item.color }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Main Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-6">
          {/* Animated Rings */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
            {/* Outer Ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: circleColor }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Middle Ring */}
            <motion.div
              className="absolute inset-8 rounded-full border"
              style={{ borderColor: circleColor }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Logo Container */}
            <div className="absolute inset-12 flex items-center justify-center">
              <motion.div
                className="relative w-full h-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-grid-white/10" />
                </div>

                {logoStatus === 'loaded' && logo ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: 0.3,
                    }}
                    className="relative p-4"
                  >
                    <img
                      src={logo}
                      alt={`${storeName} Logo`}
                      className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
                      onError={() => {
                        setLogo(null)
                        setLogoStatus('error')
                      }}
                    />
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 blur-xl opacity-30"
                      style={{
                        background: `radial-gradient(circle at center, ${circleColor} 0%, transparent 70%)`,
                      }}
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                      delay: 0.3,
                    }}
                    className="text-center"
                  >
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
                      <motion.span
                        className="text-white text-5xl md:text-6xl font-bold"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {storeName.charAt(0).toUpperCase()}
                      </motion.span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Floating sparkles around logo */}
            {[0, 90, 180, 270].map((angle, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.5,
                }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-white"
                  style={{
                    transform: 'translateX(100px)',
                  }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Store Name and Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-2xl">
              {storeName}
            </h1>
            <motion.div
              className="flex items-center justify-center gap-3 text-white/90"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkle className="w-5 h-5" />
              <p className="text-xl md:text-2xl font-medium tracking-widest">WELCOME</p>
              <Sparkle className="w-5 h-5" />
            </motion.div>
            <p className="text-white/70 text-lg mt-4 tracking-wide">
              We&apos;re launching something amazing!
            </p>
          </motion.div>

          {/* Loading Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full max-w-xs mb-4"
          >
            <div className="flex justify-between text-white/80 text-sm mb-2">
              <span>Loading your experience</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-white/40 to-white rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Status Message */}
          {logoStatus === 'loading' && (
            <motion.div
              className="flex items-center gap-3 text-white/80"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-white"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm">Preparing your shopping experience...</span>
            </motion.div>
          )}

          {/* Bottom decorative elements */}
          <motion.div
            className="absolute bottom-8 left-0 right-0 flex justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {[ShoppingBasket, Store, ShoppingCart].map((Icon, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                <Icon className="w-6 h-6 text-white/40" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Skip button for mobile */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.5 }}
          onClick={onComplete}
          className="absolute bottom-4 right-4 text-white/70 text-sm bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors z-20 md:hidden"
        >
          Skip →
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}