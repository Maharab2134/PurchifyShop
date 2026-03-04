import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, Package, Sparkles } from 'lucide-react'
import type { HomeSection } from '@/api/homeSections'
import { API_BASE_URL } from '@/lib/config'
import { useState } from 'react'

interface PromotionalBannerProps {
  section: HomeSection
}

export default function PromotionalBanner({ section }: PromotionalBannerProps) {
  const bannerData = section.themeData || {}
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  const [isButtonClicked, setIsButtonClicked] = useState(false)
  
  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const base = API_BASE_URL.replace(/\/api\/v1$/, '') || 'http://localhost:8000'
    return `${base}/storage/${path.replace(/^\//, '')}`
  }

  const handleButtonClick = () => {
    setIsButtonClicked(true)
    setTimeout(() => setIsButtonClicked(false), 300)
  }

  // Button animation variants
  const buttonVariants: Variants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      boxShadow: "0 10px 30px rgba(255, 255, 255, 0.3)",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    pulse: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  }

  // Arrow animation variants
  const arrowVariants: Variants = {
    initial: { x: 0 },
    hover: { 
      x: 5,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    },
    click: {
      x: [0, 10, 0],
      transition: { duration: 0.3 }
    }
  }

  // Sparkle animation variants
  const sparkleVariants: Variants = {
    initial: { 
      opacity: 0,
      scale: 0,
      rotate: 0 
    },
    hover: (i: number) => ({
      opacity: [0, 1, 0],
      scale: [0, 1.2, 0],
      rotate: 360,
      x: Math.sin(i * 0.5) * 20,
      y: Math.cos(i * 0.5) * 20,
      transition: {
        duration: 0.8,
        delay: i * 0.1,
        times: [0, 0.5, 1]
      }
    })
  }

  return (
    <section 
      className="relative py-12 sm:py-16 lg:py-20 overflow-hidden max-w-350 mx-auto px-3 sm:px-4 lg:px-8"
      style={{
        backgroundColor: section.backgroundColor || '#f97316',
        color: section.textColor || '#ffffff',
      }}
    >
      <div className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {section.title && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-lg mb-6 opacity-90">{section.description}</p>
            )}
            {bannerData.features && Array.isArray(bannerData.features) && (
              <ul className="space-y-3 mb-8">
                {bannerData.features.map((feature: string, index: number) => (
                  <motion.li 
                    key={index} 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <motion.div 
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Package className="w-4 h-4" />
                    </motion.div>
                    <span className="font-medium">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            )}
            
            {/* Animated Button */}
            {section.ctaText && (
              <motion.div
                className="relative inline-block"
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                whileHover="hover"
                animate={isButtonClicked ? "tap" : "initial"}
              >
                {/* Sparkle effects */}
                {isButtonHovered && [0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={sparkleVariants}
                    initial="initial"
                    animate="hover"
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                  >
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                  </motion.div>
                ))}
                
                <Link
                  to={section.ctaLink || '#'}
                  onClick={handleButtonClick}
                >
                  <motion.div
                    variants={buttonVariants}
                    animate="pulse"
                    className="relative overflow-hidden group"
                  >
                    {/* Gradient border effect */}
                    <div className="absolute inset-0 rounded-xl bg-linear-to-r from-white/30 via-transparent to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Main button */}
                    <motion.button
                      className="relative px-8 py-4 bg-linear-to-r from-white to-gray-100 text-orange-600 font-bold rounded-xl flex items-center gap-3 shadow-lg overflow-hidden"
                      whileHover="hover"
                      whileTap="tap"
                      variants={buttonVariants}
                    >
                      {/* Shine effect */}
                      <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: isButtonHovered ? '100%' : '-100%' }}
                        transition={{ duration: 0.8 }}
                      />
                      
                      {/* Button content */}
                      <span className="relative z-10 text-lg">
                        {section.ctaText}
                      </span>
                      
                      {/* Animated arrow */}
                      <motion.div
                        variants={arrowVariants}
                        animate={isButtonClicked ? "click" : "initial"}
                        className="relative z-10"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                      
                      {/* Pulse ring effect */}
                      {isButtonHovered && (
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-white/50"
                          initial={{ scale: 1, opacity: 1 }}
                          animate={{ 
                            scale: 1.2, 
                            opacity: 0 
                          }}
                          transition={{ 
                            duration: 1,
                            repeat: Infinity 
                          }}
                        />
                      )}
                    </motion.button>
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Right side - Image/Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {bannerData.mainImage && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="relative"
              >
                <img
                  src={getImageUrl(bannerData.mainImage)}
                  alt={section.title || ''}
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
                
                {/* Floating discount badge */}
                {bannerData.discount && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200,
                      delay: 0.3 
                    }}
                    className="absolute -top-4 -right-4"
                  >
                    <div className="relative">
                      {/* Outer glow */}
                      <motion.div
                        className="absolute inset-0 bg-red-500 rounded-full blur-lg"
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity 
                        }}
                      />
                      
                      {/* Main badge */}
                      <div className="relative bg-linear-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full font-bold text-xl shadow-2xl">
                        {bannerData.discount}
                      </div>
                      
                      {/* Sparkles */}
                      <motion.div
                        className="absolute -top-2 -right-2"
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.2, 1]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Background decoration */}
      {bannerData.showMap && (
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute inset-0"
            animate={{ 
              backgroundPosition: ['0% 0%', '100% 100%']
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'none\'/%3E%3Cpath d=\'M20 20l60 60M80 20l-60 60\' stroke=\'%23fff\' stroke-width=\'2\'/%3E%3C/svg%3E")',
              backgroundSize: '200px 200px',
            }}
          />
          
          {/* Floating particles */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}