import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { Plus, Pencil, Trash2, FolderOpen, ChevronDown, ChevronRight, FolderTree, GripVertical } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Button from '@/components/atoms/Button'
import ImageUpload from '@/components/admin/ImageUpload'
import Modal from '@/components/common/Modal'
import { categoriesApi, type Category } from '@/api/categories'
import { adminApi } from '@/api/admin'
import useToast from '@/hooks/useToast'

type FormValues = { name: string; shortDescription: string; description: string; images: string[] }

export default function AdminCategories() {
  const { showToast } = useToast()
  const location = useLocation()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Record<string, Array<{ id: string; name: string; slug: string; categoryId: string; productsCount: number }>>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [addSubcatOpen, setAddSubcatOpen] = useState<string | null>(null)
  const [editSubcat, setEditSubcat] = useState<{ id: string; categoryId: string; name: string; slug: string; description?: string; shortDescription?: string; images: string[] } | null>(null)
  const [deleteSubcat, setDeleteSubcat] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [masterSelected, setMasterSelected] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCategories, setTotalCategories] = useState(0)
  
  const subcatForm = useForm<{ name: string; shortDescription: string; description: string; images: string[] }>({
    defaultValues: { name: '', shortDescription: '', description: '', images: [] },
  })

  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    defaultValues: { name: '', shortDescription: '', description: '', images: [] },
  })

  const load = async (page = 1, size = 10) => {
    setLoading(true)
    setError(null)
    try {
      const [catRes, subcatRes] = await Promise.all([
        categoriesApi.getAll({ limit: size, page: page }).catch(() => ({ data: { data: [] } })),
        adminApi.subcategories.list().catch(() => ({ data: { data: { subcategories: [] } } })),
      ])
      setCategories(catRes.data.data ?? [])
      setTotalCategories(catRes.data.totalResults ?? catRes.data.data?.length ?? 0)
      // Group subcategories by categoryId
      const grouped: Record<string, Array<{ id: string; name: string; slug: string; categoryId: string; productsCount: number }>> = {}
      ;(subcatRes.data.data?.subcategories ?? []).forEach((sc) => {
        if (!grouped[sc.categoryId]) grouped[sc.categoryId] = []
        grouped[sc.categoryId].push({
          id: sc.id,
          name: sc.name,
          slug: sc.slug,
          categoryId: sc.categoryId,
          productsCount: sc.productsCount,
        })
      })
      setSubcategories(grouped)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load'
      setError(msg)
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(currentPage, pageSize)
  }, [location.pathname, currentPage, pageSize])

  const onAdd = handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      await adminApi.categories.create({
        name: data.name,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        images: data.images?.length ? data.images : undefined,
      })
      showToast('Category created.', 'success')
      setAddOpen(false)
      reset()
      await load(currentPage, pageSize)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Create failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onEdit = handleSubmit(async (data) => {
    if (!editCat) return
    setSubmitting(true)
    try {
      await adminApi.categories.update(editCat.id, {
        name: data.name,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        images: data.images?.length ? data.images : undefined,
      })
      showToast('Category updated.', 'success')
      setEditCat(null)
      reset()
      load(currentPage, pageSize)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onDelete = async () => {
    if (!deleteCat) return
    setSubmitting(true)
    try {
      await adminApi.categories.delete(deleteCat.id)
      showToast('Category deleted.', 'success')
      setDeleteCat(null)
      load(currentPage, pageSize)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (c: Category) => {
    setEditCat(c)
    setValue('name', c.name)
    setValue('shortDescription', c.shortDescription ?? '')
    setValue('description', c.description ?? '')
    setValue('images', c.images ?? [])
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (masterSelected) {
      setSelectedCategories(new Set())
      setMasterSelected(false)
    } else {
      setSelectedCategories(new Set(categories.map((c) => c.id)))
      setMasterSelected(true)
    }
  }

  const handleSelectCategory = (id: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCategories(newSelected)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newCategories = [...categories]
    const [removed] = newCategories.splice(draggedIndex, 1)
    newCategories.splice(dropIndex, 0, removed)

    setCategories(newCategories)
    setDraggedIndex(null)
    setDragOverIndex(null)

    try {
      const ids = newCategories.map((c) => c.id)
      await adminApi.categories.reorder(ids)
      showToast('Categories reordered', 'success')
      await load(currentPage, pageSize)
    } catch {
      showToast('Failed to reorder categories', 'error')
      await load(currentPage, pageSize)
    }
  }

  const onAddSubcat = subcatForm.handleSubmit(async (data) => {
    if (!addSubcatOpen) return
    setSubmitting(true)
    try {
      await adminApi.subcategories.create({
        categoryId: addSubcatOpen,
        name: data.name,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        images: data.images?.length ? data.images : undefined,
      })
      showToast('Subcategory created.', 'success')
      setAddSubcatOpen(null)
      subcatForm.reset()
      load(currentPage, pageSize)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Create failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onEditSubcat = subcatForm.handleSubmit(async (data) => {
    if (!editSubcat) return
    setSubmitting(true)
    try {
      await adminApi.subcategories.update(editSubcat.id, {
        name: data.name,
        shortDescription: data.shortDescription || undefined,
        description: data.description || undefined,
        images: data.images?.length ? data.images : undefined,
      })
      showToast('Subcategory updated.', 'success')
      setEditSubcat(null)
      subcatForm.reset()
      load(currentPage, pageSize)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onDeleteSubcat = async () => {
    if (!deleteSubcat) return
    setSubmitting(true)
    try {
      await adminApi.subcategories.delete(deleteSubcat.id)
      showToast('Subcategory deleted.', 'success')
      setDeleteSubcat(null)
      load(currentPage, pageSize)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditSubcat = async (subcatId: string) => {
    try {
      const res = await adminApi.subcategories.get(subcatId)
      const sc = res.data.data
      setEditSubcat({
        id: sc.id,
        categoryId: sc.categoryId,
        name: sc.name,
        slug: sc.slug,
        description: sc.description || '',
        shortDescription: sc.shortDescription || '',
        images: sc.images || [],
      })
      subcatForm.reset({
        name: sc.name,
        shortDescription: sc.shortDescription || '',
        description: sc.description || '',
        images: sc.images || [],
      })
    } catch {
      showToast('Failed to load subcategory details.', 'error')
    }
  }

  return (
    <><div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Categories</h1>
          <Button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={18} />
            Add Category
          </Button>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && categories.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No categories yet.</p>
            <Button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus size={18} />
              Add Category
            </Button>
          </div>
        )}
        {!loading && !error && categories.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">
                    <input
                      type="checkbox"
                      checked={masterSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = selectedCategories.size > 0 && selectedCategories.size < categories.length
                        }
                      }}
                      onChange={handleSelectAll}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Sort</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Slug</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Short desc</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, index) => {
                  const catSubcats = subcategories[c.id] || []
                  const isExpanded = expandedCategories.has(c.id)
                  return (
                    <React.Fragment key={c.id}>
                      <tr
                        className={`border-b border-gray-100 hover:bg-gray-50 cursor-move ${
                          dragOverIndex === index ? 'bg-indigo-50' : ''
                        } ${draggedIndex === index ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedCategories.has(c.id)}
                            onChange={() => handleSelectCategory(c.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          <GripVertical size={18} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleCategory(c.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                            <span className="font-medium text-gray-800">{c.name}</span>
                            {catSubcats.length > 0 && (
                              <span className="text-xs text-gray-500">({catSubcats.length} subcategories)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{c.slug}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-30 truncate">{c.shortDescription ?? '—'}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-40 truncate">{c.description ?? '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setAddSubcatOpen(c.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              aria-label="Add Subcategory"
                              title="Add Subcategory"
                            >
                              <FolderTree size={16} />
                            </button>
                            <button type="button" onClick={() => openEdit(c)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg" aria-label="Edit">
                              <Pencil size={16} />
                            </button>
                            <button type="button" onClick={() => setDeleteCat(c)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" aria-label="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && catSubcats.length > 0 && (
                        <tr>
                          <td colSpan={6} className="py-2 px-4 bg-gray-50">
                            <div className="ml-8 space-y-2">
                              <div className="text-xs font-medium text-gray-600 mb-2">Subcategories:</div>
                              {catSubcats.map((sc) => (
                                <div key={sc.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-200">
                                  <div className="flex items-center gap-2">
                                    <FolderTree size={14} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-800">{sc.name}</span>
                                    <span className="text-xs text-gray-500">({sc.productsCount} products)</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openEditSubcat(sc.id)}
                                      className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
                                      aria-label="Edit Subcategory"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteSubcat({ id: sc.id, name: sc.name })}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                      aria-label="Delete Subcategory"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {addOpen && (
          <SimpleFormModal
            title="Add Category"
            control={control}
            onSubmit={onAdd}
            onCancel={() => { setAddOpen(false); reset(); }}
            submitting={submitting}
          />
        )}
        {editCat && (
          <SimpleFormModal
            title={`Edit: ${editCat.name}`}
            control={control}
            onSubmit={onEdit}
            onCancel={() => { setEditCat(null); reset(); }}
            submitting={submitting}
            deleteConfig={{ ownerType: 'category', ownerId: editCat.id, field: 'images' }}
          />
        )}
        <ConfirmModal
          open={!!deleteCat}
          title="Delete Category"
          message={deleteCat ? `Delete "${deleteCat.name}"?` : ''}
          confirmLabel="Delete"
          danger
          loading={submitting}
          onConfirm={onDelete}
          onCancel={() => setDeleteCat(null)}
        />

        {addSubcatOpen && (
          <Modal open={true} onClose={() => { setAddSubcatOpen(null); subcatForm.reset(); }} title="Add Subcategory" size="md">
            <form onSubmit={onAddSubcat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Controller
                  name="name"
                  control={subcatForm.control}
                  rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Subcategory name" />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
                <Controller
                  name="shortDescription"
                  control={subcatForm.control}
                  render={({ field }) => (
                    <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Brief summary (optional)" />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Controller
                  name="description"
                  control={subcatForm.control}
                  render={({ field }) => (
                    <textarea {...field} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Full description (optional)" />
                  )}
                />
              </div>
              <Controller
                name="images"
                control={subcatForm.control}
                render={({ field }) => (
                  <ImageUpload value={field.value} onChange={field.onChange} label="Subcategory images" maxFiles={4} folder="categories" />
                )}
              />
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setAddSubcatOpen(null); subcatForm.reset(); }} className="px-5 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Subcategory'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {editSubcat && (
          <Modal open={true} onClose={() => { setEditSubcat(null); subcatForm.reset(); }} title={`Edit Subcategory: ${editSubcat.name}`} size="md">
            <form onSubmit={onEditSubcat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Controller
                  name="name"
                  control={subcatForm.control}
                  rules={{ required: 'Required' }}
                  render={({ field }) => (
                    <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
                <Controller
                  name="shortDescription"
                  control={subcatForm.control}
                  render={({ field }) => (
                    <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Controller
                  name="description"
                  control={subcatForm.control}
                  render={({ field }) => (
                    <textarea {...field} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  )}
                />
              </div>
              <Controller
                name="images"
                control={subcatForm.control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    label="Subcategory images"
                    folder="categories"
                    maxFiles={4}
                    deleteConfig={editSubcat ? { ownerType: 'subcategory', ownerId: editSubcat.id, field: 'images' } : undefined}
                  />
                )}
              />
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setEditSubcat(null); subcatForm.reset(); }} className="px-5 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Updating...' : 'Update Subcategory'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        <ConfirmModal
          open={!!deleteSubcat}
          title="Delete Subcategory"
          message={deleteSubcat ? `Delete "${deleteSubcat.name}"?` : ''}
          confirmLabel="Delete"
          danger
          loading={submitting}
          onConfirm={onDeleteSubcat}
          onCancel={() => setDeleteSubcat(null)}
        />
      </div>
    </>
  )
}

function SimpleFormModal({
  title,
  control,
  onSubmit,
  onCancel,
  submitting,
  deleteConfig,
}: {
  title: string
  control: import('react-hook-form').Control<FormValues>
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  deleteConfig?: {
    ownerType: 'category'
    ownerId?: string | number
    field?: string
  }
}) {
  return (
    <Modal open={true} onClose={onCancel} title={title} size="md">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Category name" />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short description</label>
            <Controller
              name="shortDescription"
              control={control}
              render={({ field }) => (
                <input {...field} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Brief summary (optional)" />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea {...field} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Full description (optional)" />
              )}
            />
          </div>
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ImageUpload
                value={field.value}
                onChange={field.onChange}
                label="Category images"
                folder="categories"
                maxFiles={4}
                deleteConfig={deleteConfig}
              />
            )}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition shadow-lg shadow-indigo-500/30">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
    </Modal>
  )
}
