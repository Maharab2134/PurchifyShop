import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/atoms/Button'
import { adminApi } from '@/api/admin'
import useToast from '@/hooks/useToast'

type FooterItem = {
  id: number
  columnName: string
  title: string | null
  logoUrl?: string | null
  links: Array<{ label: string; url: string }>
  socialLinks?: Array<{ platform: string; url: string }>
  contactInfo?: Array<{ type: string; value: string }>
  content: string | null
  copyrightText?: string | null
  poweredByText?: string | null
  sortOrder: number
  isActive: boolean
}

type FormValues = {
  columnName: string
  title: string
  logoUrl: string
  links: Array<{ label: string; url: string }>
  socialLinks: Array<{ platform: string; url: string }>
  contactInfo: Array<{ type: string; value: string }>
  content: string
  isActive: boolean
}

export default function AdminFooter() {
  const { showToast } = useToast()
  const [items, setItems] = useState<FooterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<FooterItem | null>(null)
  const [deleting, setDeleting] = useState<FooterItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [openColumns, setOpenColumns] = useState<Record<string, boolean>>({
    column1: true,
    column2: true,
    column3: true,
    column4: true,
  })

  const form = useForm<FormValues>({
    defaultValues: {
      columnName: 'column1',
      title: '',
      logoUrl: '',
      links: [],
      socialLinks: [],
      contactInfo: [],
      content: '',
      isActive: true,
    },
  })

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({ control: form.control, name: 'links' })
  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({ control: form.control, name: 'socialLinks' })
  const { fields: contactFields, append: appendContact, remove: removeContact } = useFieldArray({ control: form.control, name: 'contactInfo' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.footer.list()
      setItems(res.data.data ?? [])
    } catch {
      showToast('Failed to load footer items', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (editing) {
      form.reset({
        columnName: editing.columnName,
        title: editing.title || '',
        logoUrl: editing.logoUrl || '',
        links: editing.links.length > 0 ? editing.links : [],
        socialLinks: editing.socialLinks && editing.socialLinks.length > 0 ? editing.socialLinks : [],
        contactInfo: editing.contactInfo && editing.contactInfo.length > 0 ? editing.contactInfo : [],
        content: editing.content || '',
        isActive: editing.isActive,
      })
    }
  }, [editing, form])

  const onAdd = form.handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      await adminApi.footer.create({
        columnName: data.columnName,
        title: data.title?.trim() || undefined,
        logoUrl: data.logoUrl?.trim() || undefined,
        links: data.links.filter((l) => l.label && l.url).length > 0 ? data.links.filter((l) => l.label && l.url) : undefined,
        socialLinks: data.socialLinks.filter((s) => s.platform && s.url).length > 0 ? data.socialLinks.filter((s) => s.platform && s.url) : undefined,
        contactInfo: data.contactInfo.filter((c) => c.type && c.value).length > 0 ? data.contactInfo.filter((c) => c.type && c.value) : undefined,
        content: data.content?.trim() || undefined,
        isActive: data.isActive ?? true,
      })
      showToast('Footer item created', 'success')
      setAddOpen(false)
      form.reset({ columnName: 'column1', title: '', links: [], isActive: true })
      await load()
    } catch (e) {
      showToast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Create failed', 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onEdit = form.handleSubmit(async (data) => {
    if (!editing) return
    setSubmitting(true)
    try {
      await adminApi.footer.update(editing.id, {
        columnName: data.columnName,
        title: data.title?.trim() || undefined,
        logoUrl: data.logoUrl?.trim() || undefined,
        links: data.links.filter((l) => l.label && l.url).length > 0 ? data.links.filter((l) => l.label && l.url) : undefined,
        socialLinks: data.socialLinks.filter((s) => s.platform && s.url).length > 0 ? data.socialLinks.filter((s) => s.platform && s.url) : undefined,
        contactInfo: data.contactInfo.filter((c) => c.type && c.value).length > 0 ? data.contactInfo.filter((c) => c.type && c.value) : undefined,
        content: data.content?.trim() || undefined,
        isActive: data.isActive ?? true,
      })
      showToast('Footer item updated', 'success')
      setEditing(null)
      await load()
    } catch (e) {
      showToast((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed', 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onDelete = async () => {
    if (!deleting) return
    setSubmitting(true)
    try {
      await adminApi.footer.delete(deleting.id)
      showToast('Footer item deleted', 'success')
      setDeleting(null)
      await load()
    } catch {
      showToast('Delete failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.columnName]) acc[item.columnName] = []
    acc[item.columnName].push(item)
    return acc
  }, {} as Record<string, FooterItem[]>)

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Footer Management</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create footer columns (column1, column2, column3, column4). Each column can have a title, links, or HTML content.
        </p>
          <Button
          onClick={() => {
            setAddOpen(true)
            form.reset({ columnName: 'column1', title: '', logoUrl: '', links: [], socialLinks: [], contactInfo: [], isActive: true })
          }}
          className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          <Plus size={18} />
          Add Footer Item
        </Button>

        {loading ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : (
          <div className="space-y-4">
            {['column1', 'column2', 'column3', 'column4'].map((colName) => {
              const colItems = grouped[colName] || []
              const isOpen = openColumns[colName] ?? true
              return (
                <div key={colName} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenColumns((prev) => ({ ...prev, [colName]: !prev[colName] }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{colName.toUpperCase()}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                        {colItems.length} {colItems.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={18} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                  {isOpen && (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {colItems.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No items</div>
                    ) : (
                      colItems.map((item) => (
                        <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {item.title && <span className="font-medium text-gray-900 dark:text-gray-100">{item.title}</span>}
                              {!item.isActive && <span className="text-xs text-gray-500 dark:text-gray-400">(Inactive)</span>}
                            </div>
                            {item.links.length > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {item.links.length} link{item.links.length !== 1 ? 's' : ''}
                              </div>
                            )}
                            {item.content && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.content.substring(0, 50)}...</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditing(item)}
                              className="rounded-lg border border-gray-300 dark:border-gray-600 p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                              aria-label="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(item)}
                              className="rounded-lg border border-red-200 dark:border-red-800 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              aria-label="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Footer Item" size="lg">
        <form onSubmit={onAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Column *</label>
            <select {...form.register('columnName')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100">
              <option value="column1">Column 1</option>
              <option value="column2">Column 2</option>
              <option value="column3">Column 3</option>
              <option value="column4">Column 4</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input {...form.register('title')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100" placeholder="e.g. Quick Links" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
            <input {...form.register('logoUrl')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Links</label>
            <div className="space-y-2">
              {linkFields.map((field, idx) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    {...form.register(`links.${idx}.label`)}
                    placeholder="Label"
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  />
                  <input
                    {...form.register(`links.${idx}.url`)}
                    placeholder="URL"
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  />
                  <button type="button" onClick={() => removeLink(idx)} className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendLink({ label: '', url: '' })}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={14} />
                Add Link
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Social Media Links</label>
            <div className="space-y-2">
              {socialFields.map((field, idx) => (
                <div key={field.id} className="flex gap-2">
                  <select
                    {...form.register(`socialLinks.${idx}.platform`)}
                    className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Platform</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                  <input
                    {...form.register(`socialLinks.${idx}.url`)}
                    placeholder="URL"
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  />
                  <button type="button" onClick={() => removeSocial(idx)} className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendSocial({ platform: '', url: '' })}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={14} />
                Add Social Link
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Info</label>
            <div className="space-y-2">
              {contactFields.map((field, idx) => (
                <div key={field.id} className="flex gap-2">
                  <select
                    {...form.register(`contactInfo.${idx}.type`)}
                    className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Type</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="address">Address</option>
                  </select>
                  <input
                    {...form.register(`contactInfo.${idx}.value`)}
                    placeholder="Value"
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  />
                  <button type="button" onClick={() => removeContact(idx)} className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendContact({ type: '', value: '' })}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus size={14} />
                Add Contact Info
              </button>
            </div>
          </div>
          <div className="flex items-center pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...form.register('isActive')} className="rounded border-gray-300 text-indigo-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600">
              {submitting ? 'Saving...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Footer Item" size="lg">
        {editing && (
          <form onSubmit={onEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Column *</label>
              <select {...form.register('columnName')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100">
                <option value="column1">Column 1</option>
                <option value="column2">Column 2</option>
                <option value="column3">Column 3</option>
                <option value="column4">Column 4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input {...form.register('title')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
              <input {...form.register('logoUrl')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Links</label>
              <div className="space-y-2">
                {linkFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...form.register(`links.${idx}.label`)}
                      placeholder="Label"
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <input
                      {...form.register(`links.${idx}.url`)}
                      placeholder="URL"
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <button type="button" onClick={() => removeLink(idx)} className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendLink({ label: '', url: '' })}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Link
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Social Media Links</label>
              <div className="space-y-2">
                {socialFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <select
                      {...form.register(`socialLinks.${idx}.platform`)}
                      className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Platform</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                    <input
                      {...form.register(`socialLinks.${idx}.url`)}
                      placeholder="URL"
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <button type="button" onClick={() => removeSocial(idx)} className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendSocial({ platform: '', url: '' })}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Social Link
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Info</label>
              <div className="space-y-2">
                {contactFields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <select
                      {...form.register(`contactInfo.${idx}.type`)}
                      className="w-28 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Type</option>
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="address">Address</option>
                    </select>
                    <input
                      {...form.register(`contactInfo.${idx}.value`)}
                      placeholder="Value"
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    />
                    <button type="button" onClick={() => removeContact(idx)} className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendContact({ type: '', value: '' })}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Contact Info
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content (Description)</label>
              <textarea
                {...form.register('content')}
                rows={3}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Copyright Text</label>
              <input {...form.register('copyrightText')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Powered By Text</label>
              <input {...form.register('poweredByText')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <input type="number" {...form.register('sortOrder', { valueAsNumber: true })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100" />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...form.register('isActive')} className="rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600">
                {submitting ? 'Saving...' : 'Update'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {deleting && (
        <ConfirmModal
          open
          onCancel={() => setDeleting(null)}
          onConfirm={onDelete}
          title="Delete Footer Item"
          message={`Delete footer item "${deleting.title || deleting.columnName}"?`}
          confirmLabel="Delete"
          danger
          loading={submitting}
        />
      )}
    </>
  )
}
