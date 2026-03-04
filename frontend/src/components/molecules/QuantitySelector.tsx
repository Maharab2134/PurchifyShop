import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  itemId: string
  onUpdate?: (id: string, quantity: number) => Promise<void>
  isLoading?: boolean
}

export default function QuantitySelector({
  value,
  onChange,
  itemId,
  onUpdate,
  isLoading = false,
}: QuantitySelectorProps) {
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async (newQty: number) => {
    if (newQty < 1 || newQty === value || updating) return
    setUpdating(true)
    onChange(newQty)
    if (onUpdate) {
      try {
        await onUpdate(itemId, newQty)
      } catch {
        onChange(value)
      }
    }
    setUpdating(false)
  }

  const isDisabled = updating || isLoading

  return (
    <div className="flex items-center gap-2 rounded-full max-w-fit border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1">
      <button
        type="button"
        onClick={() => handleUpdate(value - 1)}
        disabled={isDisabled || value <= 1}
        className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-[32px] text-center font-semibold text-gray-800 dark:text-gray-200">
        {value}
      </span>
      <button
        type="button"
        onClick={() => handleUpdate(value + 1)}
        disabled={isDisabled}
        className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
