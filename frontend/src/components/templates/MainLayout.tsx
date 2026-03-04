import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import TopBar from '@/components/layout/TopBar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import FloatingGirlCartoon from '@/components/home/FloatingGirlCartoon'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="flex flex-col min-h-screen w-full text-gray-900 dark:text-gray-100"
      style={{ background: 'var(--app-surface)' }}
    >
      <TopBar />
      <Navbar />
      <FloatingGirlCartoon />
      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
      <Footer className="mobile-footer-spacing" />
      <MobileBottomNav />
    </main>
  )
}
