import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { Plus, Pencil, Trash2, Users as UsersIcon, ToggleLeft, ToggleRight } from 'lucide-react'
import ConfirmModal from '@/components/admin/ConfirmModal'
import Modal from '@/components/common/Modal'
import Button from '@/components/atoms/Button'
import { adminApi, type AdminUser } from '@/api/admin'
import useToast from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'

type FormValues = { name: string; email: string; password: string; role: string | any; roleId: string }

const ROLES = ['USER', 'ADMIN', 'SUPERADMIN'] as const

type Role = {
  id: string
  name: string
  description?: string | null
  permissions: string[]
  isActive?: boolean
}

export default function AdminUsers() {
  const { showToast } = useToast()
  const { user: currentUser } = useAuth()
  const location = useLocation()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN'

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: { name: '', email: '', password: '', role: 'USER', roleId: '' },
  })

  const selectedRole = watch('role')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, rolesRes] = await Promise.all([
        adminApi.users.list(),
        isSuperAdmin ? adminApi.roles.list().catch(() => ({ data: { data: { roles: [] } } })) : Promise.resolve({ data: { data: { roles: [] } } }),
      ])
      setUsers(usersRes.data.data?.users ?? [])
      setRoles(rolesRes.data.data?.roles ?? [])
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
    setSubmitting(true)
    try {
      // Handle custom role selection
      let role = data.role
      let roleId = data.roleId || null
      
      if (typeof role === 'string' && role.startsWith('CUSTOM_')) {
        roleId = role.replace('CUSTOM_', '')
        role = 'ADMIN' // Custom roles are assigned as ADMIN with roleId
      }
      
      await adminApi.users.create({
        name: data.name,
        email: data.email,
        password: data.password,
        role: role,
        roleId: roleId,
      })
      showToast('User created.', 'success')
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
    if (!editUser) return
    setSubmitting(true)
    try {
      // Handle custom role selection
      let role = data.role
      let roleId = data.roleId || null
      
      if (typeof role === 'string' && role.startsWith('CUSTOM_')) {
        roleId = role.replace('CUSTOM_', '')
        role = 'ADMIN' // Custom roles are assigned as ADMIN with roleId
      }
      
      await adminApi.users.update(editUser.id, {
        name: data.name,
        email: data.email,
        password: data.password || undefined,
        role: role,
        roleId: roleId,
      })
      showToast('User updated.', 'success')
      setEditUser(null)
      reset()
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  const onToggleUserActive = async (u: AdminUser) => {
    if (!isSuperAdmin || u.id === currentUser?.id) return
    setTogglingUserId(u.id)
    try {
      await adminApi.users.update(u.id, { isActive: !(u.isActive ?? true) })
      showToast(u.isActive === false ? 'User activated.' : 'User deactivated.', 'success')
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update'
      showToast(msg, 'error')
    } finally {
      setTogglingUserId(null)
    }
  }

  const onDelete = async () => {
    if (!deleteUser) return
    setSubmitting(true)
    try {
      await adminApi.users.delete(deleteUser.id)
      showToast('User deleted.', 'success')
      setDeleteUser(null)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (u: AdminUser) => {
    setEditUser(u)
    setValue('name', u.name)
    setValue('email', u.email)
    setValue('password', '') // leave blank = keep current
    // If user has a custom role, show it in the dropdown
    if (u.roleId && u.roleModel) {
      // Set role to show custom role in dropdown (will be converted to ADMIN + roleId on save)
      setValue('role', `CUSTOM_${u.roleId}`)
      setValue('roleId', u.roleId)
    } else {
      setValue('role', u.role)
      setValue('roleId', '')
    }
  }

  return (
    
      <><div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Users</h1>
          <Button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus size={18} />
            Add User
          </Button>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        )}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {!loading && !error && users.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <UsersIcon className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 mb-4">No users yet.</p>
            <Button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Plus size={18} />
              Add User
            </Button>
          </div>
        )}
        {!loading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                  {isSuperAdmin && <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>}
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{u.name}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">
                      {/* Show only one role: custom role if exists, otherwise main role */}
                      {u.roleModel ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          {u.roleModel.name}
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === 'SUPERADMIN' ? 'bg-orange-100 text-orange-800' : u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${(u.isActive ?? true) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {(u.isActive ?? true) ? 'Active' : 'Inactive'}
                        </span>
                        {u.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => onToggleUserActive(u)}
                            disabled={!!togglingUserId}
                            className="ml-2 p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title={(u.isActive ?? true) ? 'Deactivate user' : 'Activate user'}
                            aria-label={(u.isActive ?? true) ? 'Deactivate' : 'Activate'}
                          >
                            {togglingUserId === u.id ? (
                              <span className="w-5 h-5 block border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                            ) : (u.isActive ?? true) ? (
                              <ToggleRight size={20} />
                            ) : (
                              <ToggleLeft size={20} />
                            )}
                          </button>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(u)} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg" aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                        <button type="button" onClick={() => setDeleteUser(u)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" aria-label="Delete">
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
          <UserFormModal control={control} roles={ROLES} customRoles={roles.filter((r) => r.isActive !== false)} onSubmit={onAdd} onCancel={() => { setAddOpen(false); reset(); }} submitting={submitting} showPassword isSuperAdmin={isSuperAdmin} form={{ setValue, watch }} />
        )}
        {editUser && (
          <UserFormModal
            control={control}
            roles={ROLES}
            customRoles={roles.filter((r) => r.isActive !== false)}
            onSubmit={onEdit}
            onCancel={() => { setEditUser(null); reset(); }}
            submitting={submitting}
            showPassword={false}
            isSuperAdmin={isSuperAdmin}
            form={{ setValue, watch }}
            editingUserRole={editUser.role}
          />
        )}
        <ConfirmModal
          open={!!deleteUser}
          title="Delete User"
          message={deleteUser ? `Delete "${deleteUser.name}"? This cannot be undone.` : ''}
          confirmLabel="Delete"
          danger
          loading={submitting}
          onConfirm={onDelete}
          onCancel={() => setDeleteUser(null)}
        />
      </div>
    </>
  )
}

