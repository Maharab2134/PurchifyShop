import { useEffect, useState } from 'react'
import MainLayout from '@/components/templates/MainLayout'
import { publicBrandsApi } from '@/api/brandsPublic'
import type { Brand } from '@/api/brands'
import { toImageUrl } from '@/utils/imageUrl'

const PAGE_SIZE = 12

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadPage = (nextPage: number, replace = false) => {
    const setLoadingState = replace ? setLoading : setLoadingMore
    setLoadingState(true)
    publicBrandsApi
      .list({ limit: PAGE_SIZE, page: nextPage })
      .then((res) => {
        const data = res.data.data
        const nextBrands = data?.brands ?? []
        setTotalPages(data?.totalPages ?? 1)
        setPage(data?.currentPage ?? nextPage)
        setBrands((prev) => (replace ? nextBrands : [...prev, ...nextBrands]))
      })
      .catch(() => {
        if (replace) setBrands([])
      })
      .finally(() => setLoadingState(false))
  }

  useEffect(() => {
    loadPage(1, true)
  }, [])

  const hasMore = page < totalPages

  return (
    <MainLayout>
      <section className="w-full bg-white dark:bg-gray-900 py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Top Brands
              </h1>
            </div>

            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="h-24 sm:h-28 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4">
                  {brands.map((brand) => (
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

                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      type="button"
                      onClick={() => loadPage(page + 1)}
                      disabled={loadingMore}
                      className="px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-60"
                    >
                      {loadingMore ? 'Loading...' : 'View More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
