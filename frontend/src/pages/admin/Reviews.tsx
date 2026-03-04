import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Trash2, Search, Filter, X } from 'lucide-react'
import { adminApi, type AdminReview } from '@/api/admin'
import useToast from '@/hooks/useToast'
import ConfirmModal from '@/components/admin/ConfirmModal'
import { format } from 'date-fns'

export default function AdminReviews() {
  const { showToast } = useToast()
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteReview, setDeleteReview] = useState<AdminReview | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    rating: '',
    productId: '',
    userId: '',
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
  })

  const load = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        limit: 20,
        page,
        sortBy: 'created_at',
        sortOrder: 'desc',
      }
      if (filters.search) params.search = filters.search
      if (filters.rating) params.rating = Number(filters.rating)
      if (filters.productId) params.productId = filters.productId
      if (filters.userId) params.userId = filters.userId

      const res = await adminApi.reviews.list(params)
      setReviews(res.data.data.reviews)
      setPagination({
        currentPage: res.data.data.currentPage,
        totalPages: res.data.data.totalPages,
        totalResults: res.data.data.totalResults,
      })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load reviews'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [filters])

  const handleDelete = async () => {
    if (!deleteReview) return
    try {
      await adminApi.reviews.delete(deleteReview.id)
      showToast('Review deleted successfully', 'success')
      setDeleteReview(null)
      load(pagination.currentPage)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete review'
      showToast(msg, 'error')
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ))
  }

  return (
    
      <><div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Reviews Management</h1>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-800">{pagination.totalResults}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter size={18} />
            <span>Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by comment..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <input
              type="text"
              placeholder="Product ID (optional)"
              value={filters.productId}
              onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono text-xs"
            />
            <input
              type="text"
              placeholder="User ID (optional)"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-mono text-xs"
            />
          </div>
          {(filters.search || filters.rating || filters.productId || filters.userId) && (
            <button
              onClick={() => setFilters({ search: '', rating: '', productId: '', userId: '' })}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-32" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {review.user?.name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {review.product && (
                          <Link
                            to={`/products/${review.product.slug}`}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mb-2 inline-block"
                          >
                            {review.product.name}
                          </Link>
                        )}
                        {review.comment && (
                          <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Review ID: <span className="font-mono">{review.id.slice(0, 8)}...</span></span>
                      {review.productId && (
                        <span>Product ID: <span className="font-mono">{review.productId.slice(0, 8)}...</span></span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteReview(review)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete review"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => load(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => load(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteReview && (
          <ConfirmModal
            open={!!deleteReview}
            onCancel={() => setDeleteReview(null)}
            onConfirm={handleDelete}
            title="Delete Review"
            message={`Are you sure you want to delete this review by ${deleteReview.user?.name || 'Anonymous'}? This action cannot be undone.`}
            confirmLabel="Delete"
            danger
          />
        )}
      </div>
    </>
  )
}
