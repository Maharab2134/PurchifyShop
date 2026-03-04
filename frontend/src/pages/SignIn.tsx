import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock } from 'lucide-react'
import Input from '@/components/atoms/Input'
import PasswordInput from '@/components/atoms/PasswordInput'
import MainLayout from '@/components/templates/MainLayout'
import { authApi } from '@/api/auth'
import { setUser, logout } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { useState } from 'react'

interface Form { email: string; password: string }

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { control, handleSubmit, formState: { errors } } = useForm<Form>({
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: Form) => {
    setError(null)
    setLoading(true)
    try {
      const { data: res } = await authApi.signIn(data)
      const token = res.data.accessToken
      const user = res.data.user
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', token)
        localStorage.setItem('user', JSON.stringify(user))
      }
      // Dispatch user update first
      dispatch(setUser({ user }))
      
      // Navigate after state update
      // Using requestAnimationFrame to ensure state update completes before navigation
      requestAnimationFrame(() => {
        const role = (user?.role ?? '').toUpperCase()
        // Only SUPERADMIN and ADMIN without custom role should use admin login
        // USER role and ADMIN with custom role (roleModel) can login from user login page
        const hasCustomRole = !!(user?.roleModel && user.roleModel.id)
        
        if (role === 'SUPERADMIN' || (role === 'ADMIN' && !hasCustomRole)) {
          // Clear session and redirect full admins to admin login page
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('user')
          }
          dispatch(logout())
          // Show error message that admin should use admin login
          setError('Admin users must login through the admin login page. Redirecting...')
          setTimeout(() => {
            navigate('/purchify/login', { replace: true })
          }, 1500)
          setLoading(false)
          return
        }
        // USER role and ADMIN with custom role can proceed to home page
        navigate('/')
      })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string }; status?: number } }
      setError(err.response?.data?.message || err.response?.status === 422
        ? 'Email or password is incorrect.'
        : 'An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-3 sm:p-4 lg:p-6 py-8 sm:py-10 lg:py-12">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm p-4 rounded-lg mb-6 flex items-center gap-2">
                <span className="text-red-500">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    placeholder="Enter your password"
                    control={control}
                    validation={{
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' },
                    }}
                    error={errors.password?.message}
                    className="pl-12"
                  />
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/password-reset"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm sm:text-base ${
                  loading ? 'cursor-not-allowed opacity-70' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
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

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/sign-up"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
