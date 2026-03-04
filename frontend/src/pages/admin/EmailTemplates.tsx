import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Plus, Pencil, Trash2, Sparkles, Send, Loader2, ToggleLeft, ToggleRight, Copy } from 'lucide-react'
import Button from '@/components/atoms/Button'
import RichTextEditor from '@/components/admin/RichTextEditor'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Modal from '@/components/common/Modal'
import { adminApi } from '@/api/admin'
import useToast from '@/hooks/useToast'

type TemplateForm = {
  eventType: string
  name: string
  subject: string
  bodyHtml: string
  bodyText: string
  isEnabled: boolean
}

type EmailTemplate = {
  id: string
  eventType: string
  name: string
  subject: string
  bodyHtml: string
  bodyText: string | null
  availableVariables: Record<string, string>
  isEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

export default function EmailTemplates() {
  const { showToast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [eventTypes, setEventTypes] = useState<Record<string, string>>({})
  const [variables, setVariables] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null)
  const [deleteTemplate, setDeleteTemplate] = useState<EmailTemplate | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testEmails, setTestEmails] = useState<Record<string, string>>({})

  const { control, handleSubmit, reset, watch } = useForm<TemplateForm>({
    defaultValues: {
      eventType: '',
      name: '',
      subject: '',
      bodyHtml: '',
      bodyText: '',
      isEnabled: true,
    },
  })

  const selectedEventType = watch('eventType')

  useEffect(() => {
    loadTemplates()
    loadEventTypes()
  }, [])

  const loadTemplates = async () => {
    try {
      const res = await adminApi.emailTemplates.list()
      setTemplates(res.data.data)
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to load templates', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadEventTypes = async () => {
    try {
      const res = await adminApi.emailTemplates.getEventTypes()
      setEventTypes(res.data.data.eventTypes)
      setVariables(res.data.data.variables)
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to load event types', 'error')
    }
  }

  const onAdd = handleSubmit(async (data) => {
    setSubmitting(true)
    try {
      await adminApi.emailTemplates.create({
        eventType: data.eventType,
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        bodyText: data.bodyText || undefined,
        isEnabled: data.isEnabled,
      })
      showToast('Template created successfully', 'success')
      setAddOpen(false)
      reset()
      loadTemplates()
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to create template', 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onEdit = handleSubmit(async (data) => {
    if (!editTemplate) return
    setSubmitting(true)
    try {
      await adminApi.emailTemplates.update(editTemplate.id, {
        eventType: data.eventType,
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        bodyText: data.bodyText || undefined,
        isEnabled: data.isEnabled,
      })
      showToast('Template updated successfully', 'success')
      setEditTemplate(null)
      reset()
      loadTemplates()
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to update template', 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onDelete = async () => {
    if (!deleteTemplate) return
    setSubmitting(true)
    try {
      await adminApi.emailTemplates.delete(deleteTemplate.id)
      showToast('Template deleted successfully', 'success')
      setDeleteTemplate(null)
      loadTemplates()
    } catch (e: any) {
      showToast(e?.response?.data?.message || 'Failed to delete template', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (template: EmailTemplate) => {
    setEditTemplate(template)
    reset({
      eventType: template.eventType,
      name: template.name,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyText: template.bodyText || '',
      isEnabled: template.isEnabled,
    })
  }

  const handleTestEmail = async (templateId: string) => {
    const email = testEmails[templateId] || ''
    if (!email.trim()) {
      showToast('Please enter an email address', 'error')
      return
    }
    setTesting(templateId)
    try {
      await adminApi.emailTemplates.testEmail(templateId, { email: email.trim() })
      showToast('Test email sent successfully!', 'success')
      setTestEmails({ ...testEmails, [templateId]: '' })
    } catch (e: any) {
      showToast(e?.response?.data?.message || e?.response?.data?.error || 'Failed to send test email', 'error')
    } finally {
      setTesting(null)
    }
  }

  const insertVariable = (variable: string) => {
    // This is handled by copyVariable - user can paste into editor
    // The copyVariable function already copies the variable to clipboard
  }

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`)
    showToast(`Copied {{${variable}}}`, 'success')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Email Templates
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage email templates for order events with dynamic variables
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            reset()
            setAddOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={18} />
          Add Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <Sparkles className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No email templates yet.</p>
          <Button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {eventTypes[template.eventType] || template.eventType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {template.isEnabled ? (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                      Enabled
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                      Disabled
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {template.subject}
              </p>

              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  onClick={() => openEdit(template)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Pencil size={14} className="mr-1" />
                  Edit
                </Button>
                <Button
                  type="button"
                  onClick={() => setDeleteTemplate(template)}
                  className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {/* Test Email */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testEmails[template.id] || ''}
                    onChange={(e) => setTestEmails({ ...testEmails, [template.id]: e.target.value })}
                    placeholder="test@example.com"
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <Button
                    type="button"
                    onClick={() => handleTestEmail(template.id)}
                    disabled={testing === template.id || !testEmails[template.id]?.trim()}
                    className="px-2 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {testing === template.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(addOpen || editTemplate) && (
        <TemplateFormModal
          control={control}
          eventTypes={eventTypes}
          variables={variables}
          selectedEventType={selectedEventType}
          onSubmit={editTemplate ? onEdit : onAdd}
          onCancel={() => {
            setAddOpen(false)
            setEditTemplate(null)
            reset()
          }}
          submitting={submitting}
          isEdit={!!editTemplate}
          onCopyVariable={copyVariable}
        />
      )}

      <ConfirmModal
        open={!!deleteTemplate}
        title="Delete Template"
        message={deleteTemplate ? `Delete "${deleteTemplate.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={submitting}
        onConfirm={onDelete}
        onCancel={() => setDeleteTemplate(null)}
      />
    </div>
  )
}

function TemplateFormModal({
  control,
  eventTypes,
  variables,
  selectedEventType,
  onSubmit,
  onCancel,
  submitting,
  isEdit,
  onCopyVariable,
}: {
  control: any
  eventTypes: Record<string, string>
  variables: Record<string, Record<string, string>>
  selectedEventType: string
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  isEdit: boolean
  onCopyVariable: (variable: string) => void
}) {
  const availableVars = selectedEventType ? (variables[selectedEventType] || {}) : {}

  return (
    <Modal open={true} onClose={onCancel} title={isEdit ? 'Edit Email Template' : 'Add Email Template'} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type *
            </label>
            <Controller
              name="eventType"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <select
                  {...field}
                  disabled={isEdit}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                >
                  <option value="">Select event type</option>
                  {Object.entries(eventTypes).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name *
            </label>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <input
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Order Confirmation Email"
                />
              )}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Subject <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(Optional - Auto-generated if empty)</span>
          </label>
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Leave empty for auto-generated subject based on order status"
              />
            )}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty to auto-generate subject, or use variables like {'{{'}user_name{'}}'}, {'{{'}order_id{'}}'}, {'{{'}order_status{'}}'}, etc.
          </p>
        </div>

        {/* Available Variables */}
        {selectedEventType && Object.keys(availableVars).length > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Available Variables
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(availableVars).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onCopyVariable(key)}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center gap-1"
                  title={`Click to copy {{${key}}}`}
                >
                  <Copy size={12} />
                  {label} ({`{{${key}}}`})
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Click any variable to copy it. Paste into subject or body to use.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Body (HTML) *
          </label>
          <Controller
            name="bodyHtml"
            control={control}
            rules={{ required: 'Required' }}
            render={({ field }) => (
              <RichTextEditor
                name="bodyHtml"
                control={control}
                placeholder={`Enter email body HTML. Use variables like {{user_name}}, {{order_id}}, etc.`}
                className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-500"
                editorKey={isEdit ? `edit-${selectedEventType}` : 'add'}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Body (Plain Text) - Optional
          </label>
          <Controller
            name="bodyText"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Plain text version (optional). If not provided, HTML will be converted to text."
              />
            )}
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Controller
            name="isEnabled"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable this template
                </span>
              </label>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition shadow-lg shadow-indigo-500/30"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              isEdit ? 'Update Template' : 'Create Template'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
