import { Controller, type Control, type FieldValues, type Path, type RegisterOptions } from 'react-hook-form'

interface InputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  type?: string
  placeholder?: string
  validation?: RegisterOptions<T, Path<T>>
  className?: string
  error?: string
  label?: string
}

export default function Input<T extends FieldValues>({
  control,
  name,
  type = 'text',
  placeholder,
  validation = {},
  className = '',
  error,
  label,
}: InputProps<T>) {
  return (
    <div className="w-full">
      {label && <label className="text-gray-700 dark:text-gray-300 font-medium">{label}</label>}
      <Controller
        name={name}
        control={control}
        rules={validation}
        render={({ field }) => (
          <input
            {...field}
            type={type}
            placeholder={placeholder}
            className={`w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all ${className}`}
          />
        )}
      />
      {error && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}
