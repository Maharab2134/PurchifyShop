import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, FileText, Trash2 } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import { adminApi, type AdminAnalytics, type AdminRecentVisitor } from '@/api/admin'
import { useAuth } from '@/hooks/useAuth'

export default function AdminAnalytics() {
  const { user } = useAuth()
  const isSuperAdmin = (user?.role ?? '').toUpperCase() === 'SUPERADMIN'

  const [data, setData] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentVisitors, setRecentVisitors] = useState<AdminRecentVisitor[]>([])
  const [recentVisitorsLoading, setRecentVisitorsLoading] = useState(false)

  useEffect(() => {
    adminApi
      .analytics()
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isSuperAdmin) return
    setRecentVisitorsLoading(true)
    adminApi.visitors
      .recent({ limit: 25 })
      .then((res) => setRecentVisitors(res.data.data.visitors ?? []))
      .catch(() => setRecentVisitors([]))
      .finally(() => setRecentVisitorsLoading(false))
  }, [isSuperAdmin])

  const visitors = data?.visitors
  const chartData = useMemo(() => {
    if (!visitors?.dailyVisitors?.length && !visitors?.dailyPageViews?.length) return []
    const byDate: Record<string, { date: string; visitors: number; views: number; label: string }> = {}
    const fmt = (d: string) => {
      const x = new Date(d)
      return x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
    }
    visitors.dailyVisitors?.forEach((v) => {
      byDate[v.date] = { date: v.date, visitors: v.visitors, views: 0, label: fmt(v.date) }
    })
    visitors.dailyPageViews?.forEach((v) => {
      if (!byDate[v.date]) byDate[v.date] = { date: v.date, visitors: 0, views: v.views, label: fmt(v.date) }
      else byDate[v.date].views = v.views
    })
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
  }, [visitors?.dailyVisitors, visitors?.dailyPageViews])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-4 sm:p-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-64 sm:h-80 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      
    )
  }

  if (error) {
    return (
      
        <div className="p-4 sm:p-6">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Link to="/dashboard" className="inline-block mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
            Back to Dashboard
          </Link>
        </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Analytics</h1>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm"
          >
            Dashboard
          </Link>
        </div>

        {!isSuperAdmin ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
            <Eye className="w-12 h-12 text-amber-500 dark:text-amber-400 mx-auto mb-3" />
            <p className="text-amber-800 dark:text-amber-200 font-medium">Website visitor analytics</p>
            <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
              Revenue, orders, users &amp; products are on the <Link to="/dashboard" className="underline font-medium">Dashboard</Link>.
              Visitor &amp; browsing data (graphs, top pages) is available to SUPERADMIN only.
            </p>
          </div>
        ) : visitors ? (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-500" />
              Website Visitors &amp; Browsing (last {visitors.days} days)
            </h2>

            {chartData.length > 0 && (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Visitors &amp; Page views over time</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} className="text-gray-600 dark:text-gray-400" />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--tw-bg-opacity, 1)', border: '1px solid #e5e7eb' }}
                          labelStyle={{ color: '#374151' }}
                          formatter={(value, name) => [value ?? 0, String(name) === 'visitors' ? 'Visitors' : 'Page views']}
                          labelFormatter={(label) => label}
                        />
                        <Legend formatter={(v) => (v === 'visitors' ? 'Unique visitors' : 'Page views')} />
                        <Area yAxisId="left" type="monotone" dataKey="visitors" name="visitors" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                        <Area yAxisId="right" type="monotone" dataKey="views" name="views" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Daily visitors</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => [v ?? 0, 'Visitors']} labelFormatter={(l) => l} />
                          <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Visitors" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden p-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Daily page views</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => [v ?? 0, 'Views']} labelFormatter={(l) => l} />
                          <Bar dataKey="views" fill="#10b981" name="Page views" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top pages */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">Top pages (browsing)</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Clear Top pages data?')) return
                      await adminApi.analyticsAdmin.clearTopPages().catch(() => {})
                      // Refresh analytics + visitors list
                      adminApi.analytics().then((res) => setData(res.data.data)).catch(() => {})
                      adminApi.visitors.recent({ limit: 25 }).then((res) => setRecentVisitors(res.data.data.visitors ?? [])).catch(() => {})
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                    title="Clear top pages"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>
                <div className="overflow-x-auto">
                  {(visitors.topPages?.length ?? 0) === 0 ? (
                    <div className="p-6 text-gray-500 dark:text-gray-400 text-sm">No browsing data yet.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Page</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.topPages!.map((p, i) => (
                          <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                            <td className="py-3 px-4 font-mono text-xs text-gray-800 dark:text-gray-200">{p.path || '/'}</td>
                            <td className="py-3 px-4 text-right font-medium text-gray-700 dark:text-gray-300">{p.views.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Recent visitors */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">Recent Visitors</h3>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('Clear Recent Visitors data?')) return
                      await adminApi.visitors.clear().catch(() => {})
                      setRecentVisitors([])
                      // Also refresh analytics top pages (they are derived from page_views)
                      adminApi.analytics().then((res) => setData(res.data.data)).catch(() => {})
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                    title="Clear recent visitors"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>
                <div className="overflow-x-auto">
                  {recentVisitorsLoading ? (
                    <div className="p-6 text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
                  ) : recentVisitors.length === 0 ? (
                    <div className="p-6 text-gray-500 dark:text-gray-400 text-sm">No visitor sessions yet.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">IP Address</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Location</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Device</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Browser</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Time</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Pages</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentVisitors.map((v) => (
                          <tr
                            key={v.sessionId}
                            className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                          >
                            <td className="py-3 px-4 font-mono text-xs text-gray-800 dark:text-gray-200">{v.ipAddress || '—'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{v.location || '—'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{v.device || '—'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{v.browser || '—'}</td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                              {v.time ? new Date(v.time).toLocaleString() : '—'}
                              {v.lastPath ? (
                                <div className="font-mono text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[280px]">
                                  {v.lastPath}
                                </div>
                              ) : null}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">{(v.pages ?? 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-medium text-gray-800 dark:text-gray-200">{(v.actions ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {(chartData.length === 0 && (visitors.topPages?.length ?? 0) === 0) && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                No visitor or browsing data yet. Data is collected when users browse the storefront (Home, Shop, Cart, etc.).
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Analytics data could not be loaded.</p>
        )}
      </div>
  )
}