function UserFormModal({
  control,
  roles,
  customRoles,
  onSubmit,
  onCancel,
  submitting,
  showPassword,
  isSuperAdmin,
  form,
  editingUserRole,
}: {
  control: import('react-hook-form').Control<FormValues>
  roles: readonly string[]
  customRoles: Role[]
  onSubmit: () => void
  onCancel: () => void
  submitting: boolean
  showPassword: boolean
  isSuperAdmin: boolean
  form: any
  editingUserRole?: string
}) {
  const selectedRoleValue = useWatch({ control, name: 'role' }) || 'USER'
  const selectedRole = typeof selectedRoleValue === 'string' && selectedRoleValue.startsWith('CUSTOM_') ? 'ADMIN' : selectedRoleValue
  const roleLocked = editingUserRole === 'SUPERADMIN'
  return (
    <Modal open={true} onClose={onCancel} title={showPassword ? 'Add User' : 'Edit User'} size="md">
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <input {...field} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Full name" />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <Controller
              name="email"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <input {...field} type="email" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Email" />
              )}
            />
          </div>
          {showPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
              <Controller
                name="password"
                control={control}
                rules={{ required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } }}
                render={({ field }) => (
                  <input {...field} type="password" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Min 8 characters" />
                )}
              />
            </div>
          )}
          {!showPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password (leave blank to keep)</label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <input {...field} type="password" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="Optional" />
                )}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
            <Controller
              name="role"
              control={control}
              rules={{ required: 'Required' }}
              render={({ field }) => (
                <div className="relative">
                  <select 
                    value={field.value || 'USER'}
                    onChange={(e) => {
                      if (roleLocked) return
                      const value = e.target.value
                      // If it's a custom role (starts with "CUSTOM_"), handle it specially
                      if (value.startsWith('CUSTOM_')) {
                        const customRoleId = value.replace('CUSTOM_', '')
                        const customRole = customRoles.find(r => r.id === customRoleId)
                        if (customRole) {
                          field.onChange(value) // Keep the CUSTOM_ prefix for display
                          // Set roleId immediately using form.setValue
                          if (form && form.setValue) {
                            form.setValue('roleId', customRoleId, { shouldDirty: true })
                          }
                        }
                      } else {
                        field.onChange(value)
                        // Clear roleId if selecting a standard role
                        if (value === 'USER' && form && form.setValue) {
                          form.setValue('roleId', '', { shouldDirty: true })
                        }
                      }
                    }}
                    disabled={roleLocked}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none pr-8 ${roleLocked ? 'cursor-not-allowed opacity-70 bg-gray-100 dark:bg-gray-800' : 'cursor-pointer'}`}
                  >
                    {/* Standard roles */}
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    {/* Custom roles */}
                    {customRoles.length > 0 && (
                      <>
                        <optgroup label="Custom Roles">
                          {customRoles.map((r) => (
                            <option key={r.id} value={`CUSTOM_${r.id}`}>
                              {r.name} {r.description ? `(${r.description})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      </>
                    )}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {roleLocked ? 'SUPERADMIN role cannot be changed.' : 'Select a role for this user. Custom roles will be assigned as ADMIN with specific permissions.'}
            </p>
          </div>
          {/* Hide the separate custom role field since custom roles are now in the main dropdown */}
          {false && isSuperAdmin && (selectedRole === 'ADMIN' || selectedRole === 'SUPERADMIN') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign Custom Role (Optional)</label>
              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <select 
                      {...field} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer pr-8"
                    >
                      <option value="">— No Custom Role —</option>
                      {customRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.description ? `(${r.description})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Assign a custom role to limit which sections this admin can access.</p>
            </div>
          )}
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
