import { memo, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface BreadCrumbProps {
  /** Category to show in breadcrumb (for product pages) */
  category?: { id: string; name: string; slug: string } | null
}

function BreadCrumb({ category }: BreadCrumbProps) {
  const location = useLocation()
  const pathSegments = useMemo(
    () => location.pathname.split('/').filter(Boolean),
    [location.pathname]
  )

  // Check if we're on a product detail page
  const isProductPage = pathSegments[0] === 'product' && pathSegments.length === 2

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 space-x-1 sm:space-x-2">
        <li>
          <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition">
            Home
          </Link>
        </li>
        
        {/* Show category if on product page and category exists */}
        {isProductPage && category && (
          <>
            <span className="text-gray-400 dark:text-gray-500">/</span>
            <li className="ml-1 sm:ml-2">
              <Link
                to={`/shop?categoryId=${category.id}`}
                className="capitalize hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition text-gray-600 dark:text-gray-300"
              >
                {category.name}
              </Link>
            </li>
          </>
        )}

        {pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/')
          const isLast = index === pathSegments.length - 1
          
          // Skip showing "product" segment if we already showed category
          if (isProductPage && segment === 'product' && category) {
            return null
          }
          
          return (
            <span key={href} className="flex items-center">
              <span className="text-gray-400 dark:text-gray-500">/</span>
              <li className="ml-1 sm:ml-2">
                {isLast ? (
                  <span className="capitalize font-semibold text-gray-800 dark:text-gray-200">
                    {decodeURIComponent(segment)}
                  </span>
                ) : (
                  <Link
                    to={href}
                    className="capitalize hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition text-gray-600 dark:text-gray-300"
                  >
                    {decodeURIComponent(segment)}
                  </Link>
                )}
              </li>
            </span>
          )
        })}
      </ol>
    </nav>
  )
}

export default memo(BreadCrumb)
