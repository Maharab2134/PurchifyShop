import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import {
  Smartphone,
  Monitor,
  Headphones,
  Watch,
  Camera,
  Gamepad2,
  Laptop,
  Tablet,
  Speaker,
  Keyboard,
  Mouse,
  Printer,
  Router,
  HardDrive,
  MemoryStick,
  Cpu,
  MonitorSmartphone,
  SmartphoneCharging,
  Wifi,
  Bluetooth,
  Package,
} from 'lucide-react'
import { categoriesApi, type Category } from '@/api/categories'

// Soft, varied icon-area colors (img 1 style) – one per index for visual variety
const CARD_ACCENT_COLORS = [
  { bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-pink-50 dark:bg-pink-900/20', icon: 'text-pink-600 dark:text-pink-400' },
  { bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-sky-50 dark:bg-sky-900/20', icon: 'text-sky-600 dark:text-sky-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400' },
]

const categoryIcons: Record<string, React.ElementType> = {
  electronics: Monitor,
  smartphones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  accessories: Headphones,
  gaming: Gamepad2,
  cameras: Camera,
  smartwatches: Watch,
  audio: Speaker,
  peripherals: Keyboard,
  networking: Router,
  storage: HardDrive,
  components: Cpu,
  mobile: MonitorSmartphone,
  charging: SmartphoneCharging,
  wireless: Wifi,
  bluetooth: Bluetooth,
  memory: MemoryStick,
  input: Mouse,
  printing: Printer,
  clothing: Package,
  footwear: Package,
  shoes: Package,
  furniture: Package,
  books: Package,
  watches: Watch,
  headphones: Headphones,
  speakers: Speaker,
  keyboards: Keyboard,
  mousepads: Mouse,
}

const DefaultIcon = Package

export default function CategoryBar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    categoriesApi.getAll().then(({ data }) => {
      setCategories(data.data || [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])


  const getCategoryIcon = (categoryName: string) => {
    const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '')
    if (categoryIcons[normalizedName]) return categoryIcons[normalizedName]
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) return icon
    }
    return DefaultIcon
  }

  if (loading) {
    return (
      <section className="pt-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-center space-x-8 overflow-x-auto">
            {[...Array(8)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex-shrink-0"
              >
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
              </motion.div>
            ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!categories.length) return null

  return (
    <section className="pt-6 sm:pt-8 lg:pt-10">
      <div className="w-full px-3 sm:px-4 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-4 sm:mb-6"
        >
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">Categories</h2>
          <Link
            to="/categories"
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            View All
            <ChevronRight size={16} />
          </Link>
        </motion.div>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide category-slider"
          style={{ 
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'touch',
            willChange: 'scroll-position',
            scrollSnapType: 'none' // Disable snap for smooth auto-scroll
          }}
        >
          {/* Categories for slider */}
          {categories.map((category, index) => {
            const hasImages = category.images && category.images.length > 0
            const imageSrc = hasImages ? category.images[0] : null
            const Icon = getCategoryIcon(category.name)
            const accent = CARD_ACCENT_COLORS[index % CARD_ACCENT_COLORS.length]

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group flex-shrink-0 w-[130px] sm:w-[150px] min-w-[130px] sm:min-w-[150px]"
              >
                <Link to={`/shop?categoryId=${category.id}`} className="block h-full">
                  <div className="h-full min-h-[180px] sm:min-h-[200px] flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
                    {/* Icon area – soft tinted background (img 1 style) */}
                    <div className={`relative w-full flex-1 min-h-[110px] sm:min-h-[120px] flex items-center justify-center rounded-t-2xl ${accent.bg}`}>
                      {hasImages && imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={category.name}
                          className="w-full h-full object-contain p-4"
                        />
                      ) : (
                        <Icon className={`w-12 h-12 sm:w-14 sm:h-14 ${accent.icon}`} />
                      )}
                    </div>

                    {/* Category name – centered label below */}
                    <div className="flex items-center justify-center px-3 py-4 bg-white dark:bg-gray-800 rounded-b-2xl">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm text-center line-clamp-2 leading-tight">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
        </div>
      </div>
    </section>
  )
}
