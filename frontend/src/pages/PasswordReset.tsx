import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import Input from '@/components/atoms/Input'
import Button from '@/components/atoms/Button'
import { authApi } from '@/api/auth'
export default function PasswordReset() {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { email: '' },
  })
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const onSubmit = async (data: { email: string }) => {
    try {
      setErrorMessage('')
      setSuccessMessage('')
      await authApi.forgotPassword(data)
      setSuccessMessage(
        `Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.`
      )
      reset()
    } catch (err: any) {
      console.error('Error:', err)
      setErrorMessage(
        err?.response?.data?.message ||
          'Something went wrong, please try again.'
      )
      setSuccessMessage('')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-6 rounded shadow-md w-full max-w-[500px] border border-gray-100 dark:border-gray-700"
      >
        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-center text-green-700 dark:text-green-300 w-full mx-auto px-4 py-[18px] rounded relative mb-4">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-center text-red-700 dark:text-red-300 w-full mx-auto px-4 py-[18px] rounded relative mb-4">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}

        <h2 className="text-[16px] font-medium mb-4 text-gray-800 dark:text-gray-200">
          Enter your user account's verified email address and we will send you
          a password reset link.
        </h2>

        <Input
          type="email"
          name="email"
          placeholder="Email address"
          control={control}
          validation={{ required: 'Email is required' }}
          className="py-4 w-full"
        />

        <Button
          type="submit"
          className="bg-indigo-600 dark:bg-indigo-500 mt-4 text-white w-full py-[12px] rounded hover:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          Send reset link
        </Button>

        <Link className="mt-4 hover:underline text-indigo-600 dark:text-indigo-400" to="/sign-in">
          Return to sign in
        </Link>
      </form>
    </div>
  )
}
