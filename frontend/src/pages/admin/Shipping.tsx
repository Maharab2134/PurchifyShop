import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Plus, Pencil, Trash2, Truck, CheckSquare, Square } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/atoms/Button'
import { adminApi, type AdminShippingOption } from '@/api/admin'
import useToast from '@/hooks/useToast'
import useFormatPrice from '@/hooks/useFormatPrice'

type FormValues = { name: string; amount: number; sortOrder: number }

export default function AdminShipping() {
  const { showToast } = useToast()
  const formatPrice = useFormatPrice()
  const [options, setOptions] = useState<AdminShippingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<AdminShippingOption | null>(null)
  const [deleting, setDeleting] = useState<AdminShippingOption | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [freeDeliveryMinAmount, setFreeDeliveryMinAmount] = useState<number>(0)
  const [freeDeliveryInput, setFreeDeliveryInput] = useState<string>('0')
  const [freeDeliveryProgressBarEnabled, setFreeDeliveryProgressBarEnabled] = useState<boolean>(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)

  const addForm = useForm<FormValues>({
    defaultValues: { name: '', amount: 0, sortOrder: 0 },
  })
  const editForm = useForm<FormValues>({
    defaultValues: { name: '', amount: 0, sortOrder: 0 },
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.shippingOptions.list()
      setOptions(res.data.data ?? [])
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    setSettingsLoading(true)
    try {
      const res = await adminApi.shippingSettings.get()
      const val = res.data.data?.freeDeliveryMinAmount ?? 0
      const enabled = res.data.data?.freeDeliveryProgressBarEnabled !== false
      setFreeDeliveryMinAmount(val)
      setFreeDeliveryInput(String(val))
      setFreeDeliveryProgressBarEnabled(enabled)
    } catch {
      setFreeDeliveryMinAmount(0)
      setFreeDeliveryInput('0')
      setFreeDeliveryProgressBarEnabled(true)
    } finally {
      setSettingsLoading(false)
    }
  }

  const saveFreeDeliverySettings = async () => {
    const num = Number(freeDeliveryInput)
    if (Number.isNaN(num) || num < 0) {
      showToast('Enter a valid amount (0 or more).', 'error')
      return
    }
    setSettingsSaving(true)
    try {
      await adminApi.shippingSettings.update({
        freeDeliveryMinAmount: num,
        freeDeliveryProgressBarEnabled,
      })
      setFreeDeliveryMinAmount(num)
      showToast('Free delivery settings updated.', 'success')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update'
      showToast(msg, 'error')
    } finally {
      setSettingsSaving(false)
    }
  }

  useEffect(() => {
    load()
    loadSettings()
  }, [])

  const onAdd = addForm.handleSubmit(async (data) => {
    if (!data.name.trim()) {
      showToast('Name is required.', 'error')
      return
    }
    setSubmitting(true)
    try {
      await adminApi.shippingOptions.create({
        name: data.name.trim(),
        amount: Number(data.amount) || 0,
        sortOrder: Number(data.sortOrder) || 0,
      })
      showToast('Shipping option created.', 'success')
      setAddOpen(false)
      addForm.reset({ name: '', amount: 0, sortOrder: 0 })
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Create failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const openEdit = (o: AdminShippingOption) => {
    setEditing(o)
    editForm.reset({ name: o.name, amount: o.amount, sortOrder: o.sortOrder })
  }

  const onEdit = editForm.handleSubmit(async (data) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await adminApi.shippingOptions.update(editing.id, {
        name: data.name.trim(),
        amount: Number(data.amount) || 0,
        sortOrder: Number(data.sortOrder) || 0,
      })
      showToast('Shipping option updated.', 'success')
      setEditing(null)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const toggleActive = async (o: AdminShippingOption) => {
    setSubmitting(true)
    try {
      await adminApi.shippingOptions.update(o.id, { isActive: !o.isActive })
      showToast(`${o.name} ${o.isActive ? 'disabled' : 'enabled'}.`, 'success')
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!deleting) return
    setSubmitting(true)
    try {
      await adminApi.shippingOptions.delete(deleting.id)
      showToast('Shipping option deleted.', 'success')
      setDeleting(null)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleSelectOption = (id: string) => {
    setSelectedOptions((prev) => {
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
    if (selectedOptions.size === options.length) {
      setSelectedOptions(new Set())
    } else {
      setSelectedOptions(new Set(options.map((o) => o.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedOptions.size === 0) return
    setBulkDeleting(true)
    try {
      const deletePromises = Array.from(selectedOptions).map((id) => adminApi.shippingOptions.delete(id))
      await Promise.all(deletePromises)
      showToast(`${selectedOptions.size} shipping option(s) deleted successfully`, 'success')
      setSelectedOptions(new Set())
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to delete'
      showToast(msg, 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    
      <><div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Shipping Amount</h1>
            <p className="text-gray-600 text-sm mt-1">
              Set shipping options and amounts. Users select one on the cart page; that amount is applied at checkout.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedOptions.size > 0 && (
              <>
                <span className="text-sm text-gray-600">{selectedOptions.size} selected</span>
                <Button
                  type="button"
                  onClick={() => setDeleting({ id: 'bulk' } as AdminShippingOption)}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete Selected ({selectedOptions.size})
                </Button>
              </>
            )}
            <Button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              <Plus size={18} />
              Add Shipping Option
            </Button>
          </div>
        </div>

        {/* Free delivery minimum and progress bar active/inactive */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
          <h2 className="text-base font-semibold text-gray-800 mb-2">Free delivery progress bar (user cart)</h2>
          <p className="text-gray-600 text-sm mb-3">
            When <strong>Active</strong>, users see a progress bar on the cart; when cart reaches the minimum amount, shipping is FREE. When <strong>Inactive</strong>, the bar is hidden and normal shipping charges apply.
          </p>
          {settingsLoading ? (
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-48" />
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Progress bar:</span>
                <button
                  type="button"
                  onClick={() => setFreeDeliveryProgressBarEnabled(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    freeDeliveryProgressBarEnabled
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setFreeDeliveryProgressBarEnabled(false)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    !freeDeliveryProgressBarEnabled
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Inactive
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-sm text-gray-600">Minimum amount for free delivery:</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={freeDeliveryInput}
                  onChange={(e) => setFreeDeliveryInput(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="e.g. 1500"
                />
                <span className="text-gray-600 text-sm">৳</span>
                <Button
                  type="button"
                  onClick={saveFreeDeliverySettings}
                  disabled={settingsSaving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {settingsSaving ? 'Saving…' : 'Save'}
                </Button>
                {freeDeliveryMinAmount > 0 && (
                  <span className="text-sm text-gray-500">Current: {formatPrice(freeDeliveryMinAmount)}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && options.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Truck className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No shipping options yet. Add options for users to select on the cart page.</p>
            <Button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus size={18} />
              Add Shipping Option
            </Button>
          </div>
        )}
        {!loading && !error && options.length > 0 && (
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Select all"
                    >
                      {selectedOptions.size === options.length && options.length > 0 ? (
                        <CheckSquare size={18} className="text-indigo-600" />
                      ) : (
                        <Square size={18} className="text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Sort</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {options.map((o) => (
                  <tr key={o.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedOptions.has(o.id) ? 'bg-indigo-50' : ''}`}>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleSelectOption(o.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Select shipping option"
                      >
                        {selectedOptions.has(o.id) ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">{o.name}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{formatPrice(o.amount)}</td>
                    <td className="py-3 px-4 text-gray-600">{o.sortOrder}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          o.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {o.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(o)}
                          disabled={submitting}
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            o.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {o.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(o)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(o)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          aria-label="Delete"
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
        )}

        {addOpen && (
          <Modal open={true} onClose={() => { setAddOpen(false); addForm.reset(); }} title="Add Shipping Option" size="md">
            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Controller
                  name="name"
                  control={addForm.control}
                  rules={{ required: 'Required' }}
                  render={({ field, fieldState }) => (
                    <>
                      <input {...field} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? 'border-red-300' : 'border-gray-300'}`} placeholder="e.g. Standard, Express, Free" />
                      {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳) *</label>
                <Controller
                  name="amount"
                  control={addForm.control}
                  rules={{ required: 'Required', min: { value: 0, message: 'Min 0' } }}
                  render={({ field, fieldState }) => (
                    <>
                      <input {...field} type="number" step="0.01" min={0} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? 'border-red-300' : 'border-gray-300'}`} onChange={(e) => field.onChange(Number(e.target.value))} />
                      {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                <Controller
                  name="sortOrder"
                  control={addForm.control}
                  render={({ field }) => (
                    <input {...field} type="number" min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" onChange={(e) => field.onChange(Number(e.target.value))} />
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setAddOpen(false); addForm.reset(); }} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {editing && (
          <Modal open={true} onClose={() => setEditing(null)} title={`Edit: ${editing.name}`} size="md">
            <form onSubmit={onEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Controller
                  name="name"
                  control={editForm.control}
                  rules={{ required: 'Required' }}
                  render={({ field, fieldState }) => (
                    <>
                      <input {...field} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? 'border-red-300' : 'border-gray-300'}`} />
                      {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳) *</label>
                <Controller
                  name="amount"
                  control={editForm.control}
                  rules={{ required: 'Required', min: { value: 0, message: 'Min 0' } }}
                  render={({ field, fieldState }) => (
                    <>
                      <input {...field} type="number" step="0.01" min={0} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? 'border-red-300' : 'border-gray-300'}`} onChange={(e) => field.onChange(Number(e.target.value))} />
                      {fieldState.error && <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                <Controller
                  name="sortOrder"
                  control={editForm.control}
                  render={({ field }) => (
                    <input {...field} type="number" min={0} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" onChange={(e) => field.onChange(Number(e.target.value))} />
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        <ConfirmModal
          open={!!deleting}
          title={deleting?.id === 'bulk' ? 'Delete Selected Shipping Options' : 'Delete Shipping Option'}
          message={
            deleting?.id === 'bulk'
              ? `Are you sure you want to delete ${selectedOptions.size} shipping option(s)? This action cannot be undone.`
              : deleting
                ? `Delete "${deleting.name}"? Users will no longer see this option.`
                : ''
          }
          confirmLabel="Delete"
          danger
          loading={submitting || bulkDeleting}
          onConfirm={deleting?.id === 'bulk' ? handleBulkDelete : onDelete}
          onCancel={() => setDeleting(null)}
        />
      </div>
    </>
  )
}
