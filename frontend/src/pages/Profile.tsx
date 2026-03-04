import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import {
  User,
  Shield,
  Mail,
  Calendar,
  Edit3,
  Camera,
  CheckCircle,
  AlertCircle,
  Settings,
  LogOut,
  MapPin,
  Plus,
  Trash2,
  X,
  Save,
  Phone,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react'
import MainLayout from '@/components/templates/MainLayout'
import WithAuth from '@/components/HOC/WithAuth'
import { authApi } from '@/api/auth'
import { addressesApi, type Address } from '@/api/addresses'
import { generateUserAvatar } from '@/utils/placeholderImage'
import useToast from '@/hooks/useToast'
import { formatPhoneInput, phoneValidationRule } from '@/utils/phoneValidation'
import { logout, setUser as setUserAction } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { useNavigate } from 'react-router-dom'
import Modal from '@/components/common/Modal'

function UserProfile() {
  const { showToast } = useToast()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
  } = useForm<{ name: string; email: string; phone: string }>({
    defaultValues: { name: '', email: '', phone: '' },
  })

  const {
    control: addressControl,
    handleSubmit: handleAddressSubmit,
    reset: resetAddress,
  } = useForm<{
    label: string
    street: string
    city: string
    state: string
    country: string
    zip: string
  }>({
    defaultValues: {
      label: '',
      street: '',
      city: '',
      state: 'Bangladesh',
      country: 'Bangladesh',
      zip: '',
    },
  })

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    watch: watchPassword,
  } = useForm<{
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    loadProfile()
    loadAddresses()
  }, [])

  useEffect(() => {
    if (user && isEditing) {
      resetProfile({ name: user.name || '', email: user.email || '', phone: user.phone || '' })
    }
  }, [user, isEditing, resetProfile])

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true)
      const res = await addressesApi.getAll()
      setAddresses(res.data.data ?? [])
    } catch (err: any) {
      console.error('Error loading addresses:', err)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleSaveProfile = handleProfileSubmit(async (data) => {
    if (!data.phone?.trim()) {
      showToast('Phone number is required', 'error')
      return
    }
    try {
      setSavingProfile(true)
      const res = await authApi.updateProfile({
        name: data.name || undefined,
        email: data.email || undefined,
        phone: data.phone?.trim() || undefined,
      })
      setUser(res.data.data.user)
      dispatch(setUserAction({ user: res.data.data.user }))
      setIsEditing(false)
      showToast('Profile updated successfully', 'success')
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  })

  const openAddressModal = (addr?: Address) => {
    setEditingAddress(addr || null)
    if (addr) {
      resetAddress({
        label: addr.label || '',
        street: addr.street,
        city: addr.city,
        state: addr.state,
        country: addr.country,
        zip: addr.zip,
      })
    } else {
      resetAddress({
        label: '',
        street: '',
        city: '',
        state: 'Bangladesh',
        country: 'Bangladesh',
        zip: '',
      })
    }
    setAddressModalOpen(true)
  }

  const handleSaveAddress = handleAddressSubmit(async (data) => {
    try {
      setSavingAddress(true)
      if (editingAddress) {
        await addressesApi.update(editingAddress.id, data)
        showToast('Address updated successfully', 'success')
      } else {
        await addressesApi.create(data)
        showToast('Address added successfully', 'success')
      }
      setAddressModalOpen(false)
      setEditingAddress(null)
      await loadAddresses()
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save address', 'error')
    } finally {
      setSavingAddress(false)
    }
  })

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await addressesApi.delete(id)
      showToast('Address deleted successfully', 'success')
      await loadAddresses()
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete address', 'error')
    }
  }

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await authApi.me()
      setUser(res.data.data.user)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError(err?.response?.data?.message || 'Failed to load profile')
      showToast(
        err?.response?.data?.message || 'Failed to load profile',
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    dispatch(logout())
    navigate('/sign-in')
  }

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format role for display
  const formatRole = (role: string) => {
    return role.charAt(0) + role.slice(1).toLowerCase()
  }

  // Get role color
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      USER: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      ADMIN: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      SUPERADMIN: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    }
    return colors[role] || colors.USER
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
              <div className="animate-pulse">
                {/* Header skeleton */}
                <div className="h-32 sm:h-40 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                  <div className="absolute -bottom-8 sm:-bottom-12 left-4 sm:left-8">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-300 dark:bg-gray-600 rounded-full border-4 border-white dark:border-gray-700"></div>
                  </div>
                </div>

                {/* Content skeleton */}
                <div className="pt-12 sm:pt-16 p-4 sm:p-8">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !user) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8 px-3 sm:px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100 dark:border-red-900/50 p-6 sm:p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Profile Error
                </h3>
                <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">
                  {error || 'Unable to fetch your profile. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
          >
            {/* Header with gradient background */}
            <div className="relative h-32 sm:h-40 bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="absolute inset-0 bg-black/10"></div>

              {/* Avatar */}
              <div className="absolute -bottom-8 sm:-bottom-12 left-4 sm:left-8">
                <div className="relative group">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.src = generateUserAvatar(user.name || user.id, 128)
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg sm:text-xl">
                        {getInitials(user.name || user.id)}
                      </span>
                    </div>
                  )}

                  {/* Edit avatar button */}
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                  </button>

                  {/* Online status */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors duration-200">
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-12 sm:pt-16 p-4 sm:p-8">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                    {user.name || 'User Profile'}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    Manage your account information and preferences
                  </p>
                </div>

                {isEditing ? (
                  <div className="mt-4 sm:mt-0 flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        resetProfile()
                      }}
                      className="inline-flex items-center space-x-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium shadow-lg hover:bg-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingProfile ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium shadow-lg hover:bg-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {/* User Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Basic Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-4 sm:p-6 border border-blue-200/50 dark:border-blue-800/50"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Basic Info
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
                      {isEditing ? (
                        <Controller
                          name="name"
                          control={profileControl}
                          rules={{ required: 'Name is required' }}
                          render={({ field, fieldState }) => (
                            <div>
                              <input
                                {...field}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                                placeholder="Full Name"
                              />
                              {fieldState.error && (
                                <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                              )}
                            </div>
                          )}
                        />
                      ) : (
                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                          {user.name || 'Not provided'}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User ID</p>
                      <p className="text-gray-600 dark:text-gray-300 font-mono text-xs break-all">
                        {user.id}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Contact Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-4 sm:p-6 border border-green-200/50 dark:border-green-800/50"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Contact
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Email Address
                      </p>
                      {isEditing ? (
                        <Controller
                          name="email"
                          control={profileControl}
                          rules={{
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address',
                            },
                          }}
                          render={({ field, fieldState }) => (
                            <div>
                              <input
                                {...field}
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                                placeholder="Email Address"
                              />
                              {fieldState.error && (
                                <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                              )}
                            </div>
                          )}
                        />
                      ) : (
                        <p className="text-gray-800 dark:text-gray-200 font-medium break-all">
                          {user.email || 'Not provided'}
                        </p>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          Email verified
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Phone Number
                      </p>
                      {isEditing ? (
                        <Controller
                          name="phone"
                          control={profileControl}
                          rules={phoneValidationRule}
                          render={({ field, fieldState }) => (
                            <div>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                                <input
                                  {...field}
                                  type="tel"
                                  inputMode="numeric"
                                  maxLength={11}
                                  onChange={(e) => {
                                    const formatted = formatPhoneInput(e.target.value)
                                    field.onChange(formatted)
                                  }}
                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                                  placeholder="01XXXXXXXXX"
                                />
                              </div>
                              {fieldState.error && (
                                <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldState.error.message}</p>
                              )}
                            </div>
                          )}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <p className="text-gray-800 dark:text-gray-200 font-medium">
                            {user.phone || 'Not provided'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Role & Status Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 sm:p-6 border border-purple-200/50 dark:border-purple-800/50"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Role & Status
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Account Role</p>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {formatRole(user.role)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Account Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl p-4 sm:p-6 border border-orange-200/50 dark:border-orange-800/50 sm:col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Account Info
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">Recently</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">Recently</p>
                    </div>
                  </div>
                </motion.div>

                {/* Password Change Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl p-4 sm:p-6 border border-red-200/50 dark:border-red-800/50 sm:col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                        <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Password
                        </h3>
                      </div>
                    </div>
                    {!showPasswordChange && (
                      <button
                        onClick={() => setShowPasswordChange(true)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 text-xs font-medium transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Change</span>
                      </button>
                    )}
                  </div>

                  {showPasswordChange ? (
                    <form onSubmit={handlePasswordSubmit(async (data) => {
                      if (data.newPassword !== data.confirmPassword) {
                        showToast('New passwords do not match', 'error')
                        return
                      }
                      try {
                        setChangingPassword(true)
                        await authApi.changePassword({
                          currentPassword: data.currentPassword,
                          newPassword: data.newPassword,
                        })
                        showToast('Password changed successfully', 'success')
                        setShowPasswordChange(false)
                        resetPassword()
                      } catch (err: any) {
                        showToast(err?.response?.data?.message || 'Failed to change password', 'error')
                      } finally {
                        setChangingPassword(false)
                      }
                    })} className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
                        <div className="relative">
                          <Controller
                            name="currentPassword"
                            control={passwordControl}
                            rules={{ required: 'Current password is required' }}
                            render={({ field, fieldState }) => (
                              <>
                                <input
                                  {...field}
                                  type={showCurrentPassword ? 'text' : 'password'}
                                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm ${fieldState.error ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'}`}
                                  placeholder="Enter current password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                {fieldState.error && (
                                  <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                                )}
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">New Password</label>
                        <div className="relative">
                          <Controller
                            name="newPassword"
                            control={passwordControl}
                            rules={{ required: 'New password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
                            render={({ field, fieldState }) => (
                              <>
                                <input
                                  {...field}
                                  type={showNewPassword ? 'text' : 'password'}
                                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm ${fieldState.error ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'}`}
                                  placeholder="Enter new password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                {fieldState.error && (
                                  <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                                )}
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Confirm New Password</label>
                        <div className="relative">
                          <Controller
                            name="confirmPassword"
                            control={passwordControl}
                            rules={{ 
                              required: 'Please confirm your password',
                              validate: (value) => value === watchPassword('newPassword') || 'Passwords do not match'
                            }}
                            render={({ field, fieldState }) => (
                              <>
                                <input
                                  {...field}
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm ${fieldState.error ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'}`}
                                  placeholder="Confirm new password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                {fieldState.error && (
                                  <p className="text-red-500 text-xs mt-1">{fieldState.error.message}</p>
                                )}
                              </>
                            )}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={changingPassword}
                          className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 text-sm font-medium disabled:opacity-50"
                        >
                          {changingPassword ? 'Changing...' : 'Change Password'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false)
                            resetPassword()
                          }}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Password</p>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">••••••••</p>
                    </div>
                  )}
                </motion.div>

                {/* Addresses Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-xl p-4 sm:p-6 border border-teal-200/50 dark:border-teal-800/50 sm:col-span-2 lg:col-span-3"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Saved Addresses
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => openAddressModal()}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-600 dark:bg-teal-500 text-white rounded-lg hover:bg-teal-700 dark:hover:bg-teal-600 text-xs font-medium transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Address</span>
                    </button>
                  </div>

                  {loadingAddresses ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">Loading addresses...</div>
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                      <p>No saved addresses</p>
                      <p className="text-xs mt-1">Add an address to use during checkout</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {addr.label && (
                                <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{addr.label}</p>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {addr.street}, {addr.city}, {addr.state}, {addr.country} - {addr.zip}
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => openAddressModal(addr)}
                                className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                aria-label="Edit address"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                aria-label="Delete address"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Address Modal */}
        <Modal
          open={addressModalOpen}
          onClose={() => {
            setAddressModalOpen(false)
            setEditingAddress(null)
            resetAddress()
          }}
          title={editingAddress ? 'Edit Address' : 'Add New Address'}
          size="md"
        >
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <Controller
              name="label"
              control={addressControl}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Label (optional)
                  </label>
                  <input
                    {...field}
                    placeholder="e.g., Home, Office"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
              )}
            />

            <Controller
              name="street"
              control={addressControl}
              rules={{ required: 'Street is required' }}
              render={({ field, fieldState }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address *
                  </label>
                  <input
                    {...field}
                    placeholder="Street address"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  />
                  {fieldState.error && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="city"
                control={addressControl}
                rules={{ required: 'City is required' }}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City *
                    </label>
                    <input
                      {...field}
                      placeholder="City"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    {fieldState.error && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="state"
                control={addressControl}
                rules={{ required: 'State is required' }}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State *
                    </label>
                    <input
                      {...field}
                      placeholder="State"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    {fieldState.error && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="country"
                control={addressControl}
                rules={{ required: 'Country is required' }}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country *
                    </label>
                    <input
                      {...field}
                      placeholder="Country"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    {fieldState.error && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                name="zip"
                control={addressControl}
                rules={{ required: 'ZIP code is required' }}
                render={({ field, fieldState }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      {...field}
                      placeholder="ZIP"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    {fieldState.error && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setAddressModalOpen(false)
                  setEditingAddress(null)
                  resetAddress()
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingAddress}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
              >
                {savingAddress ? 'Saving...' : editingAddress ? 'Update' : 'Add Address'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  )
}

export default WithAuth(UserProfile)
