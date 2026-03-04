const RECENT_PRODUCTS_KEY = 'recentProducts'
const MAX_RECENT_PRODUCTS = 12

export interface RecentProduct {
  id: string
  slug: string
  name: string
  viewedAt: number
}

/**
 * Get recently viewed products from localStorage
 */
export function getRecentProducts(): RecentProduct[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(RECENT_PRODUCTS_KEY)
    if (!stored) return []
    
    const products = JSON.parse(stored) as RecentProduct[]
    // Sort by viewedAt (most recent first) and limit to MAX_RECENT_PRODUCTS
    return products
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_RECENT_PRODUCTS)
  } catch (e) {
    console.error('Failed to parse recent products:', e)
    return []
  }
}

/**
 * Add a product to recently viewed list
 */
export function addRecentProduct(product: { id: string; slug: string; name: string }): void {
  if (typeof window === 'undefined') return
  
  try {
    const existing = getRecentProducts()
    
    // Remove if already exists (to avoid duplicates)
    const filtered = existing.filter(p => p.id !== product.id)
    
    // Add new product at the beginning
    const updated: RecentProduct[] = [
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        viewedAt: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_PRODUCTS)
    
    localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save recent product:', e)
  }
}

/**
 * Clear all recently viewed products
 */
export function clearRecentProducts(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RECENT_PRODUCTS_KEY)
}
