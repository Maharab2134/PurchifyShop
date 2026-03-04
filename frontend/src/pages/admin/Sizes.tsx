import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Ruler } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/atoms/Button'
import { adminApi } from '@/api/admin'
import useToast from '@/hooks/useToast'

type Size = {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export default function AdminSizes() {
  const { showToast } = useToast()
  const [sizes, setSizes] = useState<Size[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Size | null>(null)
  const [deleting, setDeleting] = useState<Size | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newSizeName, setNewSizeName] = useState('')
  const [editSizeName, setEditSizeName] = useState('')
  const [search, setSearch] = useState('')
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())
  const [masterSelected, setMasterSelected] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalSizes, setTotalSizes] = useState(0)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.sizes.list({ all: true })
      setSizes(res.data.data ?? [])
      setTotalSizes(res.data.data?.length ?? 0)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load sizes'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onAdd = async () => {
    if (!newSizeName.trim()) {
      showToast('Size name is required', 'error')
      return
    }
    setSubmitting(true)
    try {
      await adminApi.sizes.create({ name: newSizeName.trim() })
      showToast('Size created', 'success')
      setAddOpen(false)
      setNewSizeName('')
      await load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Create failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = async () => {
    if (!editing) return
    if (!editSizeName.trim()) {
      showToast('Size name is required', 'error')
      return
    }
    setSubmitting(true)
    try {
      await adminApi.sizes.update(editing.id, { name: editSizeName.trim() })
      showToast('Size updated', 'success')
      setEditing(null)
      await load()
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
      await adminApi.sizes.delete(deleting.id)
      showToast('Size deleted', 'success')
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
      setSelectedSizes(new Set())
      setMasterSelected(false)
    } else {
      setSelectedSizes(new Set(filteredSizes.map((s) => s.id)))
      setMasterSelected(true)
    }
  }

  const handleSelectSize = (id: string) => {
    const newSelected = new Set(selectedSizes)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedSizes(newSelected)
  }

  const filteredSizes = sizes.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Product Sizes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Manage product size options</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setAddOpen(true)
            setNewSizeName('')
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium shadow-sm hover:shadow transition-all"
        >
          <Plus size={18} />
          Add Size
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {!loading && !error && sizes.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-6">
            <Ruler className="text-indigo-600 dark:text-indigo-400" size={36} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No sizes yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create your first size option for products (e.g., Small, Medium, Large)
          </p>
          <Button
            type="button"
            onClick={() => {
              setAddOpen(true)
              setNewSizeName('')
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium shadow-sm hover:shadow transition-all"
          >
            <Plus size={18} />
            Create First Size
          </Button>
        </div>
      )}

      {!loading && !error && sizes.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sizes..."
              className="pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 w-full"
            />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm w-12">
                      <input
                        type="checkbox"
                        checked={masterSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = selectedSizes.size > 0 && selectedSizes.size < filteredSizes.length
                          }
                        }}
                        onChange={handleSelectAll}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Size Name</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSizes.map((size) => (
                    <tr key={size.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedSizes.has(size.id)}
                          onChange={() => handleSelectSize(size.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <Ruler className="text-indigo-600 dark:text-indigo-400" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{size.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(size)
                              setEditSizeName(size.name)
                            }}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(size)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                in {totalSizes} records ({((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalSizes)} of {totalSizes})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium dark:text-gray-100"
              >
                PV
              </button>
              
              {(() => {
                const totalPages = Math.ceil(totalSizes / pageSize)
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
                      className={`px-3 py-1.5 rounded-lg font-medium ${ 
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ) : (
                    <span key={index} className="px-2 text-gray-400">...</span>
                  )
                )
              })()}

              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalSizes / pageSize), currentPage + 1))}
                disabled={currentPage >= Math.ceil(totalSizes / pageSize)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium dark:text-gray-100"
              >
                NX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Size Modal */}
      {addOpen && (
        <Modal
          open={true}
          onClose={() => setAddOpen(false)}
          title="Add New Size"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Size Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newSizeName}
                onChange={(e) => setNewSizeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                placeholder="e.g. Small, Medium, Large"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onAdd}
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                {submitting ? 'Creating...' : 'Create Size'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Size Modal */}
      {editing && (
        <Modal
          open={true}
          onClose={() => setEditing(null)}
          title="Edit Size"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Size Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editSizeName}
                onChange={(e) => setEditSizeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onEdit()}
                placeholder="e.g. Small, Medium, Large"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onEdit}
                disabled={submitting}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                {submitting ? 'Updating...' : 'Update Size'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <ConfirmModal
          open={true}
          onCancel={() => setDeleting(null)}
          onConfirm={onDelete}
          title="Delete Size"
          message={`Are you sure you want to delete "${deleting.name}"? This action cannot be undone.`}
          confirmLabel="Delete Size"
          danger
          loading={submitting}
        />
      )}
    </div>
  )
}
