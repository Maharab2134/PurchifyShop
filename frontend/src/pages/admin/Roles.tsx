import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { Plus, Pencil, Trash2, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/atoms/Button'
import { adminApi } from '@/api/admin'
import useToast from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'

const AVAILABLE_SECTIONS = [
  'Overview',
  'Products',
  'Sales',
  'Users & Support',
  'Analytics',
  'Content',
  'Settings',
] as const

type Role = {
  id: string
  name: string
  description?: string | null
  permissions: string[]
  isActive?: boolean
  usersCount: number
  createdAt?: string
}

type FormValues = {
  name: string
  description: string
  permissions: string[]
}

export default function AdminRoles() {
  const { showToast } = useToast()
  const { user: currentUser } = useAuth()
  const location = useLocation()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [deleteRole, setDeleteRole] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null)
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN'

  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: { name: '', description: '', permissions: [] },
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.roles.list()
      setRoles(res.data.data?.roles ?? [])
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

  const onAdd = handleSubmit(async (data) => {
    if (data.permissions.length === 0) {
      showToast('Please select at least one section permission', 'error')
      return
    }
    setSubmitting(true)
    try {
      await adminApi.roles.create({
        name: data.name,
        description: data.description || undefined,
        permissions: data.permissions,
      })
      showToast('Role created.', 'success')
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
    if (!editRole) return
    if (data.permissions.length === 0) {
      showToast('Please select at least one section permission', 'error')
      return
    }
    setSubmitting(true)
    try {
      await adminApi.roles.update(editRole.id, {
        name: data.name,
        description: data.description || undefined,
        permissions: data.permissions,
      })
      showToast('Role updated.', 'success')
      setEditRole(null)
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
    if (!deleteRole) return
    setSubmitting(true)
    try {
      await adminApi.roles.delete(deleteRole.id)
      showToast('Role deleted.', 'success')
      setDeleteRole(null)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const onToggleRoleActive = async (r: Role) => {
    if (!isSuperAdmin) return
    setTogglingRoleId(r.id)
    try {
      await adminApi.roles.update(r.id, { isActive: !(r.isActive ?? true) })
      showToast(r.isActive === false ? 'Role activated.' : 'Role deactivated.', 'success')
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update'
      showToast(msg, 'error')
    } finally {
      setTogglingRoleId(null)
    }
  }

  const openEdit = async (r: Role) => {
    try {
      const res = await adminApi.roles.get(r.id)
      const role = res.data.data
      setEditRole(role)
      reset({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
      })
    } catch {
      showToast('Failed to load role details.', 'error')
    }
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Roles</h1>
          <Button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={18} />
            Add Role
          </Button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {!loading && !error && roles.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Shield className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No roles yet. Create a role to assign section permissions to admins.</p>
            <Button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus size={18} />
              Add Role
            </Button>
          </div>
        )}

        {!loading && !error && roles.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Permissions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Users</th>
                    {isSuperAdmin && <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>}
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{r.name}</td>
                      <td className="py-3 px-4 text-gray-600">{r.description || '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {r.permissions.length > 0 ? (
                            r.permissions.map((p) => (
                              <span key={p} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">No permissions</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{r.usersCount}</td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${(r.isActive ?? true) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {(r.isActive ?? true) ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleRoleActive(r)}
                            disabled={!!togglingRoleId}
                            className="ml-2 p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title={(r.isActive ?? true) ? 'Deactivate role' : 'Activate role'}
                            aria-label={(r.isActive ?? true) ? 'Deactivate' : 'Activate'}
                          >
                            {togglingRoleId === r.id ? (
                              <span className="w-5 h-5 block border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                            ) : (r.isActive ?? true) ? (
                              <ToggleRight size={20} />
                            ) : (
                              <ToggleLeft size={20} />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteRole(r)}
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
          </div>
        )}

        {addOpen && (
          <Modal open={true} onClose={() => { setAddOpen(false); reset(); }} title="Add Role" size="lg">
            <form onSubmit={onAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Role name is required' }}
                  render={({ field, fieldState }) => (
                    <div>
                      <input
                        {...field}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="e.g. Product Manager"
                      />
                      {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Role description (optional)"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Sections *</label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {AVAILABLE_SECTIONS.map((section) => (
                    <label key={section} className="flex items-center gap-2 cursor-pointer">
                      <Controller
                        name="permissions"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value.includes(section)}
                            onChange={(e) => {
                              const current = field.value
                              if (e.target.checked) {
                                field.onChange([...current, section])
                              } else {
                                field.onChange(current.filter((p) => p !== section))
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600"
                          />
                        )}
                      />
                      <span className="text-sm text-gray-700">{section}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">Select which admin panel sections this role can access.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" onClick={() => { setAddOpen(false); reset(); }} className="px-5 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {editRole && (
          <Modal open={true} onClose={() => { setEditRole(null); reset(); }} title={`Edit Role: ${editRole.name}`} size="lg">
            <form onSubmit={onEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Role name is required' }}
                  render={({ field, fieldState }) => (
                    <div>
                      <input
                        {...field}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${fieldState.error ? 'border-red-300' : 'border-gray-300'}`}
                      />
                      {fieldState.error && <p className="mt-1 text-xs text-red-600">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Sections *</label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {AVAILABLE_SECTIONS.map((section) => (
                    <label key={section} className="flex items-center gap-2 cursor-pointer">
                      <Controller
                        name="permissions"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value.includes(section)}
                            onChange={(e) => {
                              const current = field.value
                              if (e.target.checked) {
                                field.onChange([...current, section])
                              } else {
                                field.onChange(current.filter((p) => p !== section))
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600"
                          />
                        )}
                      />
                      <span className="text-sm text-gray-700">{section}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" onClick={() => { setEditRole(null); reset(); }} className="px-5 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Updating...' : 'Update Role'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        <ConfirmModal
          open={!!deleteRole}
          title="Delete Role"
          message={deleteRole ? `Delete "${deleteRole.name}"? ${deleteRole.usersCount > 0 ? `This role is assigned to ${deleteRole.usersCount} user(s). ` : ''}This cannot be undone.` : ''}
          confirmLabel="Delete"
          danger
          loading={submitting}
          onConfirm={onDelete}
          onCancel={() => setDeleteRole(null)}
        />
      </div>
    </>
  )
}
