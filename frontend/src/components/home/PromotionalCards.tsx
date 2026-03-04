import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { HomeSection } from '@/api/homeSections'
import { API_BASE_URL } from '@/lib/config'

interface PromotionalCardsProps {
  section: HomeSection
}

export default function PromotionalCards({ section }: PromotionalCardsProps) {
  const cards = section.themeData?.cards || []
  if (!cards.length) return null

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = API_BASE_URL.replace(/\/api\/v1$/, '') || 'http://localhost:8000'
    return `${base}/storage/${path.replace(/^\//, '')}`
  }

  return (
    <section 
      className="py-8 sm:py-12 lg:py-16"
      style={{
        backgroundColor: section.backgroundColor || undefined,
        color: section.textColor || undefined,
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {section.title && (
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">{section.title}</h2>
        )}
        {section.description && (
          <p className="text-center mb-8 text-gray-600 dark:text-gray-400">{section.description}</p>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow ${
                card.isLarge ? 'sm:col-span-2 sm:row-span-2' : ''
              }`}
              style={{
                backgroundColor: card.backgroundColor || '#f3f4f6',
              }}
            >
              {card.image && (
                <div className="relative h-48 sm:h-64">
                  <img
                    src={getImageUrl(card.image)}
                    alt={card.title || ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                {card.subtitle && (
                  <p className="text-sm font-medium mb-2 opacity-80">{card.subtitle}</p>
                )}
                {card.title && (
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">{card.title}</h3>
                )}
                {card.description && (
                  <p className="text-sm mb-4 opacity-90">{card.description}</p>
                )}
                {card.ctaText && (
                  <Link
                    to={card.ctaLink || '#'}
                    className="inline-flex items-center gap-2 text-sm font-semibold hover:underline"
                  >
                    {card.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
