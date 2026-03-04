import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import MainLayout from '@/components/templates/MainLayout'
import ProductCard from '@/components/product/ProductCard'
import { useAuth } from '@/hooks/useAuth'
import { wishlistApi } from '@/api/wishlist'
import { productsApi, type Product } from '@/api/products'

export default function Wishlist() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWishlist = async () => {
      setLoading(true)
      try {
        let productIds: string[] = []
        
        if (!isAuthenticated) {
          // Load guest wishlist from localStorage
          const guestWishlist = localStorage.getItem('guestWishlist')
          if (guestWishlist) {
            try {
              productIds = JSON.parse(guestWishlist) as string[]
            } catch {
              productIds = []
            }
          }
        } else {
          // Load authenticated user's wishlist
          const wishlistRes = await wishlistApi.get()
          const wishlistProducts = wishlistRes.data?.data?.products ?? []
          productIds = wishlistProducts.map((wp) => wp.id)
        }
        
        if (productIds.length === 0) {
          setProducts([])
          setLoading(false)
          return
        }
        
        const productPromises = productIds.map((id) =>
          productsApi.getById(id).then((res) => res.data.data).catch(() => null)
        )
        const fullProducts = (await Promise.all(productPromises)).filter((p): p is Product => p !== null)
        setProducts(fullProducts)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    loadWishlist()
    
    // Listen for wishlist updates
    const handleWishlistUpdate = () => loadWishlist()
    window.addEventListener('wishlist:updated', handleWishlistUpdate)
    return () => window.removeEventListener('wishlist:updated', handleWishlistUpdate)
  }, [isAuthenticated])

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 lg:mb-8">My Wishlist</h1>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Heart className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Save items you like and access them anytime.</p>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
              >
                Browse Shop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
