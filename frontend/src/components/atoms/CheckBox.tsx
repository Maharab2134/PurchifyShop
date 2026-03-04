import { Check } from 'lucide-react'
import { Controller, type Control, type FieldPath } from 'react-hook-form'

interface CheckBoxProps<T extends Record<string, any>> {
  className?: string
  name: FieldPath<T>
  control: Control<T>
  label?: string
  defaultValue?: boolean
  onChangeExtra?: (name: FieldPath<T>, value: boolean) => void
  icon?: React.ReactNode
}

export default function CheckBox<T extends Record<string, any>>({
  className = '',
  name,
  control,
  label,
  defaultValue = false,
  onChangeExtra,
  icon,
}: CheckBoxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as any}
      render={({ field }) => (
        <div
          className={`flex items-center space-x-2 cursor-pointer ${className}`}
          onClick={() => {
            const newValue = !field.value
            field.onChange(newValue)
            if (onChangeExtra) {
              onChangeExtra(name, newValue)
            }
          }}
        >
          <div
            className={`w-5 h-5 flex items-center justify-center border rounded-md transition-all ${
              field.value ? 'bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500' : 'border-gray-400 dark:border-gray-500'
            }`}
          >
            {field.value && (
              <div className="text-white w-4 h-4 flex items-center justify-center">
                {icon || <Check className="w-4 h-4" />}
              </div>
            )}
          </div>
          {label && (
            <span className="text-gray-700 dark:text-gray-300 select-none font-medium">{label}</span>
          )}
        </div>
      )}
    />
  )
}
