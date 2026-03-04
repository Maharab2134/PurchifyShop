import { useEffect, useState } from 'react'
import { Ticket, Calendar, Percent, DollarSign } from 'lucide-react'
import MainLayout from '@/components/templates/MainLayout'
import { useAuth } from '@/hooks/useAuth'
import { couponsApi, type Coupon } from '@/api/coupons'
import useFormatPrice from '@/hooks/useFormatPrice'
import useToast from '@/hooks/useToast'

export default function Coupons() {
  const { isAuthenticated } = useAuth()
  const formatPrice = useFormatPrice()
  const { showToast } = useToast()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    couponsApi
      .getMyCoupons()
      .then((res) => setCoupons(res.data.data ?? []))
      .catch(() => {
        showToast('Failed to load coupons.', 'error')
        setCoupons([])
      })
      .finally(() => setLoading(false))
  }, [isAuthenticated, showToast])

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Ticket className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Sign in to view your coupons</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Access your available discount coupons.</p>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">My Coupons</h1>
        {coupons.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <Ticket className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have any coupons yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Contact admin to get coupons.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center">
                      <Ticket className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">{c.code}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{c.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {c.type === 'PERCENTAGE' ? (
                        <span className="flex items-center gap-1">
                          <Percent size={20} />
                          {c.value}%
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <DollarSign size={20} />
                          {formatPrice(c.value)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">OFF</p>
                  </div>
                </div>
                {c.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{c.description}</p>
                )}
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  {c.minPurchase > 0 && (
                    <div className="flex justify-between">
                      <span>Min Purchase:</span>
                      <span className="font-medium">{formatPrice(c.minPurchase)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar size={14} />
                    <span>
                      Valid until: {new Date(c.validUntil).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
