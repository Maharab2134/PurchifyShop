import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock, User } from 'lucide-react'
import Input from '@/components/atoms/Input'
import PasswordInput from '@/components/atoms/PasswordInput'
import MainLayout from '@/components/templates/MainLayout'
import { authApi } from '@/api/auth'
import { setUser } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { useState } from 'react'

interface Form { name: string; email: string; password: string; terms: boolean }

function getPasswordStrength(password: string): { label: 'Easy' | 'Hard' | 'Strong'; colorClass: string } {
  const pwd = password || ''
  const length = pwd.length
  const hasLower = /[a-z]/.test(pwd)
  const hasUpper = /[A-Z]/.test(pwd)
  const hasNumber = /\d/.test(pwd)
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd)

  // Default / very weak
  if (length < 8) {
    return { label: 'Easy', colorClass: 'text-red-600 dark:text-red-400' }
  }

  const score =
    (hasLower ? 1 : 0) +
    (hasUpper ? 1 : 0) +
    (hasNumber ? 1 : 0) +
    (hasSymbol ? 1 : 0) +
    (length >= 12 ? 1 : 0)

  if (score >= 4) return { label: 'Strong', colorClass: 'text-green-600 dark:text-green-400' }
  return { label: 'Hard', colorClass: 'text-amber-600 dark:text-amber-400' }
}

export default function SignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { control, handleSubmit, register, watch, formState: { errors } } = useForm<Form>({
    defaultValues: { name: '', email: '', password: '', terms: false },
  })

  const passwordValue = watch('password') || ''
  const passwordStrength = getPasswordStrength(passwordValue)

  const onSubmit = async (data: Form) => {
    setError(null)
    setLoading(true)
    try {
      // Don't send terms checkbox to API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { terms, ...payload } = data
      const { data: res } = await authApi.signUp(payload)
      const token = res.data.accessToken
      const user = res.data.user
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token)
        localStorage.setItem('user', JSON.stringify(user))
      }
      dispatch(setUser({ user }))
      navigate('/')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err.response?.data?.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign up to get started with your account
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm p-4 rounded-lg mb-6 flex items-center gap-2">
                <span className="text-red-500">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                    <User size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                  <Input<Form>
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    control={control}
                    validation={{
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                    }}
                    error={errors.name?.message}
                    className="pl-12 py-3 text-base"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                    <Mail size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                  <Input<Form>
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    control={control}
                    validation={{ required: 'Email is required' }}
                    error={errors.email?.message}
                    className="pl-12 py-3 text-base"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
                    <Lock size={20} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </div>
                  <PasswordInput<Form>
                    name="password"
                    placeholder="Create a password"
                    control={control}
                    validation={{
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    }}
                    error={errors.password?.message}
                    className="pl-12"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Must be at least 8 characters long
                  </p>
                  <p className={`text-xs font-semibold ${passwordStrength.colorClass}`}>
                    {passwordValue.length === 0 ? '' : passwordStrength.label}
                  </p>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 mt-1 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  {...register('terms', { required: 'You must agree before creating an account' })}
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <Link to="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms?.message && (
                <p className="text-sm text-red-600 dark:text-red-400 -mt-3">
                  {errors.terms.message}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
                  loading ? 'cursor-not-allowed opacity-70' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/sign-in"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
