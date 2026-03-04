import { useState } from 'react'
import { Controller, type Control, type FieldValues, type Path, type RegisterOptions } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  placeholder?: string
  validation?: RegisterOptions<T, Path<T>>
  className?: string
  error?: string
  label?: string
}

export default function PasswordInput<T extends FieldValues>({
  control,
  name,
  placeholder,
  validation = {},
  className = '',
  error,
  label,
}: PasswordInputProps<T>) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative w-full">
      {label && <label className="text-gray-700 dark:text-gray-300 font-medium">{label}</label>}
      <Controller
        name={name}
        control={control}
        rules={validation}
        render={({ field }) => (
          <div className="relative">
            <input
              {...field}
              type={showPassword ? 'text' : 'password'}
              placeholder={placeholder}
              className={`w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all ${className}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={20} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <Eye size={20} className="text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
        )}
      />
      {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}
