import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface ToggleableTextProps {
  content: string
  truncateLength?: number
  className?: string
  truncateClassName?: string
  fullClassName?: string
}

const truncateText = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length)}...` : text

export default function ToggleableText({
  content,
  truncateLength = 30,
  className = '',
  truncateClassName = 'truncate',
  fullClassName = 'whitespace-pre-wrap',
}: ToggleableTextProps) {
  const [isFullVisible, setIsFullVisible] = useState(false)

  const displayedText = isFullVisible
    ? content
    : truncateText(content, truncateLength)

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span
        className={`text-[14px] text-gray-800 dark:text-gray-200 ${
          isFullVisible ? fullClassName : truncateClassName
        }`}
      >
        {displayedText}
      </span>
      {content.length > truncateLength && (
        <button
          onClick={() => setIsFullVisible(!isFullVisible)}
          className="text-gray-500 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors duration-200 focus:outline-none"
          aria-label={isFullVisible ? 'Hide full text' : 'Show full text'}
        >
          {isFullVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  )
}
