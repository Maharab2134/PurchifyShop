import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, CreditCard } from 'lucide-react'
import Button from '@/components/atoms/Button'
import { adminApi, type AdminPaymentMethod } from '@/api/admin'
import useToast from '@/hooks/useToast'
import { formatPhoneInput } from '@/utils/phoneValidation'

type FormValues = {
  slug: string
  name: string
  isActive: boolean
  requiresSenderAndTxn: boolean
  number: string
  instruction: string
  charge: number
  sortOrder: number
  accountNumber: string
  bankName: string
  branch: string
  accountHolder: string
}

export default function PaymentMethodForm() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEditMode = !!id

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      slug: '',
      name: '',
      isActive: true,
      requiresSenderAndTxn: false,
      number: '',
      instruction: '',
      charge: 0,
      sortOrder: 0,
      accountNumber: '',
      bankName: '',
      branch: '',
      accountHolder: '',
    },
  })

  const requiresSenderAndTxn = watch('requiresSenderAndTxn')

  useEffect(() => {
    if (isEditMode && id) {
      loadPaymentMethod()
    }
  }, [id, isEditMode])

  const loadPaymentMethod = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await adminApi.paymentMethods.get(parseInt(id))
      const method = res.data.data
      reset({
        slug: method.slug || '',
        name: method.name || '',
        isActive: method.isActive ?? true,
        requiresSenderAndTxn: method.requiresSenderAndTxn ?? false,
        number: method.config?.number || '',
        instruction: method.config?.instruction || '',
        charge: method.charge || 0,
        sortOrder: method.sortOrder || 0,
        accountNumber: method.config?.accountNumber || '',
        bankName: method.config?.bankName || '',
        branch: method.config?.branch || '',
        accountHolder: method.config?.accountHolder || '',
      })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load payment method'
      showToast(msg, 'error')
      navigate('/dashboard/payment-methods')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!data.slug.trim() || !data.name.trim()) {
      showToast('Slug and name are required.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        slug: data.slug.trim().toLowerCase().replace(/\s+/g, '_'),
        name: data.name.trim(),
        isActive: data.isActive,
        requiresSenderAndTxn: data.requiresSenderAndTxn,
        charge: data.charge || 0,
        config: data.number || data.instruction || data.accountNumber || data.bankName || data.branch || data.accountHolder
          ? {
              number: data.number || undefined,
              instruction: data.instruction || undefined,
              accountNumber: data.accountNumber || undefined,
              bankName: data.bankName || undefined,
              branch: data.branch || undefined,
              accountHolder: data.accountHolder || undefined,
            }
          : undefined,
        sortOrder: data.sortOrder || 0,
      }

      if (isEditMode && id) {
        await adminApi.paymentMethods.update(parseInt(id), {
          name: payload.name,
          isActive: payload.isActive,
          config: payload.config,
          charge: payload.charge,
          sortOrder: payload.sortOrder,
        })
        showToast('Payment method updated successfully.', 'success')
      } else {
        await adminApi.paymentMethods.create(payload)
        showToast('Payment method created successfully.', 'success')
      }
      navigate('/dashboard/payment-methods')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (isEditMode ? 'Update failed' : 'Create failed')
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  })

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/dashboard/payment-methods"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to Payment Methods</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100">
              {isEditMode ? 'Edit Payment Method' : 'Add Payment Method'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isEditMode ? 'Update payment method details' : 'Create a new payment method'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Basic Information
            </h2>

            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  {...register('slug', { required: 'Slug is required' })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="e.g. paypal, stripe, bank_account"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unique identifier (lowercase, no spaces). Cannot be changed after creation.
                </p>
                {errors.slug && (
                  <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g. PayPal, Stripe, Bank Account"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort Order
              </label>
              <input
                {...register('sortOrder', { valueAsNumber: true })}
                type="number"
                min={0}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Lower numbers appear first in the list
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">Active</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                (Only active payment methods are shown to users)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('requiresSenderAndTxn')}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Requires Sender Number & Transaction ID
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                (For bKash, Nagad, Rocket, etc.)
              </p>
            </div>
          </div>

          {/* Mobile Payment Fields */}
          {requiresSenderAndTxn && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                Mobile Payment Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Number (bKash/Nagad/Rocket)
                </label>
                <Controller
                  name="number"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="tel"
                      inputMode="numeric"
                      maxLength={11}
                      onChange={(e) => {
                        const formatted = formatPhoneInput(e.target.value)
                        field.onChange(formatted)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="01XXXXXXXXX"
                    />
                  )}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Users will send money to this number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instruction (Optional)
                </label>
                <textarea
                  {...register('instruction')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  placeholder="e.g. Send money to this number, then enter your number & transaction ID."
                />
              </div>
            </div>
          )}

          {/* Bank Account Fields */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Bank Account Details (Optional)
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Holder Name
              </label>
              <input
                {...register('accountHolder')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Name
              </label>
              <input
                {...register('bankName')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g. Sonali Bank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch
              </label>
              <input
                {...register('branch')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g. Dhanmondi Branch"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Number
              </label>
              <input
                {...register('accountNumber')}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g. 1234567890"
              />
            </div>
          </div>

          {/* Charge */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
              Payment Charge
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Charge (৳) - Fixed amount per transaction
              </label>
              <input
                {...register('charge', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500/30 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Charge amount for 1000 taka. Will be calculated proportionally based on order total.
                Example: If charge is 12.5 for 1000, then for 174.99 it will be 2.19.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/dashboard/payment-methods"
              className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition shadow-lg shadow-indigo-500/30"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditMode ? 'Saving...' : 'Creating...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={16} />
                  {isEditMode ? 'Save Changes' : 'Create Payment Method'}
                </span>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
