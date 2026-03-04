import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { type HomeSection } from '@/api/homeSections'
import { toImageUrl } from '@/utils/imageUrl'

interface HomeHeroSliderProps {
  sections: HomeSection[]
}

/**
 * Hero slider under navbar using admin-managed Home Sections.
 * Renders only sections that have an `image` field.
 */
export default function HomeHeroSlider({ sections }: HomeHeroSliderProps) {
  const slides = useMemo(
    () => (sections || []).filter((s) => s.image).map((s) => ({
      id: s.id,
      title: s.name,
      slug: s.slug,
      image: toImageUrl(s.image || ''),
      countdownEnd: s.countdownEnd,
      intervalMs: 5000,
    })),
    [sections]
  )

  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length === 0) return
    const currentInterval = slides[index]?.intervalMs ?? 5000
    const timer = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, currentInterval)
    return () => window.clearTimeout(timer)
  }, [slides, index])

  if (slides.length === 0) return null

  const go = (next: number) => {
    if (slides.length === 0) return
    setIndex((next + slides.length) % slides.length)
  }

  const current = slides[index]

  return (
    <section className="relative bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0.2, scale: 1.01 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="h-full w-full"
              >
                <div
                  className="h-full w-full bg-center bg-cover"
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 40%), url('${current.image}')`,
                    minHeight: '320px',
                  }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between p-6 sm:p-10 gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-white/80">Featured Section</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">{current.title}</h2>
              {current.countdownEnd && (
                <p className="mt-2 text-white/90 text-sm">Ends at: {new Date(current.countdownEnd).toLocaleString()}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="h-11 w-11 rounded-full bg-white/90 text-gray-800 backdrop-blur shadow hover:shadow-md flex items-center justify-center"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="h-11 w-11 rounded-full bg-white/90 text-gray-800 backdrop-blur shadow hover:shadow-md flex items-center justify-center"
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
