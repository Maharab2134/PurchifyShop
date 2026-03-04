import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'

interface SKUSuggestInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  suggestions: string[]
  placeholder?: string
  className?: string
}

export default function SKUSuggestInput({
  value,
  onChange,
  onBlur,
  suggestions,
  placeholder = 'SKU',
  className = '',
}: SKUSuggestInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions
        .filter((sku) => sku.toLowerCase().includes(value.toLowerCase()) && sku !== value)
        .slice(0, 5)
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
    }
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (sku: string) => {
    onChange(sku)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (filteredSuggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            setShowSuggestions(false)
            onBlur?.()
          }, 200)
        }}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm ${className}`}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((sku) => (
            <button
              key={sku}
              type="button"
              onClick={() => handleSelect(sku)}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition flex items-center gap-2"
            >
              <Check size={14} className="text-indigo-600" />
              <span className="font-mono">{sku}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
