import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Plus, Pencil, Trash2, Ticket, UserPlus, CheckSquare, Square } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/atoms/Button'
import { adminApi, type AdminCoupon } from '@/api/admin'
import { adminApi as adminApiClient } from '@/api/admin'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'

type FormValues = {
  code: string
  name: string
  description: string
  type: 'PERCENTAGE' | 'FIXED'
  value: number
  minPurchase: number
  maxDiscount: number | null
  validFrom: string
  validUntil: string
  usageLimit: number | null
  isActive: boolean
  scope: 'ALL' | 'USER'
}

type AssignFormValues = {
  userId: string
}

export default function AdminCoupons() {
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState<AdminCoupon | null>(null)
  const [deleteCoupon, setDeleteCoupon] = useState<AdminCoupon | null>(null)
  const [assignCoupon, setAssignCoupon] = useState<AdminCoupon | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCoupons, setSelectedCoupons] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      minPurchase: 0,
      maxDiscount: null,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: null,
      isActive: true,
      scope: 'USER',
    },
  })

  const assignForm = useForm<AssignFormValues>({
    defaultValues: { userId: '' },
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [cRes, uRes] = await Promise.all([
        adminApi.coupons.list(),
        adminApiClient.users.list().catch(() => ({ data: { data: { users: [] } } })),
      ])
      setCoupons(cRes.data.data ?? [])
      setUsers((uRes.data.data?.users ?? []).map((u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email })))
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

  const onAdd = handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      await adminApi.coupons.create({
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        value: Number(data.value),
        minPurchase: Number(data.minPurchase) || 0,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
        isActive: data.isActive,
        scope: data.scope,
      })
      showToast('Coupon created.', 'success')
      setAddOpen(false)
      reset()
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Create failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onEdit = handleSubmit(async (data) => {
    if (!editCoupon) return
    setSubmitting(true)
    try {
      await adminApi.coupons.update(editCoupon.id, {
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        value: Number(data.value),
        minPurchase: Number(data.minPurchase) || 0,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
        isActive: data.isActive,
        scope: data.scope,
      })
      showToast('Coupon updated.', 'success')
      setEditCoupon(null)
      reset()
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onDelete = async () => {
    if (!deleteCoupon) return
    setSubmitting(true)
    try {
      await adminApi.coupons.delete(deleteCoupon.id)
      showToast('Coupon deleted.', 'success')
      setDeleteCoupon(null)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSelectCoupon = (id: string) => {
    setSelectedCoupons((prev) => {
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
    if (selectedCoupons.size === coupons.length) {
      setSelectedCoupons(new Set())
    } else {
      setSelectedCoupons(new Set(coupons.map((c) => c.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCoupons.size === 0) return
    setBulkDeleting(true)
    try {
      const deletePromises = Array.from(selectedCoupons).map((id) => adminApi.coupons.delete(id))
      await Promise.all(deletePromises)
      showToast(`${selectedCoupons.size} coupon(s) deleted successfully`, 'success')
      setSelectedCoupons(new Set())
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete'
      showToast(msg, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  const onAssign = assignForm.handleSubmit(async (data) => {
    if (!assignCoupon) return
    setSubmitting(true)
    try {
      await adminApi.coupons.assignToUser(assignCoupon.id, data.userId)
      showToast('Coupon assigned to user.', 'success')
      setAssignCoupon(null)
      assignForm.reset()
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Assign failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const openEdit = (c: AdminCoupon) => {
    setEditCoupon(c)
    setValue('code', c.code)
    setValue('name', c.name)
    setValue('description', c.description || '')
    setValue('type', c.type)
    setValue('value', c.value)
    setValue('minPurchase', c.minPurchase)
    setValue('maxDiscount', c.maxDiscount)
    setValue('validFrom', c.validFrom)
    setValue('validUntil', c.validUntil)
    setValue('usageLimit', c.usageLimit)
    setValue('isActive', c.isActive)
    setValue('scope', c.scope ?? 'USER')
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Coupons</h1>
          <div className="flex items-center gap-2">
            {selectedCoupons.size > 0 && (
              <>
                <span className="text-sm text-gray-600">{selectedCoupons.size} selected</span>
                <Button
                  type="button"
                  onClick={() => setDeleteCoupon({ id: 'bulk' } as AdminCoupon)}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete Selected ({selectedCoupons.size})
                </Button>
              </>
            )}
            <Button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <Plus size={18} />
              Add Coupon
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && coupons.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No coupons yet.</p>
            <Button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus size={18} />
              Add Coupon
            </Button>
          </div>
        )}
        {!loading && !error && coupons.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Select all"
            >
              {selectedCoupons.size === coupons.length && coupons.length > 0 ? (
                <CheckSquare size={20} className="text-indigo-600" />
              ) : (
                <Square size={20} className="text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-600">Select all coupons</span>
          </div>
        )}
        {!loading && !error && coupons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition ${selectedCoupons.has(c.id) ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSelectCoupon(c.id)}
                      className="p-1 hover:bg-gray-100 rounded mt-1"
                      title="Select coupon"
                    >
                      {selectedCoupons.has(c.id) ? (
                        <CheckSquare size={18} className="text-indigo-600" />
                      ) : (
                        <Square size={18} className="text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{c.code}</h3>
                      <p className="text-sm text-gray-600 mt-1">{c.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(c.scope ?? 'USER') === 'USER' && (
                      <button
                        type="button"
                        onClick={() => setAssignCoupon(c)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        aria-label="Assign to user"
                      >
                        <UserPlus size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                      aria-label="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteCoupon(c)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {c.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-semibold text-indigo-600">
                      {c.type === 'PERCENTAGE' ? `${c.value}%` : formatPrice(c.value)}
                    </span>
                  </div>
                  {c.minPurchase > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Purchase:</span>
                      <span className="font-medium">{formatPrice(c.minPurchase)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valid:</span>
                    <span className="text-xs">{new Date(c.validFrom).toLocaleDateString()} - {new Date(c.validUntil).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usage:</span>
                    <span className="font-medium">{c.usageCount} / {c.usageLimit || '∞'}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${c.isActive && c.isValid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {c.isActive && c.isValid ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {(c.scope ?? 'USER') === 'ALL' ? 'For Everyone' : 'For specific user(s)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {addOpen && (
          <CouponFormModal
            title="Add Coupon"
            control={control}
            onSubmit={onAdd}
            onCancel={() => { setAddOpen(false); reset(); }}
            submitting={submitting}
            watch={watch}
          />
        )}
        {editCoupon && (
          <CouponFormModal
            title={`Edit: ${editCoupon.code}`}
            control={control}
            onSubmit={onEdit}
            onCancel={() => { setEditCoupon(null); reset(); }}
            submitting={submitting}
            watch={watch}
          />
        )}
        {assignCoupon && (
          <Modal open={true} onClose={() => { setAssignCoupon(null); assignForm.reset(); }} title={`Assign Coupon: ${assignCoupon.code}`} size="md">
            <form onSubmit={onAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User *</label>
                <Controller
                  name="userId"
                  control={assignForm.control}
                  rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select user</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => { setAssignCoupon(null); assignForm.reset(); }} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition shadow-lg shadow-indigo-500/30">
                  {submitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </Modal>
        )}
        <ConfirmModal
          open={!!deleteCoupon}
          title={deleteCoupon?.id === 'bulk' ? 'Delete Selected Coupons' : 'Delete Coupon'}
          message={
            deleteCoupon?.id === 'bulk'
              ? `Are you sure you want to delete ${selectedCoupons.size} coupon(s)? This action cannot be undone.`
              : deleteCoupon
                ? `Delete coupon "${deleteCoupon.code}"?`
                : ''
          }
          confirmLabel="Delete"
          danger
          loading={submitting || bulkDeleting}
          onConfirm={deleteCoupon?.id === 'bulk' ? handleBulkDelete : onDelete}
          onCancel={() => setDeleteCoupon(null)}
        />
      </div>
    </>
  )
}

function CouponFormModal({
  title,
  control,
  onSubmit,
  onCancel,
  submitting,
  watch,
}: {
  title: string
  control: import('react-hook-form').Control<FormValues>
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  watch: (name: keyof FormValues) => any
}) {
  const type = watch('type')

  return (
    <Modal open={true} onClose={onCancel} title={title} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <Controller
              name="code"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="SAVE20" />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              )}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Who can use this coupon *</label>
          <Controller
            name="scope"
            control={control}
            render={({ field }) => (
              <select {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                <option value="ALL">Everyone — anyone with the code can apply</option>
                <option value="USER">Specific user(s) — assign to users; only they can use it</option>
              </select>
            )}
          />
          <p className="text-xs text-gray-500 mt-1">For &quot;Specific user(s)&quot;, use Assign after saving.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Summer Sale" />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea {...field} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Optional" />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
            <Controller
              name="value"
              control={control}
              rules={{ required: 'Required', min: { value: 0, message: 'Min 0' } }}
              render={({ field }) => (
                <input {...field} type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">{type === 'PERCENTAGE' ? 'Percentage (0-100)' : 'Fixed amount'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase</label>
            <Controller
              name="minPurchase"
              control={control}
              render={({ field }) => (
                <input {...field} type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              )}
            />
          </div>
        </div>
        {type === 'PERCENTAGE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
            <Controller
              name="maxDiscount"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  step="0.01"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  onBlur={field.onBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Optional"
                />
              )}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
            <Controller
              name="validFrom"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <input {...field} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
            <Controller
              name="validUntil"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <input {...field} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              )}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
            <Controller
              name="usageLimit"
              control={control}
              render={({ field }) => (
                <input
                  type="number"
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  onBlur={field.onBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave empty for unlimited"
                />
              )}
            />
        </div>
        <div>
          <label className="flex items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  name={field.name}
                  className="rounded"
                />
              )}
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancel</button>
          <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition shadow-lg shadow-indigo-500/30">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
