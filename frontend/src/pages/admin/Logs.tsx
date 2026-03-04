import { useEffect, useState } from 'react'
import { adminApi, type AdminLog } from '@/api/admin'
import useToast from '@/hooks/useToast'

export default function AdminLogs() {
  const { showToast } = useToast()
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const limit = 30

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.logs({ limit, offset })
      setLogs(res.data.data?.logs ?? [])
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [offset])

  return (
    
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6">Logs</h1>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600">No logs.</p>
          </div>
        )}
        {!loading && !error && logs.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Message</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs">{l.id}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            l.level === 'error' ? 'bg-red-100 text-red-800' : l.level === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {l.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800 max-w-md truncate" title={l.message}>
                        {l.message}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{l.createdAt ? new Date(l.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setOffset((o) => o + limit)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    
  )
}
