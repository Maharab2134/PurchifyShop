import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { publicBrandsApi } from '@/api/brandsPublic'
import type { Brand } from '@/api/brands'
import { toImageUrl } from '@/utils/imageUrl'

export default function TopBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const previewCount = 12

  useEffect(() => {
    publicBrandsApi
      .list({ limit: previewCount })
      .then((res) => {
        setBrands(res.data.data?.brands ?? [])
      })
      .catch(() => setBrands([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && brands.length === 0) return null

  return (
    <section className="w-full bg-white dark:bg-gray-900 py-8 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Top Brands
            </h2>
            <Link
              to="/brands"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium text-sm sm:text-base"
            >
              View More &gt;
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4">
              {Array.from({ length: previewCount }).map((_, i) => (
                <div key={i} className="h-24 sm:h-28 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4">
              {brands.slice(0, previewCount).map((brand) => (
                <div
                  key={brand.id}
                  className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 h-24 sm:h-28"
                  title={brand.name}
                >
                  {brand.logo ? (
                    <img
                      src={toImageUrl(brand.logo)}
                      alt={brand.name}
                      className="max-h-10 sm:max-h-12 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-200">
                      {brand.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                    {brand.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
