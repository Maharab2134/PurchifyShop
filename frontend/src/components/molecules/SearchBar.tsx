import { useState, useRef, useEffect } from 'react'
import { Search, X, Clock, ArrowRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { configApi } from '@/api/config'

interface SearchFormValues {
  searchQuery: string
}

interface SearchBarProps {
  placeholder?: string
}

const DEFAULT_PLACEHOLDER = 'Search products, brands...'

export default function SearchBar({ placeholder: placeholderProp }: SearchBarProps) {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, watch } = useForm<SearchFormValues>({
    defaultValues: { searchQuery: '' },
  })
  const [placeholderSource, setPlaceholderSource] = useState(DEFAULT_PLACEHOLDER)
  const [typedPlaceholder, setTypedPlaceholder] = useState('')
  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    const stored = localStorage.getItem('recentQueries')
    return stored ? JSON.parse(stored) : []
  })
  const [isFocused, setIsFocused] = useState(false)
  const [isHoveringDropdown, setIsHoveringDropdown] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchQuery = watch('searchQuery')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const fallback = placeholderProp || DEFAULT_PLACEHOLDER
    configApi.get().then((s) => setPlaceholderSource(s || fallback)).catch(() => setPlaceholderSource(fallback))
  }, [placeholderProp])

  useEffect(() => {
    const fullText = placeholderSource.trim()
    if (!fullText) {
      setTypedPlaceholder('')
      return
    }
    
    let charIndex = 0
    let isDeleting = false
    let pauseCount = 0
    setTypedPlaceholder('')
    
    const t = setInterval(() => {
      if (!isDeleting) {
        if (charIndex < fullText.length) {
          setTypedPlaceholder(fullText.substring(0, charIndex + 1))
          charIndex++
          pauseCount = 0
        } else {
          // Wait before starting to delete (pause for 20 intervals = 2 seconds)
          pauseCount++
          if (pauseCount >= 20) {
            isDeleting = true
            pauseCount = 0
          }
        }
      } else {
        if (charIndex > 0) {
          charIndex--
          setTypedPlaceholder(fullText.substring(0, charIndex))
        } else {
          // Small pause before starting to type again (5 intervals = 0.5 seconds)
          pauseCount++
          if (pauseCount >= 5) {
            isDeleting = false
            pauseCount = 0
            charIndex = 0
          }
        }
      }
    }, 100) // Character typing speed: 100ms per character
    
    return () => clearInterval(t)
  }, [placeholderSource])

  const placeholder = typedPlaceholder || placeholderSource

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        formRef.current &&
        !formRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (data: SearchFormValues) => {
    const query = data.searchQuery.trim()
    if (query) {
      const updated = recentQueries.includes(query)
        ? recentQueries
        : [query, ...recentQueries.slice(0, 4)]
      setRecentQueries(updated)
      localStorage.setItem('recentQueries', JSON.stringify(updated))
      navigate(`/shop?search=${encodeURIComponent(query)}`)
    }
    setIsFocused(false)
  }

  const handleSelectRecentQuery = (query: string) => {
    setValue('searchQuery', query)
    setTimeout(() => handleSubmit(handleSearch)(), 100)
  }

  const clearSearch = () => {
    setValue('searchQuery', '')
    inputRef.current?.focus()
  }

  const removeRecentQuery = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const newQueries = [...recentQueries]
    newQueries.splice(index, 1)
    setRecentQueries(newQueries)
    localStorage.setItem('recentQueries', JSON.stringify(newQueries))
  }

  const showSearchResults = isFocused || isHoveringDropdown

  return (
    <div className="relative w-full max-w-xl">
      <form ref={formRef} onSubmit={handleSubmit(handleSearch)} className="relative">
        <div className="flex items-center">
          <div className="relative flex items-center w-full">
            <span className="absolute left-3 text-indigo-600 dark:text-indigo-400 transition-all duration-300">
              <Search
                className={`transition-all duration-300 ${
                  isFocused ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'
                }`}
                size={18}
              />
            </span>
            <input
              type="text"
              placeholder={placeholder}
              className="w-full py-2.5 pl-10 pr-12 bg-white dark:bg-gray-800 rounded-full text-gray-800 dark:text-gray-100 placeholder-gray-600 dark:placeholder-gray-400 border-2 border-gray-200 dark:border-gray-600
               focus:border-indigo-600 dark:focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-sm transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
              {...register('searchQuery')}
              onFocus={() => setIsFocused(true)}
              ref={(e) => {
                inputRef.current = e
                const { ref } = register('searchQuery')
                if (typeof ref === 'function') ref(e)
              }}
              autoComplete="off"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-12 p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-all duration-200"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
            <button
              type="submit"
              className="absolute right-2 p-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white transition-all duration-300 hover:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {showSearchResults && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-[1000] border border-gray-100 dark:border-gray-700 overflow-hidden"
            onMouseEnter={() => setIsHoveringDropdown(true)}
            onMouseLeave={() => setIsHoveringDropdown(false)}
          >
            {recentQueries.length > 0 && (
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Clock size={14} className="mr-2" />
                    <span className="font-medium">Recent Searches</span>
                  </div>
                  <button
                    className="text-xs text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200"
                    onClick={() => {
                      setRecentQueries([])
                      localStorage.removeItem('recentQueries')
                    }}
                  >
                    Clear all
                  </button>
                </div>
                <ul className="grid grid-cols-3 gap-2">
                  {recentQueries.map((query, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center py-1 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 group transition-all duration-200"
                      onClick={() => handleSelectRecentQuery(query)}
                    >
                      <div className="flex items-center overflow-hidden">
                        <Search size={12} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="text-sm truncate">{query}</span>
                      </div>
                      <button
                        onClick={(e) => removeRecentQuery(index, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-opacity duration-200 flex-shrink-0"
                      >
                        <X size={12} className="text-gray-500 dark:text-gray-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
