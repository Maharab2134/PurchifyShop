import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, RefreshCw, Trash2, CheckSquare, Square, Download, Search } from 'lucide-react'
import * as XLSX from 'xlsx'
import { adminApi, type AdminTransaction } from '@/api/admin'
import ConfirmModal from '@/components/admin/ConfirmModal'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'

const PAYMENT_STATUS_OPTIONS = ['PENDING', 'PAID', 'REFUNDED', 'FAILED'] as const

export default function AdminTransactions() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [tx, setTx] = useState<AdminTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<Record<string, string>>({})
  const [deletingTransaction, setDeletingTransaction] = useState<AdminTransaction | null>(null)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.transactions.list({
        limit: 50,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      })
      const list = res.data.data?.transactions ?? []
      setTx(list)
      const next: Record<string, string> = {}
      list.forEach((t) => {
        if (t.payment) next[t.payment.id] = t.payment.status
      })
      setSelectedStatus(next)
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
  }, [statusFilter, search, location.pathname])

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    const t = tx.find((x) => x.payment?.id === paymentId)
    if (!t?.payment || status === t.payment.status) return
    setUpdatingId(paymentId)
    try {
      await adminApi.payments.updateStatus(paymentId, status)
      showToast('Payment status updated', 'success')
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update'
      showToast(msg, 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingTransaction) return
    try {
      await adminApi.transactions.delete(deletingTransaction.id)
      showToast('Transaction deleted successfully', 'success')
      setDeletingTransaction(null)
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete'
      showToast(msg, 'error')
    }
  }

  const toggleSelectTransaction = (id: string) => {
    setSelectedTransactions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedTransactions.size === tx.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(tx.map((t) => t.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTransactions.size === 0) return
    setBulkDeleting(true)
    try {
      const deletePromises = Array.from(selectedTransactions).map((id) => adminApi.transactions.delete(id))
      await Promise.all(deletePromises)
      showToast(`${selectedTransactions.size} transaction(s) deleted successfully`, 'success')
      setSelectedTransactions(new Set())
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete'
      showToast(msg, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleExport = () => {
    try {
      const dataToExport = tx.map((transaction) => ({
        'Transaction ID': transaction.id,
        'Order ID': transaction.order?.id || 'N/A',
        'User': transaction.user?.name || 'N/A',
        'Email': transaction.user?.email || 'N/A',
        'Amount': formatPrice(transaction.amount),
        'Payment Status': transaction.payment?.status || 'N/A',
        'Payment Method': transaction.paymentMethod || 'N/A',
        'Created Date': transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A',
        'Updated Date': transaction.updatedAt ? new Date(transaction.updatedAt).toLocaleDateString() : 'N/A',
      }))

      const ws = XLSX.utils.json_to_sheet(dataToExport)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
      XLSX.writeFile(wb, `transactions-${new Date().toISOString().split('T')[0]}.xlsx`)
      showToast('Transactions exported successfully', 'success')
    } catch (e) {
      showToast('Failed to export transactions', 'error')
    }
  }

  return (
    
      <><div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">Transactions</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput)}
                placeholder="Search order ID, user, txn ID, phone..."
                className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm w-56"
              />
            </div>
            <button
              type="button"
              onClick={() => setSearch(searchInput)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium"
            >
              <Search size={14} />
              Search
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="">All payment statuses</option>
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || tx.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Payment data and status. Update payment status here. Order status is updated from Orders.
          </p>
          {selectedTransactions.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{selectedTransactions.size} selected</span>
              <button
                type="button"
                onClick={() => setDeletingTransaction({ id: 'bulk' } as AdminTransaction)}
                disabled={bulkDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedTransactions.size})
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        {error && <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>}
        {!loading && !error && tx.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-gray-600 dark:text-gray-400">No transactions yet.</p>
          </div>
        )}
        {!loading && !error && tx.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 w-12">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Select all"
                      >
                        {selectedTransactions.size === tx.length && tx.length > 0 ? (
                          <CheckSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square size={18} className="text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">User</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Method</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Sending #</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tx.map((t) => (
                    <tr key={t.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${selectedTransactions.has(t.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectTransaction(t.id)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Select transaction"
                        >
                          {selectedTransactions.has(t.id) ? (
                            <CheckSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <Square size={18} className="text-gray-400 dark:text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        {t.orderId ? (
                          <button
                            type="button"
                            onClick={() => navigate('/dashboard/orders', { state: { openOrderId: t.orderId } })}
                            className="font-mono text-xs text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left"
                            title="Open order"
                          >
                            {t.orderId.slice(0, 8)}…
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {t.order?.user ? (
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{t.order.user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.order.user.email}</p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{t.payment?.method ?? '—'}</td>
                      <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-200">
                        {t.payment != null ? formatPrice(t.payment.amount) : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {t.payment?.senderNumber ?? '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                        {t.payment?.transactionId ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        {t.payment ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={selectedStatus[t.payment.id] ?? t.payment.status}
                              onChange={(e) =>
                                setSelectedStatus((s) => ({ ...s, [t.payment!.id]: e.target.value }))
                              }
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
                            >
                              {PAYMENT_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            {(selectedStatus[t.payment.id] ?? t.payment.status) !== t.payment.status && (
                              <button
                                type="button"
                                onClick={() =>
                                  updatePaymentStatus(t.payment!.id, selectedStatus[t.payment!.id] ?? t.payment!.status)
                                }
                                disabled={updatingId === t.payment.id}
                                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {updatingId === t.payment.id ? '…' : 'Update'}
                              </button>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                        {t.transactionDate ? new Date(t.transactionDate).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {t.orderId && (
                            <button
                              type="button"
                              onClick={() => navigate('/dashboard/orders', { state: { openOrderId: t.orderId } })}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg inline-flex items-center gap-1"
                              title="View order"
                            >
                              <Eye size={14} />
                              <span className="text-xs">Order</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeletingTransaction(t)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            aria-label="Delete transaction"
                            title="Delete Transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {deletingTransaction && (
          <ConfirmModal
            open={true}
            onCancel={() => setDeletingTransaction(null)}
            onConfirm={deletingTransaction.id === 'bulk' ? handleBulkDelete : handleDelete}
            title={deletingTransaction.id === 'bulk' ? 'Delete Selected Transactions' : 'Delete Transaction'}
            message={
              deletingTransaction.id === 'bulk'
                ? `Are you sure you want to delete ${selectedTransactions.size} transaction(s)? This action cannot be undone.`
                : `Are you sure you want to delete transaction ${deletingTransaction.id.slice(0, 8)}...? This action cannot be undone.`
            }
            confirmLabel="Delete"
            danger={true}
            loading={bulkDeleting}
          />
        )}
      </div>
    </>
  )
}
