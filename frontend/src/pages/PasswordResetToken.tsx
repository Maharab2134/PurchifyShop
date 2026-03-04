import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Input from '@/components/atoms/Input'
import Button from '@/components/atoms/Button'
import { authApi } from '@/api/auth'
import useToast from '@/hooks/useToast'

export default function PasswordResetWithToken() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { handleSubmit, control } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const onSubmit = async (formData: {
    password: string
    confirmPassword: string
  }) => {
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match')
      setIsError(true)
      return
    }

    if (!token) {
      setMessage('Invalid reset token')
      setIsError(true)
      return
    }

    try {
      setIsLoading(true)
      setMessage('')
      setIsError(false)
      await authApi.resetPassword({
        token,
        newPassword: formData.password,
      })
      setMessage('Password reset successful! You can now log in.')
      setIsError(false)
      showToast('Password reset successful!', 'success')
      setTimeout(() => {
        navigate('/sign-in')
      }, 2000)
    } catch (err: any) {
      setMessage(
        err?.response?.data?.message || 'Something went wrong. Please try again.'
      )
      setIsError(true)
      showToast(
        err?.response?.data?.message || 'Failed to reset password',
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-[500px] gap-4 border border-gray-100 dark:border-gray-700"
      >
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Reset Your Password</h1>

        {message && (
          <div
            className={`w-full text-center py-[22px] mb-4 rounded ${
              isError
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-2 border-red-400 dark:border-red-700'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-2 border-green-400 dark:border-green-700'
            }`}
          >
            {message}
          </div>
        )}

        <Input
          type="password"
          name="password"
          placeholder="New Password"
          control={control}
          validation={{
            required: 'Password is required',
            minLength: { value: 6, message: 'Minimum 6 characters' },
          }}
          className="py-4 w-full"
        />

        <Input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          control={control}
          validation={{ required: 'Confirm your password' }}
          className="py-4 w-full"
        />

        <Button
          type="submit"
          className="bg-indigo-600 dark:bg-indigo-500 mt-4 text-white w-full py-[12px] rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </Button>

        <Link className="mt-4 hover:underline text-indigo-600 dark:text-indigo-400" to="/sign-in">
          Return to sign in
        </Link>
      </form>
    </div>
  )
}
