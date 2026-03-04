import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { Plus, Pencil, Trash2, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/atoms/Button'
import { brandsApi, type Brand } from '@/api/brands'
import useToast from '@/hooks/useToast'
import ImageUpload from '@/components/admin/ImageUpload'
import { toImageUrl } from '@/utils/imageUrl'

type FormValues = {
  name: string
  logo: string[]
}

export default function AdminBrands() {
  const { showToast } = useToast()
  const location = useLocation()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Brand | null>(null)
  const [deleting, setDeleting] = useState<Brand | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  const [masterSelected, setMasterSelected] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalBrands, setTotalBrands] = useState(0)

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      logo: [],
    },
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await brandsApi.getAll()
      setBrands(res.data.data?.brands ?? [])
      setTotalBrands(res.data.data?.brands?.length ?? 0)
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
  }, [location.pathname])

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        logo: editing.logo ? [editing.logo] : [],
      })
    }
  }, [editing, form])

  const onAdd = form.handleSubmit(async (data) => {
    if (!data.name?.trim()) {
      showToast('Name is required.', 'error')
      return
    }
    setSubmitting(true)
    try {
      await brandsApi.create({
        name: data.name.trim(),
        logo: data.logo?.[0] || null,
      })
      showToast('Brand added.', 'success')
      setAddOpen(false)
      form.reset({ name: '', logo: [] })
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Create failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onEdit = form.handleSubmit(async (data) => {
    if (!editing) return
    if (!data.name?.trim()) {
      showToast('Name is required.', 'error')
      return
    }
    setSubmitting(true)
    try {
      await brandsApi.update(editing.id, {
        name: data.name.trim(),
        logo: data.logo?.[0] || null,
      })
      showToast('Brand updated.', 'success')
      setEditing(null)
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onDelete = async () => {
    if (!deleting) return
    setSubmitting(true)
    try {
      await brandsApi.delete(deleting.id)
      showToast('Brand deleted.', 'success')
      setDeleting(null)
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectAll = () => {
    if (masterSelected) {
      setSelectedBrands(new Set())
      setMasterSelected(false)
    } else {
      setSelectedBrands(new Set(brands.map((b) => b.id)))
      setMasterSelected(true)
    }
  }

  const handleSelectBrand = (id: string) => {
    const newSelected = new Set(selectedBrands)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedBrands(newSelected)
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Brands</h1>
          <Button
            type="button"
            onClick={() => { setAddOpen(true); form.reset({ name: '', logo: [] }); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={18} />
            Add Brand
          </Button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!loading && !error && brands.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Tag className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No brands yet. Add a brand to get started.</p>
            <Button
              type="button"
              onClick={() => { setAddOpen(true); form.reset({ name: '', logo: [] }); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus size={18} />
              Add Brand
            </Button>
          </div>
        )}

        {!loading && !error && brands.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left py-3.5 px-4 font-semibold text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={masterSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = selectedBrands.size > 0 && selectedBrands.size < brands.length
                          }
                        }}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-3.5 px-4 font-semibold text-gray-700">Logo</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-right py-3.5 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {brands.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedBrands.has(b.id)}
                          onChange={() => handleSelectBrand(b.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        {b.logo ? (
                          <img
                            src={toImageUrl(b.logo)}
                            alt={b.name}
                            className="w-11 h-11 object-contain rounded-lg border border-gray-200 bg-gray-50"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Tag size={20} className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">{b.name}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(b)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(b)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50/50 text-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-gray-600">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2.5 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-gray-500">per page</span>
                </label>
                <span className="text-gray-500">
                  {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalBrands)} of {totalBrands}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-md hover:bg-white hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(totalBrands / pageSize))
                  const pages: (number | string)[] = []
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i)
                  } else {
                    if (currentPage <= 4) {
                      for (let i = 1; i <= 5; i++) pages.push(i)
                      pages.push('...')
                      pages.push(totalPages)
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1)
                      pages.push('...')
                      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
                    } else {
                      pages.push(1)
                      pages.push('...')
                      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
                      pages.push('...')
                      pages.push(totalPages)
                    }
                  }
                  return pages.map((page, index) =>
                    typeof page === 'number' ? (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[2rem] px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'border border-gray-300 hover:bg-white hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={index} className="px-1.5 text-gray-400 select-none">…</span>
                    )
                  )
                })()}
                <button
                  onClick={() => setCurrentPage(Math.min(Math.ceil(totalBrands / pageSize) || 1, currentPage + 1))}
                  disabled={currentPage >= Math.ceil(totalBrands / pageSize)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-white hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {addOpen && (
          <Modal open={true} onClose={() => setAddOpen(false)} title="Add Brand" size="lg">
            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Controller
                  name="name"
                  control={form.control}
                  rules={{ required: 'Required' }}
                  render={({ field, fieldState }) => (
                    <div>
                      <input {...field} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? 'border-red-300' : 'border-gray-300'}`} placeholder="Brand name" />
                      {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <Controller
                  name="logo"
                  control={form.control}
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      multiple={false}
                      maxFiles={1}
                      label="Upload brand logo"
                      folder="brands"
                      deleteConfig={editing ? { ownerType: 'brand', ownerId: editing.id, field: 'logo' } : undefined}
                    />
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setAddOpen(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {editing && (
          <Modal open={true} onClose={() => setEditing(null)} title={`Edit Brand: ${editing.name}`} size="lg">
            <form onSubmit={onEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Controller
                  name="name"
                  control={form.control}
                  rules={{ required: 'Required' }}
                  render={({ field, fieldState }) => (
                    <div>
                      <input {...field} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? 'border-red-300' : 'border-gray-300'}`} placeholder="Brand name" />
                      {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <Controller
                  name="logo"
                  control={form.control}
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      multiple={false}
                      maxFiles={1}
                      label="Upload brand logo"
                      folder="brands"
                    />
                  )}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {submitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        <ConfirmModal
          open={!!deleting}
          title="Delete Brand"
          message={deleting ? `Delete "${deleting.name}"? This cannot be undone.` : ''}
          confirmLabel="Delete"
          danger
          loading={submitting}
          onConfirm={onDelete}
          onCancel={() => setDeleting(null)}
        />
      </div>
    </>
  )
}
