import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import type { HomeSection } from '@/api/homeSections'
import type { Product } from '@/api/products'
import { API_BASE_URL } from '@/lib/config'

interface SplitLayoutProps {
  section: HomeSection
}

export default function SplitLayout({ section }: SplitLayoutProps) {
  const products = section.products || []
  // Layout: imagePosition === 'right' → Left: products, Right: image slider; else → Left: image, Right: products
  const imageOnRight = section.themeData?.imagePosition === 'right'
  // Combine section.image and themeData.images for the slider
  const sectionImage = section.image ? [section.image] : []
  const additionalImages = Array.isArray(section.themeData?.images) ? section.themeData.images : []
  const images = [...sectionImage, ...additionalImages]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const productSliderRef = useRef<HTMLDivElement>(null)

  const scrollProducts = (direction: 'left' | 'right') => {
    const el = productSliderRef.current
    if (!el) return
    const step = el.clientWidth * 0.85
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' })
  }
  
  // Auto-advance slider if multiple images
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
      }, 5000) // Change image every 5 seconds
      return () => clearInterval(interval)
    }
  }, [images.length])

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = API_BASE_URL.replace(/\/api\/v1$/, '') || 'http://localhost:8000'
    return `${base}/storage/${path.replace(/^\//, '')}`
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!images.length && !products.length) return null

  // If no products, show full-width banner
  if (!products.length && images.length > 0) {
    return (
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800 aspect-[16/6] lg:aspect-[21/6]">
            {images.map((img: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: currentImageIndex === index ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                className={`absolute inset-0 ${currentImageIndex === index ? 'block' : 'hidden'}`}
              >
                <img
                  src={getImageUrl(img)}
                  alt={section.title || `Banner ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {(section.title || section.description || section.ctaText) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="text-center text-white px-4">
                      {section.title && (
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">{section.title}</h2>
                      )}
                      {section.description && (
                        <p className="text-lg sm:text-xl mb-6 max-w-2xl">{section.description}</p>
                      )}
                      {section.ctaText && (
                        <Link
                          to={section.ctaLink || '#'}
                          className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {section.ctaText}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  const imageSliderBlock = images.length > 0 && (
    <div className={imageOnRight ? 'lg:col-span-1 lg:order-2' : 'lg:col-span-1'}>
      <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800 h-[260px] sm:h-[360px] lg:h-[520px]">
        {images.map((img: string, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: currentImageIndex === index ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className={`absolute inset-0 ${currentImageIndex === index ? 'block' : 'hidden'}`}
          >
            <img
              src={getImageUrl(img)}
              alt={section.title || `Slide ${index + 1}`}
              className="w-full h-full object-contain p-3 sm:p-4"
            />
            {section.ctaText && (
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <Link
                  to={section.ctaLink || '#'}
                  className="inline-block px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {section.ctaText}
                </Link>
              </div>
            )}
          </motion.div>
        ))}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )

  const productsBlock = products.length > 0 && (
    <div className={imageOnRight ? 'lg:col-span-2 lg:order-1' : 'lg:col-span-2'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          {section.title && (
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">{section.title}</h2>
          )}
          {section.description && (
            <p className="text-gray-600 dark:text-gray-400">{section.description}</p>
          )}
        </div>
        {section.slug && (
          <Link
            to={`/section/${section.slug}`}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-sm sm:text-base"
          >
            View All &gt;
          </Link>
        )}
      </div>

      {/* Product row: scroll with arrows + finger/mouse */}
      <div className="relative group">
        <div
          ref={productSliderRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden pb-2 -mx-1 px-1 scrollbar-hide"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
          }}
        >
          {products.map((product: Product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] snap-start"
            >
              <ProductCard product={product} compact imageAspectClass="aspect-[4/3]" />
            </div>
          ))}
        </div>
        {/* Left / Right arrows — mobile: always visible & touch-friendly; desktop: on hover */}
        {products.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollProducts('left')}
              className="flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-10 sm:h-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all sm:-translate-x-2 sm:opacity-0 sm:group-hover:opacity-100 -translate-x-1"
              aria-label="Previous products"
            >
              <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollProducts('right')}
              className="flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-10 sm:h-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg text-gray-700 dark:text-gray-200 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all sm:translate-x-2 sm:opacity-0 sm:group-hover:opacity-100 translate-x-1"
              aria-label="Next products"
            >
              <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8 items-stretch">
          {!imageOnRight && imageSliderBlock}
          {productsBlock}
          {imageOnRight && imageSliderBlock}
        </div>
      </div>
    </section>
  )
}