import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, ToggleLeft, Pencil, Copy, Check, Plus, Trash2 } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Button from '@/components/atoms/Button'
import { adminApi, type AdminPaymentMethod } from '@/api/admin'
import useToast from '@/hooks/useToast'

export default function AdminPaymentMethods() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [methods, setMethods] = useState<AdminPaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<AdminPaymentMethod | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.paymentMethods.list()
      setMethods(res.data.data ?? [])
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
  }, [])

  const toggleActive = async (m: AdminPaymentMethod) => {
    setSubmitting(true)
    try {
      await adminApi.paymentMethods.update(m.id, { isActive: !m.isActive })
      showToast(`${m.name} ${m.isActive ? 'disabled' : 'enabled'}.`, 'success')
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const copyNumber = (m: AdminPaymentMethod) => {
    const n = m.config?.number
    if (!n) return
    navigator.clipboard.writeText(n)
    setCopiedId(m.id)
    showToast('Number copied.', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyAccountNumber = (m: AdminPaymentMethod) => {
    const n = m.config?.accountNumber
    if (!n) return
    navigator.clipboard.writeText(n)
    setCopiedId(m.id)
    showToast('Account number copied.', 'success')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const onDelete = async () => {
    if (!deleting) return
    setSubmitting(true)
    try {
      await adminApi.paymentMethods.delete(deleting.id)
      showToast('Payment method deleted.', 'success')
      setDeleting(null)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    
      <><div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">Payment Methods</h1>
            <p className="text-gray-600 text-sm">
              Activate or deactivate payment options. For bKash, Nagad, Rocket: set your number. Users copy it, send money, then enter their sending number & transaction ID at checkout.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => navigate('/dashboard/payment-methods/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={18} />
            Add Payment Method
          </Button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && methods.length > 0 && (
          <div className="space-y-4">
            {methods.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.isActive ? 'bg-green-50' : 'bg-gray-100'}`}>
                      <CreditCard className={`w-5 h-5 ${m.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{m.name}</p>
                      <p className="text-sm text-gray-500">{m.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(m)}
                      disabled={submitting}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        m.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <ToggleLeft size={18} />
                      {m.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <Button
                      type="button"
                      onClick={() => navigate(`/dashboard/payment-methods/${m.id}/edit`)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium"
                    >
                      <Pencil size={16} />
                      Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeleting(m)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                {m.config?.number && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-1">Your number (users will send money here)</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="px-3 py-2 bg-gray-100 rounded-lg font-mono text-gray-800">{m.config.number}</code>
                      <button
                        type="button"
                        onClick={() => copyNumber(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                      >
                        {copiedId === m.id ? <Check size={16} /> : <Copy size={16} />}
                        {copiedId === m.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
                {m.config?.instruction && (
                  <p className="text-sm text-gray-600 mt-2">{m.config.instruction}</p>
                )}
                {(m.config?.accountNumber || m.config?.bankName || m.config?.branch || m.config?.accountHolder) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Bank Account Details</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      {m.config.accountHolder && (
                        <p><span className="font-medium">Account Holder:</span> {m.config.accountHolder}</p>
                      )}
                      {m.config.bankName && (
                        <p><span className="font-medium">Bank:</span> {m.config.bankName}</p>
                      )}
                      {m.config.branch && (
                        <p><span className="font-medium">Branch:</span> {m.config.branch}</p>
                      )}
                      {m.config.accountNumber && (
                        <div className="flex items-center gap-2">
                          <p><span className="font-medium">Account Number:</span> <code className="px-2 py-1 bg-gray-100 rounded font-mono">{m.config.accountNumber}</code></p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(m.config.accountNumber || '')
                              setCopiedId(m.id)
                              showToast('Account number copied', 'success')
                              setTimeout(() => setCopiedId(null), 2000)
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs hover:bg-indigo-100"
                          >
                            {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {deleting && (
          <ConfirmModal
            open={true}
            onCancel={() => setDeleting(null)}
            onConfirm={onDelete}
            title="Delete Payment Method"
            message={`Are you sure you want to delete "${deleting.name}"? This action cannot be undone.`}
            confirmLabel="Delete"
            danger={true}
            loading={submitting}
          />
        )}
      </div>
    </>
  )
}
