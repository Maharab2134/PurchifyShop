import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Admin pages in one chunk (load only when visiting /dashboard or /purchify/login)
          if (id.includes('/pages/admin/')) return 'admin'
          // Vendor chunk for react, redux, router
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react'
          if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/redux')) return 'vendor-redux'
          // Framer motion can be heavy
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          // Charts and heavy libs
          if (id.includes('node_modules/recharts') || id.includes('node_modules/xlsx')) return 'vendor-charts'
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
