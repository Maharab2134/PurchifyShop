import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { HomeSection } from '@/api/homeSections'
import { API_BASE_URL } from '@/lib/config'

interface ImageBannerProps {
  section: HomeSection
}

export default function ImageBanner({ section }: ImageBannerProps) {
  // Combine section.image and themeData.images for the slider
  const sectionImage = section.image ? [section.image] : []
  const additionalImages = Array.isArray(section.themeData?.images) ? section.themeData.images : []
  const images = [...sectionImage, ...additionalImages]
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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

  // Auto-advance slider if multiple images
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length)
      }, 5000) // Change image every 5 seconds
      return () => clearInterval(interval)
    }
  }, [images.length])

  if (!images.length) return null

  return (
    <section 
      className="py-8 sm:py-12 lg:py-16"
      style={{
        backgroundColor: section.backgroundColor || undefined,
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-800 aspect-[16/9] lg:aspect-[21/9]">
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
                      <h2 
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
                        style={{ color: section.textColor || '#ffffff' }}
                      >
                        {section.title}
                      </h2>
                    )}
                    {section.description && (
                      <p 
                        className="text-lg sm:text-xl mb-6 max-w-2xl"
                        style={{ color: section.textColor || '#ffffff' }}
                      >
                        {section.description}
                      </p>
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
